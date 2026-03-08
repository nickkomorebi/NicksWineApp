import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";

// Accepts a transcript (from Web Speech API) instead of an audio file
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const tasting = await prisma.tastingEntry.findUnique({ where: { id } });
  if (!tasting) {
    return NextResponse.json({ error: "Tasting not found" }, { status: 404 });
  }

  const { transcript } = await req.json() as { transcript: string };
  if (!transcript?.trim()) {
    return NextResponse.json({ error: "No transcript" }, { status: 400 });
  }

  // Store transcript immediately, clear processed timestamp so status returns "processing"
  await prisma.tastingEntry.update({
    where: { id },
    data: { audioTranscript: transcript, audioProcessedAt: null },
  });

  // Fire Claude parsing job
  await inngest.send({
    name: "tasting/audio.process",
    data: { tastingId: id },
  });

  return NextResponse.json({ status: "processing" });
}
