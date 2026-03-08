import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tasting = await prisma.tastingEntry.findUnique({
    where: { id },
    select: { audioProcessedAt: true, audioTranscript: true },
  });

  if (!tasting) {
    return NextResponse.json({ status: "error" });
  }

  if (tasting.audioProcessedAt) {
    return NextResponse.json({ status: "done" });
  }

  if (tasting.audioTranscript) {
    return NextResponse.json({ status: "processing" });
  }

  return NextResponse.json({ status: "idle" });
}
