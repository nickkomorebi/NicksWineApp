import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return score.toString();
}

export function scoreToColor(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 95) return "text-emerald-600";
  if (score >= 90) return "text-green-600";
  if (score >= 85) return "text-lime-600";
  if (score >= 80) return "text-yellow-600";
  return "text-orange-600";
}

export function confidenceToColor(confidence: number): string {
  if (confidence >= 0.8) return "bg-green-100 text-green-800 border-green-200";
  if (confidence >= 0.5) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
}

export function confidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.5) return "Medium";
  return "Low";
}

export function wineDisplayName(wine: {
  brand?: { value: string } | null;
  name?: { value: string } | null;
  vintage?: { value: string } | null;
}): string {
  const parts = [
    wine.brand?.value,
    wine.name?.value,
    wine.vintage?.value ? `(${wine.vintage.value})` : null,
  ].filter(Boolean);
  return parts.join(" ") || "Unnamed Wine";
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 11);
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
