import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { EditTripClient } from "./EditTripClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditTripPage({ params }: Props) {
  const { id } = await params;

  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      wineries: { include: { winery: true }, orderBy: { order: "asc" } },
      people: { include: { person: true } },
    },
  });
  if (!trip) notFound();

  return (
    <div>
      <PageHeader title="Edit Trip" showBack />
      <EditTripClient
        id={id}
        defaultValues={{
          name: trip.name,
          date: trip.date.toISOString(),
          location: trip.location,
          photoUrl: trip.photoUrl ?? undefined,
          photoStorageKey: trip.photoStorageKey ?? undefined,
          wineryIds: [],
          personIds: [],
          newWineryNames: trip.wineries.map((tw) => tw.winery.name),
          newPersonNames: trip.people.map((tp) => tp.person.name),
        }}
      />
    </div>
  );
}
