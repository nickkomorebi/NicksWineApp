"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";

interface DeleteCardOverlayProps {
  children: React.ReactNode;
  label: string;
  onDelete: () => Promise<unknown>;
}

export function DeleteCardOverlay({ children, label, onDelete }: DeleteCardOverlayProps) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await onDelete();
    });
  }

  function handleConfirmClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(true);
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  }

  return (
    <div className="relative">
      {children}

      {!confirming && (
        <button
          onClick={handleConfirmClick}
          aria-label={`Remove ${label}`}
          className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center shadow text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {confirming && (
        <div className="absolute inset-0 z-10 rounded-xl bg-background/92 backdrop-blur-sm flex flex-col items-center justify-center gap-2 p-3">
          <p className="text-sm font-semibold text-center">Remove {label}?</p>
          <p className="text-xs text-muted-foreground text-center leading-tight">
            It stays saved in the database
          </p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="px-3 py-1.5 text-xs rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
            >
              {isPending ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
