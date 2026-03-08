"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { WineForm } from "@/components/wine/WineForm";
import { updateWine } from "@/app/actions/wines";
import { WineFormValues } from "@/schemas/wine.schema";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function EditWinePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [wine, setWine] = useState<WineFormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/wines/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setWine({
          brand: data.brand?.value ?? "",
          name: data.name?.value ?? "",
          vintage: data.vintage?.value ?? "",
          type: data.type ?? "UNKNOWN",
          country: data.country?.value ?? "",
          region: data.region?.value ?? "",
          appellation: data.appellation?.value ?? "",
          isNonVintage: data.isNonVintage ?? false,
          varietals: (data.varietals ?? []).map((v: { name: string; percentage?: number }) => ({
            name: v.name,
            percentage: v.percentage,
          })),
        });
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (data: WineFormValues) => {
    const result = await updateWine(id, data);
    if (result.error) {
      toast.error("Failed to update wine");
      return;
    }
    toast.success("Wine updated!");
    router.push(`/wines/${id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit Wine" showBack />
      {wine && (
        <WineForm
          defaultValues={wine}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
}
