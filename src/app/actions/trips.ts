"use server";

import { prisma } from "@/lib/prisma";
import { tripSchema, TripValues } from "@/schemas/wine.schema";
import { revalidatePath } from "next/cache";

export async function createTrip(data: TripValues) {
  const parsed = tripSchema.safeParse(data);
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { name, date, location, wineryIds, personIds, newWineryNames, newPersonNames, photoUrl, photoStorageKey } = parsed.data;

  // Upsert new wineries
  const createdWineryIds: string[] = [];
  for (const wineryName of newWineryNames) {
    const winery = await prisma.winery.upsert({
      where: { name: wineryName },
      create: { name: wineryName },
      update: {},
    });
    createdWineryIds.push(winery.id);
  }

  // Upsert new people
  const createdPersonIds: string[] = [];
  for (const personName of newPersonNames) {
    const person = await prisma.person.upsert({
      where: { name: personName },
      create: { name: personName },
      update: {},
    });
    createdPersonIds.push(person.id);
  }

  const allWineryIds = [...wineryIds, ...createdWineryIds].slice(0, 8);
  const allPersonIds = [...personIds, ...createdPersonIds];

  const trip = await prisma.trip.create({
    data: {
      name,
      date: new Date(date),
      location,
      ...(photoUrl && { photoUrl }),
      ...(photoStorageKey && { photoStorageKey }),
      wineries: {
        create: allWineryIds.map((wineryId, i) => ({ wineryId, order: i })),
      },
      people: {
        create: allPersonIds.map((personId) => ({ personId })),
      },
    },
  });

  revalidatePath("/trips");
  return { data: trip };
}

export async function updateTrip(id: string, data: Partial<TripValues>) {
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) return { error: "Trip not found" };

  await prisma.trip.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.date && { date: new Date(data.date) }),
      ...(data.location && { location: data.location }),
      ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl }),
      ...(data.photoStorageKey !== undefined && { photoStorageKey: data.photoStorageKey }),
    },
  });

  revalidatePath(`/trips/${id}`);
  revalidatePath("/trips");
  return { data: { id } };
}

export async function deleteTrip(id: string) {
  await prisma.trip.delete({ where: { id } });
  revalidatePath("/trips");
  return { data: { id } };
}
