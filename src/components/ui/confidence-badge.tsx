import { cn, confidenceToColor, confidenceLabel } from "@/lib/utils";
import { FieldSource } from "@/types/db";

const sourceLabels: Record<FieldSource, string> = {
  IMAGE: "from label",
  INTERNET: "from internet",
  USER: "you entered",
  INFERRED: "inferred",
  UNKNOWN: "unknown",
};

interface ConfidenceBadgeProps {
  confidence: number;
  source?: FieldSource;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  source,
  showLabel = true,
  className,
}: ConfidenceBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border",
        confidenceToColor(confidence),
        className
      )}
    >
      {showLabel && confidenceLabel(confidence)}
      {source && source !== "UNKNOWN" && (
        <span className="opacity-70">· {sourceLabels[source]}</span>
      )}
    </span>
  );
}
