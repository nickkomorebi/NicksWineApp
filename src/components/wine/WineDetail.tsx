"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { WineWithRelations } from "@/types/wine";
import { formatDate, formatScore, scoreToColor, wineDisplayName } from "@/lib/utils";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TastingEntryCard } from "@/components/tasting/TastingEntryCard";
import { AddTastingForm } from "@/components/tasting/AddTastingForm";
import { ExpectedProfileCard } from "./ExpectedProfileCard";
import { Wine, Plus, Globe, MapPin } from "lucide-react";

interface WineDetailProps {
  wine: WineWithRelations & {
    tastingEntries: (WineWithRelations["tastingEntries"][0] & {
      trip: { id: string; name: string } | null;
    })[];
  };
}

const WINE_TYPE_LABELS: Record<string, string> = {
  RED: "Red", WHITE: "White", ROSE: "Rosé", SPARKLING: "Sparkling",
  DESSERT: "Dessert", FORTIFIED: "Fortified", ORANGE: "Orange", UNKNOWN: "Unknown",
};

export function WineDetail({ wine }: WineDetailProps) {
  const [showAddTasting, setShowAddTasting] = useState(false);
  const displayName = wineDisplayName(wine);
  const coverPhoto = wine.photos.find((p) => p.isCover) ?? wine.photos[0];

  const fieldRow = (
    label: string,
    fv: { value: string; confidence: number; source: any } | null | undefined
  ) => {
    if (!fv) return null;
    return (
      <div className="flex items-start justify-between gap-3 py-2.5">
        <span className="text-sm text-muted-foreground w-28 shrink-0">{label}</span>
        <div className="flex-1 flex items-center gap-2 flex-wrap justify-end">
          <span className="text-sm font-medium text-right">{fv.value}</span>
          <ConfidenceBadge confidence={fv.confidence} source={fv.source} showLabel={false} />
        </div>
      </div>
    );
  };

  return (
    <div className="pb-8">
      {/* Hero photo */}
      {coverPhoto ? (
        <div className="aspect-video bg-muted relative overflow-hidden">
          <Image
            src={coverPhoto.url}
            alt={displayName}
            fill
            className="object-cover"
            priority
          />
        </div>
      ) : (
        <div className="aspect-video bg-muted flex items-center justify-center">
          <Wine className="w-16 h-16 text-muted-foreground/30" />
        </div>
      )}

      {/* Multiple photos strip */}
      {wine.photos.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto">
          {wine.photos.map((photo) => (
            <div key={photo.id} className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative">
              <Image src={photo.url} alt="" fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Title */}
        <div>
          <h2 className="text-xl font-bold leading-tight">{displayName}</h2>
          {wine.winery && (
            <p className="text-sm text-muted-foreground mt-0.5">{wine.winery.name}</p>
          )}
          <div className="flex gap-2 mt-2 flex-wrap">
            {wine.type !== "UNKNOWN" && (
              <Badge variant="secondary">{WINE_TYPE_LABELS[wine.type]}</Badge>
            )}
            {wine.isNonVintage && <Badge variant="outline">Non-Vintage</Badge>}
            {wine.varietals.map((v) => (
              <Badge key={v.id} variant="outline">
                {v.name}{v.percentage ? ` ${v.percentage}%` : ""}
              </Badge>
            ))}
          </div>
        </div>

        <Separator />

        <Tabs defaultValue="details">
          <TabsList className="w-full">
            <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
            <TabsTrigger value="tastings" className="flex-1">
              Tastings ({wine.tastingEntries.length})
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <div className="bg-card border border-border rounded-xl px-4 divide-y divide-border">
              {fieldRow("Brand", wine.brand)}
              {fieldRow("Name", wine.name)}
              {fieldRow("Vintage", wine.vintage)}
              {fieldRow("Country", wine.country)}
              {fieldRow("Region", wine.region)}
              {fieldRow("Appellation", wine.appellation)}
            </div>
          </TabsContent>

          <TabsContent value="tastings" className="mt-4 space-y-3">
            {wine.tastingEntries.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No tasting entries yet
              </p>
            ) : (
              wine.tastingEntries.map((entry) => (
                <TastingEntryCard key={entry.id} entry={entry} />
              ))
            )}

            {showAddTasting ? (
              <AddTastingForm
                wineId={wine.id}
                onDone={() => setShowAddTasting(false)}
              />
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAddTasting(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tasting Entry
              </Button>
            )}
          </TabsContent>

          <TabsContent value="profile" className="mt-4">
            <ExpectedProfileCard profile={wine.expectedProfile} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
