"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { WineForm } from "@/components/wine/WineForm";
import { createWine } from "@/app/actions/wines";
import { WineFormValues } from "@/schemas/wine.schema";
import { toast } from "sonner";

export default function NewWinePage() {
  const router = useRouter();

  const handleSubmit = async (data: WineFormValues) => {
    const result = await createWine(data);
    if (result.error) {
      toast.error("Failed to save wine");
      return;
    }
    toast.success("Wine added!");
    router.push(`/wines/${result.data!.id}`);
  };

  return (
    <div>
      <PageHeader title="Add Wine Manually" showBack />
      <WineForm onSubmit={handleSubmit} submitLabel="Add Wine" />
    </div>
  );
}
