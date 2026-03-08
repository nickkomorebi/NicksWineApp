import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";

  const wines = await prisma.wine.findMany({
    where: {
      mergedIntoId: null,
      ...(q
        ? {
            OR: [
              { brand: { value: { contains: q, mode: "insensitive" } } },
              { name: { value: { contains: q, mode: "insensitive" } } },
              { vintage: { value: { contains: q, mode: "insensitive" } } },
              { region: { value: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      brand: true,
      name: true,
      vintage: true,
      photos: { where: { isCover: true }, take: 1, select: { url: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ wines });
}
