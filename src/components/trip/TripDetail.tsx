"use client";

import { useState } from "react";
import Link from "next/link";
import { Trip, TripPerson, Person, TripWinery, Winery, TastingEntry, Wine, FieldValue, WinePhoto } from "@/types/db";
import { formatDate, formatScore, scoreToColor, wineDisplayName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MapPin, Calendar, Users, Upload, LibraryBig } from "lucide-react";
import Image from "next/image";
import { LinkWineSheet } from "./LinkWineSheet";

type TripWithRelations = Trip & {
  people: (TripPerson & { person: Person })[];
  wineries: (TripWinery & { winery: Winery })[];
  tastingEntries: (TastingEntry & {
    wine: Wine & {
      brand: FieldValue | null;
      name: FieldValue | null;
      vintage: FieldValue | null;
      photos: WinePhoto[];
    };
  })[];
};

interface TripDetailProps {
  trip: TripWithRelations;
}

export function TripDetail({ trip }: TripDetailProps) {
  const [linkSheetOpen, setLinkSheetOpen] = useState(false);

  return (
    <div className="p-4 space-y-6 pb-8">
      {/* Meta */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(trip.date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>{trip.location}</span>
        </div>
      </div>

      {/* People */}
      {trip.people.length > 0 && (
        <>
          <Separator />
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Users className="w-4 h-4" />
              People
            </div>
            <div className="flex flex-wrap gap-2">
              {trip.people.map(({ person }) => (
                <span
                  key={person.id}
                  className="bg-secondary text-secondary-foreground text-sm px-3 py-1 rounded-full"
                >
                  {person.name}
                </span>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Wineries */}
      {trip.wineries.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-sm font-semibold mb-2">Wineries Visited</p>
            <ol className="space-y-1">
              {trip.wineries.map(({ winery, order }) => (
                <li key={winery.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-secondary text-secondary-foreground text-xs flex items-center justify-center shrink-0">
                    {order + 1}
                  </span>
                  {winery.name}
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      <Separator />

      {/* Wines tasted */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">
            Wines Tasted ({trip.tastingEntries.length})
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 h-8"
              onClick={() => setLinkSheetOpen(true)}
            >
              <LibraryBig className="w-3.5 h-3.5" />
              Link Existing
            </Button>
            <Link href={`/upload?tripId=${trip.id}`}>
              <Button size="sm" variant="outline" className="gap-1.5 h-8">
                <Upload className="w-3.5 h-3.5" />
                Upload New
              </Button>
            </Link>
          </div>
        </div>

        {trip.tastingEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No wines added yet. Upload a label photo to add one.
          </p>
        ) : (
          <div className="space-y-3">
            {trip.tastingEntries.map((entry) => {
              const coverPhoto = entry.wine.photos[0];
              const displayName = wineDisplayName(entry.wine);
              return (
                <Link key={entry.id} href={`/wines/${entry.wineId}`}>
                  <div className="flex gap-3 p-3 border border-border rounded-xl bg-card hover:shadow-sm transition-shadow">
                    {coverPhoto ? (
                      <div className="w-14 h-14 rounded-lg overflow-hidden relative shrink-0">
                        <Image src={coverPhoto.url} alt={displayName} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-muted shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{displayName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(entry.dateDrank)}</p>
                    </div>
                    {entry.score != null && (
                      <span className={`text-sm font-bold shrink-0 ${scoreToColor(entry.score)}`}>
                        {formatScore(entry.score)}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <LinkWineSheet
        tripId={trip.id}
        open={linkSheetOpen}
        onClose={() => setLinkSheetOpen(false)}
      />
    </div>
  );
}
