"use client";

import { useRef, useState } from "react";
import { TripValues } from "@/schemas/wine.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Loader2, Camera } from "lucide-react";
import Image from "next/image";

interface TripFormProps {
  defaultValues?: Partial<TripValues>;
  onSubmit: (data: TripValues) => Promise<void>;
  submitLabel?: string;
}

export function TripForm({ defaultValues, onSubmit, submitLabel = "Save Trip" }: TripFormProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(defaultValues?.name ?? "");
  const [location, setLocation] = useState(defaultValues?.location ?? "");
  const [date, setDate] = useState(
    defaultValues?.date
      ? new Date(defaultValues.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [wineryInputs, setWineryInputs] = useState<string[]>(
    defaultValues?.newWineryNames?.length ? defaultValues.newWineryNames : [""]
  );
  const [personInputs, setPersonInputs] = useState<string[]>(
    defaultValues?.newPersonNames?.length ? defaultValues.newPersonNames : [""]
  );

  // Photo state
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(defaultValues?.photoUrl);
  const [photoStorageKey, setPhotoStorageKey] = useState<string | undefined>(defaultValues?.photoStorageKey);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);
      const res = await fetch("/api/upload/trip-photo", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPhotoUrl(data.url);
      setPhotoStorageKey(data.storageKey);
    } catch {
      // silently ignore; user can retry
    } finally {
      setPhotoUploading(false);
    }
  };

  const removePhoto = () => {
    setPhotoUrl(undefined);
    setPhotoStorageKey(undefined);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newWineryNames = wineryInputs.filter((w) => w.trim());
    const newPersonNames = personInputs.filter((p) => p.trim());

    await onSubmit({
      name,
      date: new Date(date).toISOString(),
      location,
      wineryIds: [],
      personIds: [],
      newWineryNames,
      newPersonNames,
      photoUrl,
      photoStorageKey,
    });

    setLoading(false);
  };

  const addWinery = () => {
    if (wineryInputs.length < 8) setWineryInputs([...wineryInputs, ""]);
  };

  const removeWinery = (i: number) => {
    setWineryInputs(wineryInputs.filter((_, idx) => idx !== i));
  };

  const updateWinery = (i: number, val: string) => {
    const copy = [...wineryInputs];
    copy[i] = val;
    setWineryInputs(copy);
  };

  const addPerson = () => setPersonInputs([...personInputs, ""]);

  const removePerson = (i: number) => {
    setPersonInputs(personInputs.filter((_, idx) => idx !== i));
  };

  const updatePerson = (i: number, val: string) => {
    const copy = [...personInputs];
    copy[i] = val;
    setPersonInputs(copy);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-4">
      {/* Photo picker */}
      <div className="space-y-1.5">
        <Label>Trip Photo (optional)</Label>
        {photoUrl ? (
          <div className="relative rounded-xl overflow-hidden aspect-[16/9] bg-muted">
            <Image src={photoUrl} alt="Trip photo" fill className="object-cover" />
            <button
              type="button"
              onClick={removePhoto}
              className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={photoUploading}
            className="w-full rounded-xl border-2 border-dashed border-border aspect-[16/9] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            {photoUploading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Camera className="w-6 h-6" />
            )}
            <span className="text-sm">{photoUploading ? "Uploading…" : "Add a photo"}</span>
          </button>
        )}
        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhotoChange}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Trip Name *</Label>
        <Input
          id="name"
          required
          placeholder="e.g. Sonoma Weekend"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="location">Location *</Label>
        <Input
          id="location"
          required
          placeholder="e.g. Sonoma, CA"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      {/* Wineries */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Wineries Visited (optional, up to 8)</Label>
          {wineryInputs.length < 8 && (
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addWinery}>
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          )}
        </div>
        {wineryInputs.map((val, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={`Winery ${i + 1}`}
              value={val}
              onChange={(e) => updateWinery(i, e.target.value)}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeWinery(i)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* People */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>People on Trip (optional)</Label>
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addPerson}>
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
        {personInputs.map((val, i) => (
          <div key={i} className="flex gap-2">
            <Input
              placeholder={`Person ${i + 1}`}
              value={val}
              onChange={(e) => updatePerson(i, e.target.value)}
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removePerson(i)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={loading || photoUploading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </form>
  );
}
