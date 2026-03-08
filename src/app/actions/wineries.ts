"use server";

import { prisma } from "@/lib/prisma";

export async function upsertWinery(name: string) {
  return prisma.winery.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}

export async function upsertPerson(name: string) {
  return prisma.person.upsert({
    where: { name },
    create: { name },
    update: {},
  });
}
