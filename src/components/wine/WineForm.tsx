"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { wineFormSchema, WineFormValues } from "@/schemas/wine.schema";
import { WineType } from "@/types/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, X, Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

const WINE_TYPES = [
  { value: "RED", label: "Red" },
  { value: "WHITE", label: "White" },
  { value: "ROSE", label: "Rosé" },
  { value: "SPARKLING", label: "Sparkling" },
  { value: "DESSERT", label: "Dessert" },
  { value: "FORTIFIED", label: "Fortified" },
  { value: "ORANGE", label: "Orange" },
  { value: "UNKNOWN", label: "Unknown" },
];

interface WineFormProps {
  defaultValues?: Partial<WineFormValues>;
  onSubmit: (data: WineFormValues) => Promise<void>;
  submitLabel?: string;
}

export function WineForm({ defaultValues, onSubmit, submitLabel = "Save Wine" }: WineFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<WineFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(wineFormSchema) as any,
    defaultValues: {
      brand: "",
      name: "",
      vintage: "",
      type: "UNKNOWN",
      country: "",
      region: "",
      appellation: "",
      isNonVintage: false,
      varietals: [],
      tastedBy: "",
      dateDrank: new Date().toISOString().split("T")[0],
      ...defaultValues,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "varietals",
  });

  const isNonVintage = form.watch("isNonVintage");

  const handleSubmit = async (data: WineFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5 p-4">
      {/* Brand */}
      <div className="space-y-1.5">
        <Label htmlFor="brand">Brand / Producer</Label>
        <Input id="brand" placeholder="e.g. Caymus, Opus One" {...form.register("brand")} />
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Wine Name</Label>
        <Input id="name" placeholder="e.g. Special Selection, Insignia" {...form.register("name")} />
      </div>

      {/* Type */}
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select
          value={form.watch("type")}
          onValueChange={(val) => form.setValue("type", val as WineType)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {WINE_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Vintage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="vintage">Vintage</Label>
          <div className="flex items-center gap-2">
            <Switch
              id="non-vintage"
              checked={isNonVintage}
              onCheckedChange={(v) => form.setValue("isNonVintage", v)}
            />
            <Label htmlFor="non-vintage" className="text-sm font-normal text-muted-foreground">
              Non-vintage (NV)
            </Label>
          </div>
        </div>
        {!isNonVintage && (
          <Input
            id="vintage"
            placeholder="e.g. 2019"
            {...form.register("vintage")}
          />
        )}
      </div>

      {/* Varietals */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Varietals</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ name: "" })}
            className="h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="flex gap-2">
            <Input
              placeholder="e.g. Cabernet Sauvignon"
              {...form.register(`varietals.${index}.name`)}
              className="flex-1"
            />
            <Input
              type="number"
              placeholder="%"
              min={0}
              max={100}
              {...form.register(`varietals.${index}.percentage`, {
                valueAsNumber: true,
                setValueAs: (v) => (v === "" ? undefined : Number(v)),
              })}
              className="w-16"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => remove(index)}
              className="shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Origin */}
      <div className="space-y-1.5">
        <Label htmlFor="country">Country</Label>
        <Input id="country" placeholder="e.g. USA, France, Italy" {...form.register("country")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="region">Region</Label>
        <Input id="region" placeholder="e.g. Napa Valley, Bordeaux" {...form.register("region")} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="appellation">AVA / AOC / DOC</Label>
        <Input
          id="appellation"
          placeholder="e.g. Rutherford AVA, Pauillac AOC"
          {...form.register("appellation")}
        />
      </div>

      <Separator />

      {/* Tasting info */}
      <div className="space-y-1.5">
        <Label htmlFor="tastedBy">Tasted By</Label>
        <Input
          id="tastedBy"
          placeholder="e.g. Nick"
          {...form.register("tastedBy")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="dateDrank">Date Drank</Label>
          <Input id="dateDrank" type="date" {...form.register("dateDrank")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="score">Score (0–100)</Label>
          <Input
            id="score"
            type="number"
            min={0}
            max={100}
            placeholder="e.g. 92"
            {...form.register("score", {
              valueAsNumber: true,
              setValueAs: (v) => (v === "" ? undefined : Number(v)),
            })}
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}
