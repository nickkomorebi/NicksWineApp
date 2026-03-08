import { prisma } from "@/lib/prisma";
import { WineCard } from "@/components/wine/WineCard";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Wine, Upload } from "lucide-react";
import Link from "next/link";

export default async function WinesPage() {
  const wines = await prisma.wine.findMany({
    where: { mergedIntoId: null },
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
          <Link href="/wines/new" className="block">
            <div className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow">
              <div className="aspect-[4/3] bg-muted flex items-center justify-center">
                <Wine className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <div className="p-3 flex items-center justify-center border-t border-dashed border-border">
                <span className="text-sm font-medium text-muted-foreground">+ Add Wine</span>
              </div>
            </div>
          </Link>
          {wines.map((wine) => (
            <WineCard key={wine.id} wine={wine} />
          ))}
        </div>
      )}
    </div>
  );
}
