import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { WineDetail } from "@/components/wine/WineDetail";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function WineDetailPage({ params }: Props) {
  const { id } = await params;

  const wine = await prisma.wine.findUnique({
    where: { id },
    include: {
      brand: true,
      name: true,
      vintage: true,
      country: true,
      region: true,
      appellation: true,
      varietals: true,
      photos: true,
      winery: true,
      expectedProfile: true,
      tastingEntries: {
        orderBy: { dateDrank: "desc" },
        include: { trip: { select: { id: true, name: true } } },
      },
    },
  });

  if (!wine) notFound();

  return (
    <div>
      <PageHeader
        title="Wine Detail"
        showBack
        backHref="/wines"
        action={
          <Link href={`/wines/${id}/edit`}>
            <Button variant="ghost" size="icon">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
        }
      />
      <WineDetail wine={wine as any} />
    </div>
  );
}
