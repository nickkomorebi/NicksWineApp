"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, Wine } from "lucide-react";
import { toast } from "sonner";
import { FieldSource, WineType } from "@/types/db";

const WINE_TYPES = ["RED", "WHITE", "ROSE", "SPARKLING", "DESSERT", "FORTIFIED", "ORANGE", "UNKNOWN"];
const WINE_TYPE_LABELS: Record<string, string> = {
  RED: "Red", WHITE: "White", ROSE: "Rosé", SPARKLING: "Sparkling",
  DESSERT: "Dessert", FORTIFIED: "Fortified", ORANGE: "Orange", UNKNOWN: "Unknown",
};

interface FieldValue {
  value: string;
  confidence: number;
  source: FieldSource;
}

interface ExtractedFields {
  brand?: FieldValue | null;
  name?: FieldValue | null;
  vintage?: FieldValue | null;
  type?: { value: WineType; confidence: number; source: FieldSource } | null;
  country?: FieldValue | null;
  region?: FieldValue | null;
  appellation?: FieldValue | null;
  varietals?: Array<{ name: string; percentage?: number; confidence: number; source: FieldSource }> | null;
  isNonVintage?: boolean;
}

interface BatchItem {
  id: string;
  url: string;
  status: string;
  extractedFields: ExtractedFields | null;
}

// Each "group" is a potential wine (may have multiple photos)
interface WineGroup {
  itemIds: string[];
  photos: { id: string; url: string }[];
  fields: ExtractedFields;
  score?: number;
  dateDrank: string;
  tastedBy: string;
}

interface ReviewStepProps {
  batchId: string;
  tripId?: string;
  onConfirmed: (wineIds: string[]) => void;
}

export function ReviewStep({ batchId, tripId, onConfirmed }: ReviewStepProps) {
  const [groups, setGroups] = useState<WineGroup[]>([]);
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const { data: batch } = useQuery({
    queryKey: ["batch", batchId],
    queryFn: async () => {
      const res = await fetch(`/api/upload/batch/${batchId}`);
      return res.json() as Promise<{ items: BatchItem[] }>;
    },
    staleTime: 0,
  });

  // Initialize groups from batch items (one group per completed item initially)
  useEffect(() => {
    if (!batch || initialized) return;
    const completed = batch.items.filter((i) => i.status === "COMPLETED" && i.extractedFields);
    if (!completed.length) return;

    setGroups(
      completed.map((item) => ({
        itemIds: [item.id],
        photos: [{ id: item.id, url: item.url }],
        fields: item.extractedFields ?? {},
        dateDrank: new Date().toISOString().split("T")[0],
        tastedBy: "",
      }))
    );
    setInitialized(true);
  }, [batch, initialized]);

  const updateField = (groupIdx: number, field: string, value: string) => {
    setGroups((prev) => {
      const copy = [...prev];
      const group = { ...copy[groupIdx] };
      group.fields = {
        ...group.fields,
        [field]: value
          ? {
              value,
              confidence: 1.0,
              source: "USER" as FieldSource,
            }
          : null,
      };
      copy[groupIdx] = group;
      return copy;
    });
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const payload = {
        groups: groups.map((g) => ({
          itemIds: g.itemIds,
          action: "create",
          fields: {
            ...g.fields,
            score: g.score,
            dateDrank: new Date(g.dateDrank).toISOString(),
            tastedBy: g.tastedBy || undefined,
            tripId,
          },
        })),
      };

      const res = await fetch(`/api/upload/batch/${batchId}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");

      const { createdWineIds } = await res.json();
      toast.success(`${createdWineIds.length} wine${createdWineIds.length > 1 ? "s" : ""} saved!`);
      onConfirmed(createdWineIds);
    } catch {
      toast.error("Failed to save wines");
    } finally {
      setSaving(false);
    }
  };

  if (!initialized) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto pb-24">
      <div>
        <h2 className="text-lg font-bold">Review Extracted Info</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and edit the extracted wine details before saving.
          Badges show how confident the AI was.
        </p>
      </div>

      {groups.map((group, groupIdx) => (
        <div key={group.itemIds.join("-")} className="border border-border rounded-2xl overflow-hidden">
          {/* Photos */}
          <div className="flex gap-2 p-3 bg-muted/30">
            {group.photos.map((photo) => (
              <div key={photo.id} className="w-16 h-16 rounded-lg overflow-hidden relative">
                <Image src={photo.url} alt="Wine label" fill className="object-cover" />
              </div>
            ))}
            <div className="flex-1 flex items-center px-2">
              <Wine className="w-4 h-4 text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Wine {groupIdx + 1}</span>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Each extracted field */}
            {[
              { key: "brand", label: "Brand / Producer" },
              { key: "name", label: "Wine Name" },
              { key: "vintage", label: "Vintage" },
              { key: "country", label: "Country" },
              { key: "region", label: "Region" },
              { key: "appellation", label: "Appellation / AOC / AVA" },
            ].map(({ key, label }) => {
              const fv = group.fields[key as keyof ExtractedFields] as FieldValue | null | undefined;
              return (
                <div key={key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">{label}</Label>
                    {fv && (
                      <ConfidenceBadge
                        confidence={fv.confidence}
                        source={fv.source}
                        showLabel={false}
                      />
                    )}
                  </div>
                  <Input
                    value={fv?.value ?? ""}
                    onChange={(e) => updateField(groupIdx, key, e.target.value)}
                    placeholder={`Enter ${label.toLowerCase()}...`}
                  />
                </div>
              );
            })}

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Wine Type</Label>
              <Select
                value={(group.fields.type?.value as string) ?? "UNKNOWN"}
                onValueChange={(val) =>
                  setGroups((prev) => {
                    const copy = [...prev];
                    copy[groupIdx] = {
                      ...copy[groupIdx],
                      fields: {
                        ...copy[groupIdx].fields,
                        type: { value: val as WineType, confidence: 1.0, source: "USER" },
                      },
                    };
                    return copy;
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WINE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {WINE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Varietals */}
            {group.fields.varietals && group.fields.varietals.length > 0 && (
              <div className="space-y-1.5">
                <Label>Varietals</Label>
                <div className="flex flex-wrap gap-2">
                  {group.fields.varietals.map((v, i) => (
                    <span key={i} className="bg-secondary text-secondary-foreground text-sm px-3 py-1 rounded-full">
                      {v.name}{v.percentage ? ` ${v.percentage}%` : ""}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Non-vintage */}
            <div className="flex items-center gap-3">
              <Switch
                checked={group.fields.isNonVintage ?? false}
                onCheckedChange={(v) =>
                  setGroups((prev) => {
                    const copy = [...prev];
                    copy[groupIdx] = {
                      ...copy[groupIdx],
                      fields: { ...copy[groupIdx].fields, isNonVintage: v },
                    };
                    return copy;
                  })
                }
              />
              <Label className="font-normal">Non-Vintage (NV)</Label>
            </div>

            <Separator />

            {/* Tasted by */}
            <div className="space-y-1.5">
              <Label>Tasted By</Label>
              <Input
                placeholder="e.g. Nick"
                value={group.tastedBy}
                onChange={(e) =>
                  setGroups((prev) => {
                    const copy = [...prev];
                    copy[groupIdx] = { ...copy[groupIdx], tastedBy: e.target.value };
                    return copy;
                  })
                }
              />
            </div>

            {/* Tasting date + score */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Date Drank</Label>
                <Input
                  type="date"
                  value={group.dateDrank}
                  onChange={(e) =>
                    setGroups((prev) => {
                      const copy = [...prev];
                      copy[groupIdx] = { ...copy[groupIdx], dateDrank: e.target.value };
                      return copy;
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>My Score (0–100)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="e.g. 92"
                  value={group.score ?? ""}
                  onChange={(e) =>
                    setGroups((prev) => {
                      const copy = [...prev];
                      copy[groupIdx] = {
                        ...copy[groupIdx],
                        score: e.target.value ? parseInt(e.target.value) : undefined,
                      };
                      return copy;
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Confirm button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
        <div className="max-w-lg mx-auto">
          <Button
            className="w-full h-12 text-base"
            onClick={handleConfirm}
            disabled={saving || groups.length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Save {groups.length} Wine{groups.length > 1 ? "s" : ""} to Collection
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
