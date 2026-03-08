"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoPickerStep } from "./PhotoPickerStep";
import { ProcessingStep } from "./ProcessingStep";
import { ReviewStep } from "./ReviewStep";

export type UploadStep = "pick" | "processing" | "review" | "done";

interface UploadFlowProps {
  tripId?: string;
}

export function UploadFlow({ tripId }: UploadFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<UploadStep>("pick");
  const [batchId, setBatchId] = useState<string | null>(null);

  const handlePhotosUploaded = (newBatchId: string) => {
    setBatchId(newBatchId);
    setStep("processing");
  };

  const handleProcessingComplete = () => {
    setStep("review");
  };

  const handleConfirmed = (wineIds: string[]) => {
    if (wineIds.length === 1) {
      router.push(`/wines/${wineIds[0]}`);
    } else if (wineIds.length > 1) {
      router.push("/wines");
    } else {
      router.push("/wines");
    }
  };

  if (step === "pick") {
    return <PhotoPickerStep tripId={tripId} onUploaded={handlePhotosUploaded} />;
  }

  if (step === "processing" && batchId) {
    return (
      <ProcessingStep
        batchId={batchId}
        onComplete={handleProcessingComplete}
      />
    );
  }

  if (step === "review" && batchId) {
    return (
      <ReviewStep
        batchId={batchId}
        tripId={tripId}
        onConfirmed={handleConfirmed}
      />
    );
  }

  return null;
}
