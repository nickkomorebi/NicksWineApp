"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TripForm } from "@/components/trip/TripForm";
import { createTrip } from "@/app/actions/trips";
import { TripValues } from "@/schemas/wine.schema";
import { toast } from "sonner";

export default function NewTripPage() {
  const router = useRouter();

  const handleSubmit = async (data: TripValues) => {
    const result = await createTrip(data);
    if (result.error) {
      toast.error("Failed to create trip");
      return;
    }
    toast.success("Trip created!");
    router.push(`/trips/${result.data!.id}`);
  };

  return (
    <div>
      <PageHeader title="New Trip" showBack />
      <TripForm onSubmit={handleSubmit} submitLabel="Create Trip" />
    </div>
  );
}
