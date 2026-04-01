import { prisma } from "@/lib/prisma";
import { WineCard } from "@/components/wine/WineCard";
import { AddWineCard } from "@/components/wine/AddWineCard";
import { DeleteCardOverlay } from "@/components/ui/DeleteCardOverlay";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Wine, Upload } from "lucide-react";
import Link from "next/link";
import { deleteWine } from "@/app/actions/wines";

export default async function WinesPage() {
  const wines = await prisma.wine.findMany({
    where: { mergedIntoId: null, deletedAt: null },
    include: {
      brand: true,
      name: true,
      vintage: true,
      country: true,
      region: true,
      appellation: true,
      varietals: true,
      photos: { select: { url: true, isCover: true } },
      tastingEntries: { select: { score: true, dateDrank: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        title="My Wines"
        action={
          <Link href="/upload">
            <Button size="sm" className="gap-1.5">
              <Upload className="w-4 h-4" />
              Upload
            </Button>
          </Link>
        }
      />

      {wines.length === 0 ? (
        <EmptyState
          icon={Wine}
          title="No wines yet"
          description="Upload a photo of a wine label to get started"
          action={
            <div className="flex gap-3">
              <Link href="/upload">
                <Button>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Label Photo
                </Button>
              </Link>
              <Link href="/wines/new">
                <Button variant="outline">Add Manually</Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="p-4 grid grid-cols-2 gap-3">
          <AddWineCard />
          {wines.map((wine) => (
            <DeleteCardOverlay
              key={wine.id}
              label="this wine"
              onDelete={deleteWine.bind(null, wine.id)}
            >
              <WineCard wine={wine} />
            </DeleteCardOverlay>
          ))}
        </div>
      )}
    </div>
  );
}
