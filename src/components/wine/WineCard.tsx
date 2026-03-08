import Link from "next/link";
import Image from "next/image";
import { WineListItem } from "@/types/wine";
import { formatScore, scoreToColor, wineDisplayName } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Wine } from "lucide-react";

const WINE_TYPE_COLORS: Record<string, string> = {
  RED: "bg-red-100 text-red-800",
  WHITE: "bg-yellow-50 text-yellow-800",
  ROSE: "bg-pink-100 text-pink-800",
  SPARKLING: "bg-blue-100 text-blue-800",
  DESSERT: "bg-amber-100 text-amber-800",
  FORTIFIED: "bg-orange-100 text-orange-800",
  ORANGE: "bg-orange-200 text-orange-900",
  UNKNOWN: "bg-muted text-muted-foreground",
};

interface WineCardProps {
  wine: WineListItem;
}

export function WineCard({ wine }: WineCardProps) {
  const coverPhoto = wine.photos.find((p) => p.isCover) ?? wine.photos[0];
  const latestTasting = wine.tastingEntries.sort(
    (a, b) => new Date(b.dateDrank).getTime() - new Date(a.dateDrank).getTime()
  )[0];
  const displayName = wineDisplayName(wine);
  const typeColor = WINE_TYPE_COLORS[wine.type] ?? WINE_TYPE_COLORS.UNKNOWN;

  return (
    <Link href={`/wines/${wine.id}`} className="block group">
      <div className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow">
        {/* Photo */}
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {coverPhoto ? (
            <Image
              src={coverPhoto.url}
              alt={displayName}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Wine className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}

          {/* Score badge */}
          {latestTasting?.score != null && (
            <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-xs font-bold shadow">
              <span className={scoreToColor(latestTasting.score)}>
                {formatScore(latestTasting.score)}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 space-y-1.5">
          <p className="font-semibold text-sm leading-tight line-clamp-2">{displayName}</p>

          {(wine.region?.value || wine.country?.value) && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {[wine.region?.value, wine.country?.value].filter(Boolean).join(", ")}
            </p>
          )}

          <div className="flex flex-wrap gap-1 pt-0.5">
            {wine.type !== "UNKNOWN" && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor}`}>
                {wine.type.charAt(0) + wine.type.slice(1).toLowerCase()}
              </span>
            )}
            {wine.varietals[0] && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                {wine.varietals[0].name}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
