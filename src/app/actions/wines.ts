"use server";

import { prisma } from "@/lib/prisma";
import { wineFormSchema, WineFormValues } from "@/schemas/wine.schema";
import { FieldSource } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

function fieldValueCreate(value: string | undefined, source: FieldSource = "USER") {
  if (!value?.trim()) return undefined;
  return {
    create: { value: value.trim(), confidence: 1.0, source },
  };
}

export async function createWine(data: WineFormValues) {
  const parsed = wineFormSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const {
    brand,
    name,
    vintage,
    type,
    country,
    region,
    appellation,
    isNonVintage,
    wineryId,
    varietals,
    tastedBy,
    score,
    dateDrank,
  } = parsed.data;

  const wine = await prisma.wine.create({
    data: {
      type,
      typeSource: "USER",
      typeConfidence: 1.0,
      isNonVintage,
      winery: wineryId ? { connect: { id: wineryId } } : undefined,
      brand: brand ? { create: { value: brand.trim(), confidence: 1.0, source: "USER" } } : undefined,
      name: name ? { create: { value: name.trim(), confidence: 1.0, source: "USER" } } : undefined,
      vintage: vintage && !isNonVintage ? { create: { value: vintage.trim(), confidence: 1.0, source: "USER" } } : undefined,
      country: country ? { create: { value: country.trim(), confidence: 1.0, source: "USER" } } : undefined,
      region: region ? { create: { value: region.trim(), confidence: 1.0, source: "USER" } } : undefined,
      appellation: appellation ? { create: { value: appellation.trim(), confidence: 1.0, source: "USER" } } : undefined,
      varietals: {
        create: varietals.map((v) => ({
          name: v.name,
          percentage: v.percentage,
          confidence: 1.0,
          source: "USER" as FieldSource,
        })),
      },
    },
  });

  // Always create an initial tasting entry for the manual add flow
  await prisma.tastingEntry.create({
    data: {
      wineId: wine.id,
      dateDrank: dateDrank ? new Date(dateDrank) : new Date(),
      score: score ?? undefined,
      tastedBy: tastedBy?.trim() || undefined,
    },
  });

  revalidatePath("/wines");
  return { data: wine };
}

export async function updateWine(id: string, data: Partial<WineFormValues>) {
  const wine = await prisma.wine.findUnique({
    where: { id },
    include: { brand: true, name: true, vintage: true, country: true, region: true, appellation: true },
  });

  if (!wine) return { error: "Wine not found" };

  // Update or create FieldValue for each field
  async function upsertFieldValue(
    existingId: string | null | undefined,
    value: string | undefined,
    field: string
  ) {
    if (!value?.trim()) return;
    if (existingId) {
      await prisma.fieldValue.update({
        where: { id: existingId },
        data: { value: value.trim(), source: "USER", confidence: 1.0 },
      });
    } else {
      const fv = await prisma.fieldValue.create({
        data: { value: value.trim(), source: "USER", confidence: 1.0 },
      });
      await prisma.wine.update({
        where: { id },
        data: { [`${field}Id`]: fv.id },
      });
    }
  }

  if (data.brand !== undefined) await upsertFieldValue(wine.brandId, data.brand, "brand");
  if (data.name !== undefined) await upsertFieldValue(wine.nameId, data.name, "name");
  if (data.vintage !== undefined) await upsertFieldValue(wine.vintageId, data.vintage, "vintage");
  if (data.country !== undefined) await upsertFieldValue(wine.countryId, data.country, "country");
  if (data.region !== undefined) await upsertFieldValue(wine.regionId, data.region, "region");
  if (data.appellation !== undefined) await upsertFieldValue(wine.appellationId, data.appellation, "appellation");

  if (data.type !== undefined || data.isNonVintage !== undefined || data.wineryId !== undefined) {
    await prisma.wine.update({
      where: { id },
      data: {
        ...(data.type !== undefined && { type: data.type, typeSource: "USER", typeConfidence: 1.0 }),
        ...(data.isNonVintage !== undefined && { isNonVintage: data.isNonVintage }),
        ...(data.wineryId !== undefined && { wineryId: data.wineryId || null }),
      },
    });
  }

  if (data.varietals !== undefined) {
    await prisma.wineVarietal.deleteMany({ where: { wineId: id } });
    if (data.varietals.length > 0) {
      await prisma.wineVarietal.createMany({
        data: data.varietals.map((v) => ({
          wineId: id,
          name: v.name,
          percentage: v.percentage,
          confidence: 1.0,
          source: "USER" as FieldSource,
        })),
      });
    }
  }

  revalidatePath(`/wines/${id}`);
  revalidatePath("/wines");
  return { data: { id } };
}

export async function deleteWine(id: string) {
  await prisma.wine.delete({ where: { id } });
  revalidatePath("/wines");
  return { data: { id } };
}

export async function mergeWines(sourceId: string, targetId: string) {
  // Relink all tasting entries from source to target
  await prisma.tastingEntry.updateMany({
    where: { wineId: sourceId },
    data: { wineId: targetId },
  });

  // Mark source as merged into target
  await prisma.wine.update({
    where: { id: sourceId },
    data: { mergedIntoId: targetId },
  });

  revalidatePath("/wines");
  revalidatePath(`/wines/${targetId}`);
  return { data: { targetId } };
}

export async function relinkTasting(tastingId: string, newWineId: string) {
  await prisma.tastingEntry.update({
    where: { id: tastingId },
    data: { wineId: newWineId },
  });

  revalidatePath("/wines");
  return { data: { tastingId } };
}
