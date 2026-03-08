import Link from "next/link";
import Image from "next/image";
import { Trip, TripPerson, Person, TripWinery, Winery } from "@/types/db";
import { formatDate } from "@/lib/utils";
import { MapPin, Users, Wine, Calendar } from "lucide-react";

type TripWithRelations = Trip & {
  people: (TripPerson & { person: Person })[];
  wineries: (TripWinery & { winery: Winery })[];
  tastingEntries: { id: string }[];
};

interface TripCardProps {
  trip: TripWithRelations;
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <Link href={`/trips/${trip.id}`}>
      <div className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow">
        {trip.photoUrl && (
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={trip.photoUrl}
              alt={trip.name}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold">{trip.name}</h3>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>{formatDate(trip.date)}</span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{trip.location}</span>
          </div>

          <div className="flex flex-wrap gap-4 pt-1">
            {trip.tastingEntries.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Wine className="w-3.5 h-3.5" />
                <span>{trip.tastingEntries.length} wine{trip.tastingEntries.length !== 1 ? "s" : ""}</span>
              </div>
            )}
            {trip.people.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{trip.people.map((p) => p.person.name).join(", ")}</span>
              </div>
            )}
            {trip.wineries.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {trip.wineries.map((w) => w.winery.name).join(" · ")}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
