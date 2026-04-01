"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wine, Camera, PenLine, X } from "lucide-react";

export function AddWineCard() {
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  if (expanded) {
    return (
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <div className="p-3 flex flex-col gap-2 h-full">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-muted-foreground">Add wine via…</span>
            <button
              onClick={() => setExpanded(false)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => router.push("/upload")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors p-3 flex-1"
          >
            <Camera className="w-6 h-6 text-primary" />
            <span className="text-xs font-medium text-primary leading-tight text-center">
              Scan Label
            </span>
          </button>

          <button
            onClick={() => router.push("/wines/new")}
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg bg-muted hover:bg-muted/70 transition-colors p-3 flex-1"
          >
            <PenLine className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground leading-tight text-center">
              Enter Manually
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={() => setExpanded(true)} className="block w-full text-left">
      <div className="border border-border rounded-xl overflow-hidden bg-card hover:shadow-md transition-shadow">
        <div className="aspect-[4/3] bg-muted flex items-center justify-center">
          <Wine className="w-10 h-10 text-muted-foreground/30" />
        </div>
        <div className="p-3 flex items-center justify-center border-t border-dashed border-border">
          <span className="text-sm font-medium text-muted-foreground">+ Add Wine</span>
        </div>
      </div>
    </button>
  );
}
