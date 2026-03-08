import Link from "next/link";
import { TastingEntry } from "@/types/db";
import { formatDateShort, formatScore, scoreToColor } from "@/lib/utils";
import { MapPin } from "lucide-react";

interface TastingEntryCardProps {
  entry: TastingEntry & {
    trip?: { id: string; name: string } | null;
  };
}

export function TastingEntryCard({ entry }: TastingEntryCardProps) {
  return (
    <Link href={`/tastings/${entry.id}`}>
      <div className="border border-border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">{formatDateShort(entry.dateDrank)}</p>
            {entry.trip && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{entry.trip.name}</span>
              </div>
            )}
            {entry.aroma && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                {entry.aroma}
              </p>
            )}
          </div>

          {entry.score != null && (
            <div className="shrink-0 text-right">
              <span className={`text-xl font-bold ${scoreToColor(entry.score)}`}>
                {formatScore(entry.score)}
              </span>
              <p className="text-xs text-muted-foreground">/ 100</p>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
