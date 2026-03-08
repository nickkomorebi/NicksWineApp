"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { WineListItem } from "@/types/wine";
import { WineCard } from "@/components/wine/WineCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, Filter, X } from "lucide-react";
import { WineType } from "@/types/db";
import { useDebounce } from "@/hooks/useDebounce";
import { useEffect } from "react";

const WINE_TYPE_LABELS: Record<string, string> = {
  RED: "Red", WHITE: "White", ROSE: "Rosé", SPARKLING: "Sparkling",
  DESSERT: "Dessert", FORTIFIED: "Fortified", ORANGE: "Orange", UNKNOWN: "Unknown",
};

interface FilterOptions {
  countries: string[];
  types: { type: WineType; count: number }[];
  varietals: string[];
}

interface SearchClientProps {
  initialWines: WineListItem[];
  total: number;
  page: number;
  filterOptions: FilterOptions;
  initialParams: {
    q?: string;
    type?: string;
    country?: string;
    varietal?: string;
    vintage?: string;
  };
}

export function SearchClient({
  initialWines,
  total,
  filterOptions,
  initialParams,
}: SearchClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialParams.q ?? "");
  const [typeFilter, setTypeFilter] = useState(initialParams.type ?? "");
  const [countryFilter, setCountryFilter] = useState(initialParams.country ?? "");
  const [varietalFilter, setVarietalFilter] = useState(initialParams.varietal ?? "");
  const [vintageFilter, setVintageFilter] = useState(initialParams.vintage ?? "");

  const debouncedQuery = useDebounce(query, 400);

  const updateSearch = useCallback(
    (overrides: Partial<typeof initialParams> = {}) => {
      const params = new URLSearchParams();
      const q = overrides.q !== undefined ? overrides.q : debouncedQuery;
      const type = overrides.type !== undefined ? overrides.type : typeFilter;
      const country = overrides.country !== undefined ? overrides.country : countryFilter;
      const varietal = overrides.varietal !== undefined ? overrides.varietal : varietalFilter;
      const vintage = overrides.vintage !== undefined ? overrides.vintage : vintageFilter;

      if (q) params.set("q", q);
      if (type) params.set("type", type);
      if (country) params.set("country", country);
      if (varietal) params.set("varietal", varietal);
      if (vintage) params.set("vintage", vintage);

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [debouncedQuery, typeFilter, countryFilter, varietalFilter, vintageFilter, pathname, router]
  );

  useEffect(() => {
    updateSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  const clearFilter = (filter: string) => {
    if (filter === "type") { setTypeFilter(""); updateSearch({ type: "" }); }
    if (filter === "country") { setCountryFilter(""); updateSearch({ country: "" }); }
    if (filter === "varietal") { setVarietalFilter(""); updateSearch({ varietal: "" }); }
    if (filter === "vintage") { setVintageFilter(""); updateSearch({ vintage: "" }); }
  };

  const activeFilters = [
    typeFilter && { key: "type", label: WINE_TYPE_LABELS[typeFilter] || typeFilter },
    countryFilter && { key: "country", label: countryFilter },
    varietalFilter && { key: "varietal", label: varietalFilter },
    vintageFilter && { key: "vintage", label: vintageFilter },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="p-4 space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search wines, regions, varietals..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Filter className="w-4 h-4" />
              {activeFilters.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {activeFilters.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="space-y-6 py-4">
              {/* Type filter */}
              <div>
                <p className="text-sm font-semibold mb-2">Type</p>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.types.map(({ type }) => (
                    <button
                      key={type}
                      onClick={() => {
                        const next = typeFilter === type ? "" : type;
                        setTypeFilter(next);
                        updateSearch({ type: next });
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        typeFilter === type
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      {WINE_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Country filter */}
              {filterOptions.countries.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Country</p>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.countries.slice(0, 12).map((country) => (
                      <button
                        key={country}
                        onClick={() => {
                          const next = countryFilter === country ? "" : country;
                          setCountryFilter(next);
                          updateSearch({ country: next });
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          countryFilter === country
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vintage filter */}
              <div>
                <p className="text-sm font-semibold mb-2">Vintage</p>
                <Input
                  placeholder="e.g. 2019"
                  value={vintageFilter}
                  onChange={(e) => {
                    setVintageFilter(e.target.value);
                    updateSearch({ vintage: e.target.value });
                  }}
                />
              </div>

              {/* Varietal filter */}
              {filterOptions.varietals.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">Varietal</p>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.varietals.slice(0, 15).map((v) => (
                      <button
                        key={v}
                        onClick={() => {
                          const next = varietalFilter === v ? "" : v;
                          setVarietalFilter(next);
                          updateSearch({ varietal: next });
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          varietalFilter === v
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active filters */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map(({ key, label }) => (
            <Badge
              key={key}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => clearFilter(key)}
            >
              {label}
              <X className="w-3 h-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {isPending ? "Searching..." : `${total} wine${total !== 1 ? "s" : ""} found`}
      </p>

      {/* Results */}
      {initialWines.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          No wines match your search
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {initialWines.map((wine) => (
            <WineCard key={wine.id} wine={wine} />
          ))}
        </div>
      )}
    </div>
  );
}
