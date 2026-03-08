"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PhotoPickerStepProps {
  tripId?: string;
  onUploaded: (batchId: string) => void;
}

export function PhotoPickerStep({ tripId, onUploaded }: PhotoPickerStepProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const total = selectedFiles.length + files.length;

    if (total > 8) {
      toast.error("Maximum 8 photos at once");
      const allowed = files.slice(0, 8 - selectedFiles.length);
      addFiles(allowed);
      return;
    }

    addFiles(files);
  };

  const addFiles = (files: File[]) => {
    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setSelectedFiles((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index]);
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    setUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("photos", file));
      if (tripId) formData.append("tripId", tripId);

      const res = await fetch("/api/upload/photos", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { batchId } = await res.json();
      toast.success(`${selectedFiles.length} photo${selectedFiles.length > 1 ? "s" : ""} uploaded!`);
      onUploaded(batchId);
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-lg mx-auto">
      {/* Upload zone */}
      <div
        className="border-2 border-dashed border-border rounded-2xl p-8 flex flex-col items-center gap-4 cursor-pointer active:bg-muted/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Camera className="w-8 h-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-semibold">Select Wine Label Photos</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tap to choose from camera roll · Up to 8 photos
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFilesSelected}
        />
      </div>

      {/* Photo grid */}
      {previews.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-3">
            {previews.length} photo{previews.length !== 1 ? "s" : ""} selected
          </p>
          <div className="grid grid-cols-3 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                <Image src={src} alt={`Photo ${i + 1}`} fill className="object-cover" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}

            {/* Add more button */}
            {previews.length < 8 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                <span className="text-2xl">+</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload button */}
      {selectedFiles.length > 0 && (
        <Button
          className="w-full h-12 text-base"
          onClick={handleUpload}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 mr-2" />
              Upload & Analyze {selectedFiles.length} Photo{selectedFiles.length > 1 ? "s" : ""}
            </>
          )}
        </Button>
      )}

      {tripId && (
        <p className="text-xs text-center text-muted-foreground">
          These wines will be added to your trip
        </p>
      )}
    </div>
  );
}
