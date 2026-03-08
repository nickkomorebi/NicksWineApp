import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TastingDetail } from "@/components/tasting/TastingDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TastingDetailPage({ params }: Props) {
  const { id } = await params;

  const entry = await prisma.tastingEntry.findUnique({
    where: { id },
    include: {
      wine: {
        include: {
          brand: true,
          name: true,
          vintage: true,
          photos: { take: 1, where: { isCover: true } },
        },
      },
      trip: true,
    },
  });

  if (!entry) notFound();

  return (
    <div>
      <PageHeader title="Tasting Entry" showBack />
      <TastingDetail entry={entry as any} />
    </div>
  );
}
