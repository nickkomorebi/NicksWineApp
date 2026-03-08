import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { anthropic, MODELS } from "@/lib/anthropic";

export const enrichExpectedProfile = inngest.createFunction(
  { id: "wine/enrich.expected_profile", name: "Enrich wine expected profile" },
  { event: "wine/enrich.expected_profile" },
  async ({ event, step }) => {
    const { wineId } = event.data as { wineId: string };

    const wineData = await step.run("fetch-wine", async () => {
      return prisma.wine.findUnique({
        where: { id: wineId },
        include: {
          brand: true,
          name: true,
          vintage: true,
          country: true,
          region: true,
          appellation: true,
          varietals: true,
        },
      });
    });

    if (!wineData) return { error: "Wine not found" };

    const wineDescription = [
      wineData.vintage?.value,
      wineData.brand?.value,
      wineData.name?.value,
      wineData.varietals.map((v) => v.name).join(", "),
      wineData.region?.value,
      wineData.country?.value,
      wineData.type !== "UNKNOWN" ? wineData.type.toLowerCase() + " wine" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const profile = await step.run("fetch-profile", async () => {
      const response = await anthropic.messages.create({
        model: MODELS.VISION,
        max_tokens: 1024,
        tools: [
          {
            name: "wine_expected_profile",
            description: "Provide the typical/expected profile for this wine based on general knowledge",
            input_schema: {
              type: "object" as const,
              properties: {
                aroma: { type: "string", description: "Typical aromas for this wine style/producer" },
                palate: { type: "string", description: "Typical palate and structure" },
                finish: { type: "string", description: "Typical finish" },
                acidity: { type: "string", description: "Typical acidity level: low/medium/medium-high/high" },
                tannin: { type: "string", description: "Typical tannin: soft/medium/firm/grippy (for reds)" },
                alcohol: { type: "string", description: "Typical alcohol range e.g. 13-14.5%" },
                sweetness: { type: "string", description: "Dry/off-dry/medium/sweet" },
                body: { type: "string", description: "Light/medium/full-bodied" },
                notes: { type: "string", description: "Any other notable characteristics about this wine" },
              },
              required: ["aroma", "palate", "finish", "acidity", "body"],
            },
          },
        ],
        tool_choice: { type: "tool", name: "wine_expected_profile" },
        messages: [
          {
            role: "user",
            content: `You are an expert sommelier. Based on your knowledge of this wine, provide the typical expected profile.

Wine: ${wineDescription}

Use your general knowledge about this wine, producer, and appellation. If this is a specific well-known wine, use that knowledge. If it's more generic, use regional/varietal norms.`,
          },
        ],
      });

      const toolUse = response.content.find((c) => c.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") return null;

      return toolUse.input as Record<string, string>;
    });

    if (!profile) return { error: "Could not generate profile" };

    await step.run("save-profile", async () => {
      await prisma.wineExpectedProfile.upsert({
        where: { wineId },
        create: {
          wineId,
          ...profile,
          source: "claude",
          fetchedAt: new Date(),
        },
        update: {
          ...profile,
          source: "claude",
          fetchedAt: new Date(),
        },
      });
    });

    return { wineId, profile };
  }
);
