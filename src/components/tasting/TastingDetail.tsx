"use client";

import Link from "next/link";
import { TastingEntry, Wine, FieldValue, WinePhoto, Trip } from "@/types/db";
import { formatDate, formatScore, scoreToColor, wineDisplayName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar } from "lucide-react";
import { AudioRecorder } from "./AudioRecorder";

type TastingWithRelations = TastingEntry & {
  wine: Wine & { brand: FieldValue | null; name: FieldValue | null; vintage: FieldValue | null; photos: WinePhoto[] };
  trip: Trip | null;
};

interface TastingDetailProps {
  entry: TastingWithRelations;
}

const ASSESSMENT_FIELDS = [
  { key: "aroma", label: "Aroma" },
  { key: "fruit", label: "Fruit" },
  { key: "palate", label: "Palate / Structure" },
  { key: "finish", label: "Finish" },
  { key: "acidity", label: "Acidity" },
  { key: "tannin", label: "Tannin" },
  { key: "alcohol", label: "Alcohol" },
  { key: "sweetness", label: "Sweetness" },
  { key: "body", label: "Body" },
  { key: "otherNotes", label: "Other Notes" },
] as const;

export function TastingDetail({ entry }: TastingDetailProps) {
  const wineName = wineDisplayName(entry.wine);
  const filledFields = ASSESSMENT_FIELDS.filter(
    ({ key }) => entry[key as keyof TastingEntry]
  );

  return (
    <div className="p-4 space-y-6 pb-8">
      {/* Wine link */}
      <Link href={`/wines/${entry.wineId}`} className="block">
        <div className="bg-secondary/50 rounded-xl p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Wine</p>
          <p className="font-semibold">{wineName}</p>
        </div>
      </Link>

      {/* Meta */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {formatDate(entry.dateDrank)}
        </div>
        {entry.trip && (
          <Link href={`/trips/${entry.trip.id}`}>
            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <MapPin className="w-4 h-4" />
              {entry.trip.name}
            </div>
          </Link>
        )}
      </div>

      {/* Score */}
      {entry.score != null && (
        <div className="text-center py-4">
          <span className={`text-5xl font-bold ${scoreToColor(entry.score)}`}>
            {entry.score}
          </span>
          <p className="text-sm text-muted-foreground mt-1">/ 100</p>
        </div>
      )}

      <Separator />

      {/* Tasting Notes */}
      {filledFields.length > 0 ? (
        <div className="space-y-4">
          <h3 className="font-semibold">My Tasting Notes</h3>
          <div className="bg-card border border-border rounded-xl px-4 divide-y divide-border">
            {filledFields.map(({ key, label }) => {
              const value = entry[key as keyof TastingEntry] as string;
              return (
                <div key={key} className="py-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
                  <p className="text-sm mt-1">{value}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground">No tasting notes yet.</p>
        </div>
      )}

      {/* Audio */}
      <Separator />
      <div>
        <h3 className="font-semibold mb-3">Voice Tasting Note</h3>
        <AudioRecorder tastingId={entry.id} hasExistingAudio={!!entry.audioProcessedAt} />
        {entry.audioTranscript && (
          <details className="mt-3">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              View raw transcript
            </summary>
            <p className="text-xs text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
              {entry.audioTranscript}
            </p>
          </details>
        )}
      </div>
    </div>
  );
}
