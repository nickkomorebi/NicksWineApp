import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const wine = await prisma.wine.findUnique({
    where: { id },
    include: {
      brand: true,
      name: true,
      vintage: true,
      country: true,
      region: true,
      appellation: true,
      varietals: true,
      photos: true,
      winery: true,
      expectedProfile: true,
      tastingEntries: {
        orderBy: { dateDrank: "desc" },
      },
    },
  });

  if (!wine) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(wine);
}
