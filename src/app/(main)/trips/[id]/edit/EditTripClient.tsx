"use client";

import { useRouter } from "next/navigation";
import { TripForm } from "@/components/trip/TripForm";
import { updateTrip } from "@/app/actions/trips";
import { TripValues } from "@/schemas/wine.schema";
import { toast } from "sonner";

interface EditTripClientProps {
  id: string;
  defaultValues: Partial<TripValues>;
}

export function EditTripClient({ id, defaultValues }: EditTripClientProps) {
  const router = useRouter();

  const handleSubmit = async (data: TripValues) => {
    const result = await updateTrip(id, data);
    if (result.error) {
      toast.error("Failed to update trip");
      return;
    }
    toast.success("Trip updated!");
    router.push(`/trips/${id}`);
  };

  return (
    <TripForm
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      submitLabel="Save Changes"
    />
  );
}
