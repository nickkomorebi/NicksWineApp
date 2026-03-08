import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { anthropic, MODELS } from "@/lib/anthropic";
import { FieldSource, WineType } from "@/generated/prisma";

const VISION_PROMPT = `You are an expert sommelier and wine label reader. Analyze the wine label in this image and extract all visible information.

RULES:
- Only extract information that is CLEARLY VISIBLE on the label
- Use null for any field you cannot read or that is not present
- Do NOT guess or infer values that aren't explicitly shown
- For French/Italian/Spanish wines, the grape variety often isn't listed — that's OK, leave varietals null
- Confidence is 0.0–1.0: use 0.9+ when text is clear, 0.6–0.8 when partially visible, 0.3–0.5 when inferred, null when not present
- For old-world wines: the "type" field should reflect what's printed (e.g., "Burgundy" maps to RED, "Champagne" maps to SPARKLING)
- "brand" is the producer/estate name, "name" is the specific wine name or cuvée`;

interface ExtractedField {
  value: string;
  confidence: number;
  source: FieldSource;
}

interface ExtractedWineData {
  brand: ExtractedField | null;
  name: ExtractedField | null;
  vintage: ExtractedField | null;
  type: { value: WineType; confidence: number; source: FieldSource } | null;
  country: ExtractedField | null;
  region: ExtractedField | null;
  appellation: ExtractedField | null;
  varietals: Array<{ name: string; percentage?: number; confidence: number; source: FieldSource }> | null;
  isNonVintage: boolean;
}

export const visionExtract = inngest.createFunction(
  { id: "wine/vision.extract", name: "Extract wine label via vision" },
  { event: "wine/vision.extract" },
  async ({ event, step }) => {
    const { itemId } = event.data as { itemId: string };

    // Mark as processing
    await step.run("mark-processing", async () => {
      await prisma.uploadBatchItem.update({
        where: { id: itemId },
        data: { status: "PROCESSING" },
      });
    });

    // Download image and extract fields
    const extracted = await step.run("claude-vision", async () => {
      const item = await prisma.uploadBatchItem.findUnique({ where: { id: itemId } });
      if (!item) throw new Error("Item not found");

      // Fetch image from URL
      const imageRes = await fetch(item.url);
      const imageBuffer = await imageRes.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString("base64");
      const raw = imageRes.headers.get("content-type") ?? "image/jpeg";
      const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
      const contentType = allowed.includes(raw) ? raw : "image/jpeg";

      const response = await anthropic.messages.create({
        model: MODELS.VISION,
        max_tokens: 1024,
        tools: [
          {
            name: "extract_wine_label",
            description: "Extract structured wine information from a label image",
            input_schema: {
              type: "object" as const,
              properties: {
                brand: {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["value", "confidence"],
                  nullable: true,
                },
                name: {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["value", "confidence"],
                  nullable: true,
                },
                vintage: {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["value", "confidence"],
                  nullable: true,
                },
                isNonVintage: { type: "boolean" },
                type: {
                  type: "string",
                  enum: ["RED", "WHITE", "ROSE", "SPARKLING", "DESSERT", "FORTIFIED", "ORANGE", "UNKNOWN"],
                  nullable: true,
                },
                typeConfidence: { type: "number" },
                country: {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["value", "confidence"],
                  nullable: true,
                },
                region: {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["value", "confidence"],
                  nullable: true,
                },
                appellation: {
                  type: "object",
                  properties: {
                    value: { type: "string" },
                    confidence: { type: "number" },
                  },
                  required: ["value", "confidence"],
                  nullable: true,
                },
                varietals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      percentage: { type: "number", nullable: true },
                      confidence: { type: "number" },
                    },
                    required: ["name", "confidence"],
                  },
                  nullable: true,
                },
              },
            },
          },
        ],
        tool_choice: { type: "tool", name: "extract_wine_label" },
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: contentType as "image/jpeg" | "image/png" | "image/webp",
                  data: base64,
                },
              },
              { type: "text", text: VISION_PROMPT },
            ],
          },
        ],
      });

      const toolUse = response.content.find((c) => c.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") throw new Error("No tool_use response");

      const input = toolUse.input as Record<string, unknown>;

      type RawField = { value: string; confidence: number };
      const toField = (raw: unknown): ExtractedField | null => {
        if (!raw) return null;
        const r = raw as RawField;
        return { value: r.value, confidence: r.confidence, source: "IMAGE" as FieldSource };
      };

      const extracted: ExtractedWineData = {
        brand: toField(input.brand),
        name: toField(input.name),
        vintage: toField(input.vintage),
        type: input.type
          ? {
              value: input.type as WineType,
              confidence: (input.typeConfidence as number) ?? 0.8,
              source: "IMAGE" as FieldSource,
            }
          : null,
        country: toField(input.country),
        region: toField(input.region),
        appellation: toField(input.appellation),
        varietals: input.varietals
          ? (input.varietals as Array<{ name: string; percentage?: number; confidence: number }>).map(
              (v) => ({ name: v.name, percentage: v.percentage, confidence: v.confidence, source: "IMAGE" as FieldSource })
            )
          : null,
        isNonVintage: (input.isNonVintage as boolean) ?? false,
      };

      return extracted;
    });

    // Save extracted fields
    await step.run("save-extracted", async () => {
      await prisma.uploadBatchItem.update({
        where: { id: itemId },
        data: {
          status: "COMPLETED",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          extractedFields: extracted as any,
        },
      });
    });

    // Check if all items in batch are done → update batch status
    await step.run("check-batch-complete", async () => {
      const item = await prisma.uploadBatchItem.findUnique({
        where: { id: itemId },
        select: { batchId: true },
      });
      if (!item) return;

      const pendingCount = await prisma.uploadBatchItem.count({
        where: { batchId: item.batchId, status: { in: ["PENDING", "PROCESSING"] } },
      });

      if (pendingCount === 0) {
        await prisma.uploadBatch.update({
          where: { id: item.batchId },
          data: { status: "COMPLETED" },
        });
      }
    });

    return { itemId, extracted };
  }
);
