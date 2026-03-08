import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/PageHeader";
import { TripCard } from "@/components/trip/TripCard";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { MapPin, Plus } from "lucide-react";
import Link from "next/link";

export default async function TripsPage() {
  const trips = await prisma.trip.findMany({
    include: {
      people: { include: { person: true } },
      wineries: { include: { winery: true }, orderBy: { order: "asc" } },
      tastingEntries: { select: { id: true } },
    },
    orderBy: { date: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="Wine Trips"
        action={
          <Link href="/trips/new">
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              New Trip
            </Button>
          </Link>
        }
      />

      {trips.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No trips yet"
          description="Create a trip to track your wine adventures"
          action={
            <Link href="/trips/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Trip
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="p-4 space-y-3">
          <Link href="/trips/new" className="block">
            <div className="rounded-2xl border-2 border-dashed border-border p-5 flex items-center gap-3 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <Plus className="w-6 h-6 shrink-0" />
              <span className="text-sm font-medium">Add New Trip</span>
            </div>
          </Link>
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip as any} />
          ))}
        </div>
      )}
    </div>
  );
}
