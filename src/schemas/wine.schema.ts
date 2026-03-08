import { z } from "zod";
import { WineType } from "@/types/db";

export const wineFormSchema = z.object({
  brand: z.string().optional(),
  name: z.string().optional(),
  vintage: z.string().optional(),
  type: z.nativeEnum(WineType).default("UNKNOWN"),
  country: z.string().optional(),
  region: z.string().optional(),
  appellation: z.string().optional(),
  isNonVintage: z.boolean().default(false),
  wineryId: z.string().optional(),
  varietals: z
    .array(
      z.object({
        name: z.string().min(1),
        percentage: z.number().min(0).max(100).optional(),
      })
    )
    .default([]),
  // Tasting entry fields captured at creation time
  tastedBy: z.string().optional(),
  score: z.number().int().min(0).max(100).optional(),
  dateDrank: z.string().optional(),
});

export type WineFormValues = z.infer<typeof wineFormSchema>;

export const tastingEntrySchema = z.object({
  wineId: z.string().min(1),
  tripId: z.string().optional(),
  dateDrank: z.string().datetime().optional(),
  score: z.number().int().min(0).max(100).optional(),
  aroma: z.string().optional(),
  fruit: z.string().optional(),
  palate: z.string().optional(),
  finish: z.string().optional(),
  acidity: z.string().optional(),
  tannin: z.string().optional(),
  alcohol: z.string().optional(),
  sweetness: z.string().optional(),
  body: z.string().optional(),
  otherNotes: z.string().optional(),
});

export type TastingEntryValues = z.infer<typeof tastingEntrySchema>;

export const tripSchema = z.object({
  name: z.string().min(1, "Name is required"),
  date: z.string().datetime(),
  location: z.string().min(1, "Location is required"),
  wineryIds: z.array(z.string()).max(8).default([]),
  personIds: z.array(z.string()).default([]),
  newWineryNames: z.array(z.string()).default([]),
  newPersonNames: z.array(z.string()).default([]),
  photoUrl: z.string().optional(),
  photoStorageKey: z.string().optional(),
});

export type TripValues = z.infer<typeof tripSchema>;
