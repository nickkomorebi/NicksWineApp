import { Wine, FieldValue, WineVarietal, WinePhoto, TastingEntry, WineExpectedProfile, Winery, FieldSource, WineType } from "@/types/db";

export type WineWithRelations = Wine & {
  brand: FieldValue | null;
  name: FieldValue | null;
  vintage: FieldValue | null;
  country: FieldValue | null;
  region: FieldValue | null;
  appellation: FieldValue | null;
  varietals: WineVarietal[];
  photos: WinePhoto[];
  tastingEntries: TastingEntry[];
  expectedProfile: WineExpectedProfile | null;
  winery: Winery | null;
};

export type WineListItem = Wine & {
  brand: FieldValue | null;
  name: FieldValue | null;
  vintage: FieldValue | null;
  country: FieldValue | null;
  region: FieldValue | null;
  appellation: FieldValue | null;
  type: WineType;
  varietals: WineVarietal[];
  photos: Pick<WinePhoto, "url" | "isCover">[];
  tastingEntries: Pick<TastingEntry, "score" | "dateDrank">[];
};

export interface ExtractedWineFields {
  brand?: { value: string; confidence: number; source: FieldSource } | null;
  name?: { value: string; confidence: number; source: FieldSource } | null;
  vintage?: { value: string; confidence: number; source: FieldSource } | null;
  type?: { value: WineType; confidence: number; source: FieldSource } | null;
  country?: { value: string; confidence: number; source: FieldSource } | null;
  region?: { value: string; confidence: number; source: FieldSource } | null;
  appellation?: { value: string; confidence: number; source: FieldSource } | null;
  varietals?: Array<{
    name: string;
    percentage?: number;
    confidence: number;
    source: FieldSource;
  }>;
  isNonVintage?: boolean;
}
