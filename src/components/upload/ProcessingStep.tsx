"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BatchItem {
  id: string;
  status: string;
  url: string;
  error: string | null;
  retryCount: number;
}

interface Batch {
  id: string;
  status: string;
  totalPhotos: number;
  items: BatchItem[];
}

interface ProcessingStepProps {
  batchId: string;
  onComplete: () => void;
}

export function ProcessingStep({ batchId, onComplete }: ProcessingStepProps) {
  const [autoCompleted, setAutoCompleted] = useState(false);

  const { data: batch } = useQuery<Batch>({
    queryKey: ["batch", batchId],
    queryFn: async () => {
      const res = await fetch(`/api/upload/batch/${batchId}`);
      return res.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data as Batch | undefined;
      if (!data) return 2000;
      const allDone = data.items.every((i) =>
        ["COMPLETED", "FAILED"].includes(i.status)
      );
      return allDone ? false : 2000;
    },
  });

  useEffect(() => {
    if (!batch || autoCompleted) return;
    const allDone = batch.items.every((i) =>
      ["COMPLETED", "FAILED"].includes(i.status)
    );
    if (allDone) {
      setAutoCompleted(true);
      setTimeout(() => onComplete(), 800);
    }
  }, [batch, autoCompleted, onComplete]);

  const completedCount = batch?.items.filter((i) => i.status === "COMPLETED").length ?? 0;
  const failedCount = batch?.items.filter((i) => i.status === "FAILED").length ?? 0;
  const total = batch?.totalPhotos ?? 1;
  const progress = Math.round((completedCount / total) * 100);

  return (
    <div className="p-8 flex flex-col items-center gap-6 max-w-lg mx-auto">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>

      <div className="w-full text-center space-y-2">
        <h2 className="font-semibold text-lg">Analyzing Labels</h2>
        <p className="text-sm text-muted-foreground">
          Claude is reading your wine labels...
        </p>
      </div>

      <Progress value={progress} className="w-full" />

      <div className="w-full space-y-2">
        {batch?.items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            </div>
            <span className="flex-1 text-sm text-muted-foreground">Photo {i + 1}</span>
            {item.status === "COMPLETED" && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            {item.status === "FAILED" && (
              <XCircle className="w-5 h-5 text-destructive" />
            )}
            {["PENDING", "PROCESSING"].includes(item.status) && (
              <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
            )}
          </div>
        ))}
      </div>

      {failedCount > 0 && completedCount + failedCount === total && (
        <div className="w-full space-y-2">
          <p className="text-sm text-muted-foreground text-center">
            {failedCount} photo{failedCount > 1 ? "s" : ""} failed to process.
          </p>
          <Button variant="outline" className="w-full" onClick={onComplete}>
            Continue with {completedCount} successful
          </Button>
        </div>
      )}
    </div>
  );
}
