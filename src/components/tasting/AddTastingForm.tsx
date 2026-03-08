"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTasting } from "@/app/actions/tastings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { AudioRecorder } from "./AudioRecorder";
import { toast } from "sonner";
import { Loader2, X, Mic, PenLine, CheckCircle } from "lucide-react";

interface AddTastingFormProps {
  wineId: string;
  tripId?: string;
  onDone: () => void;
}

type Mode = "choose" | "record" | "type";

export function AddTastingForm({ wineId, tripId, onDone }: AddTastingFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("choose");
  const [loading, setLoading] = useState(false);
  const [savedTastingId, setSavedTastingId] = useState<string | null>(null);

  // Form fields (used in "type" mode)
  const [score, setScore] = useState("");
  const [dateDrank, setDateDrank] = useState(new Date().toISOString().split("T")[0]);
  const [aroma, setAroma] = useState("");
  const [fruit, setFruit] = useState("");
  const [palate, setPalate] = useState("");
  const [finish, setFinish] = useState("");
  const [otherNotes, setOtherNotes] = useState("");

  // Create a minimal entry and go straight to the recorder
  const handleRecord = async () => {
    setLoading(true);
    const result = await createTasting({
      wineId,
      tripId,
      dateDrank: new Date(dateDrank).toISOString(),
    });
    setLoading(false);
    if (result.error) { toast.error("Failed to create entry"); return; }
    router.refresh();
    setSavedTastingId(result.data.id);
    setMode("record");
  };

  // Save typed notes (after entry already created in record mode, or fresh)
  const handleTypedSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await createTasting({
      wineId,
      tripId,
      dateDrank: new Date(dateDrank).toISOString(),
      score: score ? parseInt(score) : undefined,
      aroma: aroma || undefined,
      fruit: fruit || undefined,
      palate: palate || undefined,
      finish: finish || undefined,
      otherNotes: otherNotes || undefined,
    });
    setLoading(false);
    if (result.error) { toast.error("Failed to save tasting entry"); return; }
    toast.success("Tasting entry saved!");
    router.refresh();
    setSavedTastingId(result.data.id);
    setMode("record");
  };

  const header = (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-sm">New Tasting Entry</h3>
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={onDone}>
        <X className="w-4 h-4" />
      </Button>
    </div>
  );

  // After typing, offer optional voice note
  if (mode === "record" && savedTastingId) {
    return (
      <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
        {header}
        <AudioRecorder tastingId={savedTastingId} />
        <Separator />
        <Button variant="outline" className="w-full gap-2" onClick={onDone}>
          <CheckCircle className="w-4 h-4" />
          Done
        </Button>
      </div>
    );
  }

  // Initial choice screen
  if (mode === "choose") {
    return (
      <div className="border border-border rounded-xl p-4 space-y-4 bg-card">
        {header}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleRecord}
            disabled={loading}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-center hover:border-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
            ) : (
              <Mic className="w-7 h-7 text-primary" />
            )}
            <span className="text-sm font-medium">Record Voice Note</span>
            <span className="text-xs text-muted-foreground">Speak your notes — Claude structures them</span>
          </button>

          <button
            onClick={() => setMode("type")}
            className="flex flex-col items-center gap-2 rounded-xl border-2 border-border p-5 text-center hover:border-foreground/30 hover:bg-muted/30 transition-colors"
          >
            <PenLine className="w-7 h-7 text-muted-foreground" />
            <span className="text-sm font-medium">Type Notes</span>
            <span className="text-xs text-muted-foreground">Fill in fields manually</span>
          </button>
        </div>
      </div>
    );
  }

  // Type mode
  return (
    <form onSubmit={handleTypedSave} className="border border-border rounded-xl p-4 space-y-4 bg-card">
      {header}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="date">Date Drank</Label>
          <Input id="date" type="date" value={dateDrank} onChange={(e) => setDateDrank(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="score">Score (0–100)</Label>
          <Input id="score" type="number" min={0} max={100} placeholder="e.g. 92"
            value={score} onChange={(e) => setScore(e.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="aroma">Aroma</Label>
        <Textarea id="aroma" placeholder="Describe the nose..." value={aroma}
          onChange={(e) => setAroma(e.target.value)} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fruit">Fruit</Label>
        <Textarea id="fruit" placeholder="Fruit character, type, intensity..." value={fruit}
          onChange={(e) => setFruit(e.target.value)} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="palate">Palate / Structure</Label>
        <Textarea id="palate" placeholder="Taste, structure, mouthfeel..." value={palate}
          onChange={(e) => setPalate(e.target.value)} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="finish">Finish</Label>
        <Textarea id="finish" placeholder="Length, aftertaste..." value={finish}
          onChange={(e) => setFinish(e.target.value)} rows={2} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Other Notes</Label>
        <Textarea id="notes" placeholder="Anything else..." value={otherNotes}
          onChange={(e) => setOtherNotes(e.target.value)} rows={2} />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Save Tasting Entry
      </Button>
    </form>
  );
}
