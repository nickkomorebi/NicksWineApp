import { inngest } from "../client";
import { prisma } from "@/lib/prisma";
import { anthropic, MODELS } from "@/lib/anthropic";

const PARSE_PROMPT = `Parse this wine tasting note into structured fields.

Extract ONLY what is explicitly stated in the transcript.
Use null for anything not mentioned — do not infer or hallucinate.
The "otherNotes" field should contain any interesting observations that don't fit the other categories.`;

export const audioProcess = inngest.createFunction(
  { id: "tasting/audio.process", name: "Process audio tasting note" },
  { event: "tasting/audio.process" },
  async ({ event, step }) => {
    const { tastingId } = event.data as { tastingId: string };

    // Load transcript already saved by the API route
    const transcript = await step.run("load-transcript", async () => {
      const tasting = await prisma.tastingEntry.findUnique({
        where: { id: tastingId },
        select: { audioTranscript: true },
      });
      if (!tasting?.audioTranscript) throw new Error("No transcript found");
      return tasting.audioTranscript;
    });

    // Parse structured tasting notes from transcript
    const structured = await step.run("parse-structured", async () => {
      const response = await anthropic.messages.create({
        model: MODELS.AUDIO,
        max_tokens: 1024,
        tools: [
          {
            name: "parse_tasting_note",
            description: "Parse a wine tasting transcript into structured fields",
            input_schema: {
              type: "object" as const,
              properties: {
                aroma:     { type: "string", nullable: true, description: "Aromas and nose" },
                fruit:     { type: "string", nullable: true, description: "Fruit character, type, and intensity" },
                palate:    { type: "string", nullable: true, description: "Taste and palate structure" },
                finish:    { type: "string", nullable: true, description: "Finish and aftertaste" },
                acidity:   { type: "string", nullable: true, description: "Acidity level and character" },
                tannin:    { type: "string", nullable: true, description: "Tannin level and texture" },
                alcohol:   { type: "string", nullable: true, description: "Alcohol presence and warmth" },
                sweetness: { type: "string", nullable: true, description: "Sweetness level" },
                body:      { type: "string", nullable: true, description: "Body and weight" },
                otherNotes:{ type: "string", nullable: true, description: "Any other interesting observations" },
              },
            },
          },
        ],
        tool_choice: { type: "tool", name: "parse_tasting_note" },
        messages: [
          {
            role: "user",
            content: `${PARSE_PROMPT}\n\nTranscript:\n"${transcript}"`,
          },
        ],
      });

      const toolUse = response.content.find((c) => c.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") return {};
      return toolUse.input as Record<string, string | null>;
    });

    // Save structured fields
    await step.run("save-tasting", async () => {
      await prisma.tastingEntry.update({
        where: { id: tastingId },
        data: {
          audioProcessedAt: new Date(),
          aroma:      structured.aroma      ?? undefined,
          fruit:      structured.fruit      ?? undefined,
          palate:     structured.palate     ?? undefined,
          finish:     structured.finish     ?? undefined,
          acidity:    structured.acidity    ?? undefined,
          tannin:     structured.tannin     ?? undefined,
          alcohol:    structured.alcohol    ?? undefined,
          sweetness:  structured.sweetness  ?? undefined,
          body:       structured.body       ?? undefined,
          otherNotes: structured.otherNotes ?? undefined,
        },
      });
    });

    return { tastingId, transcript, structured };
  }
);
