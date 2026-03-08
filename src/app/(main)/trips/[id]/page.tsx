import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TripDetail } from "@/components/trip/TripDetail";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Pencil } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      people: { include: { person: true } },
      wineries: { include: { winery: true }, orderBy: { order: "asc" } },
      tastingEntries: {
        orderBy: { dateDrank: "desc" },
        include: {
          wine: {
            include: {
              brand: true,
              name: true,
              vintage: true,
              photos: { take: 1, where: { isCover: true } },
            },
          },
        },
      },
    },
  });

  if (!trip) notFound();

  return (
    <div>
      <PageHeader
        title={trip.name}
        showBack
        backHref="/trips"
        action={
          <Link href={`/trips/${id}/edit`}>
            <Button variant="ghost" size="icon">
              <Pencil className="w-4 h-4" />
            </Button>
          </Link>
        }
      />
      <TripDetail trip={trip as any} />
    </div>
  );
}
