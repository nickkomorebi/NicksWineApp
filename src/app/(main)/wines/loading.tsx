import { PageHeader } from "@/components/layout/PageHeader";
import { WineListSkeleton } from "@/components/ui/loading-skeleton";

export default function WinesLoading() {
  return (
    <div>
      <PageHeader title="My Wines" />
      <WineListSkeleton />
    </div>
  );
}
