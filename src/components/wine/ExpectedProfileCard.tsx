import { WineExpectedProfile } from "@/types/db";

interface ExpectedProfileCardProps {
  profile: WineExpectedProfile | null;
}

const PROFILE_FIELDS = [
  { key: "aroma", label: "Aroma" },
  { key: "palate", label: "Palate" },
  { key: "finish", label: "Finish" },
  { key: "acidity", label: "Acidity" },
  { key: "tannin", label: "Tannin" },
  { key: "alcohol", label: "Alcohol" },
  { key: "sweetness", label: "Sweetness" },
  { key: "body", label: "Body" },
  { key: "notes", label: "Notes" },
] as const;

export function ExpectedProfileCard({ profile }: ExpectedProfileCardProps) {
  if (!profile) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <p>Expected profile not yet loaded.</p>
        <p className="mt-1">It will appear here after the wine is saved.</p>
      </div>
    );
  }

  const filledFields = PROFILE_FIELDS.filter(
    ({ key }) => profile[key as keyof WineExpectedProfile]
  );

  if (filledFields.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No expected profile data available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Expected Profile</h3>
        <span className="text-xs text-muted-foreground">via {profile.source}</span>
      </div>
      <div className="bg-card border border-border rounded-xl px-4 divide-y divide-border">
        {filledFields.map(({ key, label }) => {
          const value = profile[key as keyof WineExpectedProfile] as string;
          return (
            <div key={key} className="py-2.5">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
              <p className="text-sm mt-0.5">{value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
