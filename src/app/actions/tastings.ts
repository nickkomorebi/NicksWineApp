"use server";

import { prisma } from "@/lib/prisma";
import { tastingEntrySchema, TastingEntryValues } from "@/schemas/wine.schema";
import { revalidatePath } from "next/cache";

export async function createTasting(data: TastingEntryValues) {
  const parsed = tastingEntrySchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { wineId, tripId, dateDrank, score, ...notes } = parsed.data;

  const tasting = await prisma.tastingEntry.create({
    data: {
      wineId,
      tripId: tripId || undefined,
      dateDrank: dateDrank ? new Date(dateDrank) : new Date(),
      score: score ?? undefined,
      ...notes,
    },
  });

  revalidatePath(`/wines/${wineId}`);
  if (tripId) revalidatePath(`/trips/${tripId}`);
  return { data: tasting };
}

export async function updateTasting(id: string, data: Partial<TastingEntryValues>) {
  const tasting = await prisma.tastingEntry.findUnique({ where: { id } });
  if (!tasting) return { error: "Tasting not found" };

  const updated = await prisma.tastingEntry.update({
    where: { id },
    data: {
      ...(data.dateDrank && { dateDrank: new Date(data.dateDrank) }),
      ...(data.score !== undefined && { score: data.score }),
      ...(data.aroma !== undefined && { aroma: data.aroma }),
      ...(data.fruit !== undefined && { fruit: data.fruit }),
      ...(data.palate !== undefined && { palate: data.palate }),
      ...(data.finish !== undefined && { finish: data.finish }),
      ...(data.acidity !== undefined && { acidity: data.acidity }),
      ...(data.tannin !== undefined && { tannin: data.tannin }),
      ...(data.alcohol !== undefined && { alcohol: data.alcohol }),
      ...(data.sweetness !== undefined && { sweetness: data.sweetness }),
      ...(data.body !== undefined && { body: data.body }),
      ...(data.otherNotes !== undefined && { otherNotes: data.otherNotes }),
      ...(data.tripId !== undefined && { tripId: data.tripId || null }),
    },
  });

  revalidatePath(`/wines/${tasting.wineId}`);
  revalidatePath(`/tastings/${id}`);
  return { data: updated };
}

export async function deleteTasting(id: string) {
  const tasting = await prisma.tastingEntry.findUnique({ where: { id } });
  if (!tasting) return { error: "Not found" };
  await prisma.tastingEntry.delete({ where: { id } });
  revalidatePath(`/wines/${tasting.wineId}`);
  return { data: { id } };
}
