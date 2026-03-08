import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { FieldSource, WineType } from "@/generated/prisma";

interface VarietalInput {
  name: string;
  percentage?: number;
  confidence?: number;
  source?: FieldSource;
}

interface FieldInput {
  value: string;
  confidence: number;
  source: FieldSource;
}

interface WineGroup {
  itemIds: string[];
  action: "create" | "link";
  existingWineId?: string;
  fields: {
    brand?: FieldInput;
    name?: FieldInput;
    vintage?: FieldInput;
    // ReviewStep sends type as a nested object; manual confirm sends a plain string
    type?: WineType | { value: WineType; confidence: number; source: FieldSource };
    typeConfidence?: number;
    typeSource?: FieldSource;
    country?: FieldInput;
    region?: FieldInput;
    appellation?: FieldInput;
    varietals?: VarietalInput[];
    isNonVintage?: boolean;
    score?: number;
    dateDrank?: string;
    tastedBy?: string;
    tripId?: string;
  };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  const { batchId } = await params;
  const { groups } = (await req.json()) as { groups: WineGroup[] };

  const batch = await prisma.uploadBatch.findUnique({
    where: { id: batchId },
    include: { items: true },
  });

  if (!batch) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }

  const createdWineIds: string[] = [];

  for (const group of groups) {
    const items = batch.items.filter((i) => group.itemIds.includes(i.id));
    if (!items.length) continue;

    let wineId: string;

    if (group.action === "link" && group.existingWineId) {
      wineId = group.existingWineId;
    } else {
      // Create Wine record
      const { fields } = group;

      // Unwrap type — ReviewStep sends { value, confidence, source }, manual sends plain string
      const typeObj = fields.type && typeof fields.type === "object" ? fields.type : null;
      const typeValue = typeObj ? typeObj.value : (fields.type as WineType | undefined) ?? "UNKNOWN";
      const typeSource = typeObj ? typeObj.source : fields.typeSource ?? "IMAGE";
      const typeConfidence = typeObj ? typeObj.confidence : fields.typeConfidence ?? 0;

      const wine = await prisma.wine.create({
        data: {
          type: typeValue,
          typeSource,
          typeConfidence,
          isNonVintage: fields.isNonVintage ?? false,
          brand: fields.brand
            ? { create: { value: fields.brand.value, confidence: fields.brand.confidence, source: fields.brand.source } }
            : undefined,
          name: fields.name
            ? { create: { value: fields.name.value, confidence: fields.name.confidence, source: fields.name.source } }
            : undefined,
          vintage: fields.vintage && !fields.isNonVintage
            ? { create: { value: fields.vintage.value, confidence: fields.vintage.confidence, source: fields.vintage.source } }
            : undefined,
          country: fields.country
            ? { create: { value: fields.country.value, confidence: fields.country.confidence, source: fields.country.source } }
            : undefined,
          region: fields.region
            ? { create: { value: fields.region.value, confidence: fields.region.confidence, source: fields.region.source } }
            : undefined,
          appellation: fields.appellation
            ? { create: { value: fields.appellation.value, confidence: fields.appellation.confidence, source: fields.appellation.source } }
            : undefined,
          varietals: fields.varietals?.length
            ? {
                create: fields.varietals.map((v) => ({
                  name: v.name,
                  percentage: v.percentage,
                  confidence: v.confidence ?? 0.8,
                  source: v.source ?? "IMAGE",
                })),
              }
            : undefined,
          photos: {
            create: items.map((item, idx) => ({
              storageKey: item.storageKey,
              url: item.url,
              isCover: idx === 0,
              uploadBatchId: batchId,
            })),
          },
        },
      });

      wineId = wine.id;
      createdWineIds.push(wineId);

      // Create a tasting entry for this wine
      await prisma.tastingEntry.create({
        data: {
          wineId,
          tripId: batch.tripId ?? fields.tripId ?? undefined,
          dateDrank: fields.dateDrank ? new Date(fields.dateDrank) : new Date(),
          score: fields.score ?? undefined,
          tastedBy: fields.tastedBy ?? undefined,
        },
      });

      // Fire enrichment
      await inngest.send({
        name: "wine/enrich.expected_profile",
        data: { wineId },
      });
    }

    // Update batch items with wineId
    await prisma.uploadBatchItem.updateMany({
      where: { id: { in: group.itemIds } },
      data: { wineId, status: "COMPLETED" },
    });
  }

  // Mark batch as done
  await prisma.uploadBatch.update({
    where: { id: batchId },
    data: { status: "COMPLETED" },
  });

  return NextResponse.json({ createdWineIds, batchId });
}
