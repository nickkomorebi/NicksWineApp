"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTasting } from "@/app/actions/tastings";
import { wineDisplayName } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2, Wine } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface WineResult {
  id: string;
  brand: { value: string } | null;
  name: { value: string } | null;
  vintage: { value: string } | null;
  photos: { url: string }[];
}

interface LinkWineSheetProps {
  tripId: string;
  open: boolean;
  onClose: () => void;
}

export function LinkWineSheet({ tripId, open, onClose }: LinkWineSheetProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [wines, setWines] = useState<WineResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch wines whenever query changes or sheet opens
  useEffect(() => {
    if (!open) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/wines/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setWines(data.wines ?? []);
      } finally {
        setLoading(false);
      }
    }, query ? 200 : 0);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open]);

  // Focus search when sheet opens, reset on close
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 100);
    } else {
      setQuery("");
      setWines([]);
    }
  }, [open]);

  const handleSelect = async (wine: WineResult) => {
    setLinking(wine.id);
    const result = await createTasting({
      wineId: wine.id,
      tripId,
      dateDrank: new Date().toISOString(),
    });
    setLinking(null);
    if (result.error) {
      toast.error("Failed to link wine");
      return;
    }
    toast.success(`${wineDisplayName(wine)} added to trip`);
    router.refresh();
    onClose();
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-xl flex flex-col max-h-[80dvh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3">
          <p className="font-semibold text-sm">Link Existing Wine</p>
          <button onClick={onClose} className="text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, winery, vintage…"
              className="pl-9"
            />
          </div>
        </div>

        {/* Wine list */}
        <div className="overflow-y-auto flex-1 px-4 pb-6 space-y-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : wines.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Wine className="w-8 h-8 opacity-30" />
              <p className="text-sm">{query ? "No wines found" : "No wines in your library"}</p>
            </div>
          ) : (
            wines.map((wine) => {
              const isLinking = linking === wine.id;
              const photo = wine.photos[0];
              const displayName = wineDisplayName(wine);
              return (
                <button
                  key={wine.id}
                  onClick={() => handleSelect(wine)}
                  disabled={!!linking}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors text-left disabled:opacity-50"
                >
                  {photo ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden relative shrink-0">
                      <Image src={photo.url} alt={displayName} fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                      <Wine className="w-5 h-5 text-muted-foreground/40" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{displayName}</p>
                    {wine.vintage && (
                      <p className="text-xs text-muted-foreground">{wine.vintage.value}</p>
                    )}
                  </div>
                  {isLinking && <Loader2 className="w-4 h-4 animate-spin shrink-0 text-muted-foreground" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
