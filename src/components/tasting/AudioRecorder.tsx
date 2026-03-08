"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type RecorderState = "idle" | "recording" | "uploading" | "processing" | "done" | "denied" | "unsupported";

interface AudioRecorderProps {
  tastingId: string;
  hasExistingAudio?: boolean;
}

// Web Speech API types
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (e: SpeechRecognitionEvent) => void;
  onerror: (e: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start(): void;
  stop(): void;
}
declare const webkitSpeechRecognition: new () => SpeechRecognition;
declare const SpeechRecognition: new () => SpeechRecognition;

export function AudioRecorder({ tastingId, hasExistingAudio = false }: AudioRecorderProps) {
  const router = useRouter();
  const [state, setState] = useState<RecorderState>(hasExistingAudio ? "done" : "idle");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check browser support on mount
  useEffect(() => {
    const supported =
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    if (!supported) setState("unsupported");
  }, []);

  const startRecording = useCallback(() => {
    if (typeof window === "undefined") return;

    if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
      toast.error("Microphone requires HTTPS — use wine.nickpegan.com");
      return;
    }

    const SR = (window as unknown as Record<string, unknown>).SpeechRecognition as typeof SpeechRecognition | undefined
      ?? (window as unknown as Record<string, unknown>).webkitSpeechRecognition as typeof webkitSpeechRecognition | undefined;

    if (!SR) { setState("unsupported"); return; }

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscript);
      setInterimText(interim);
    };

    recognition.onerror = (e) => {
      if (e.error === "not-allowed") {
        setState("denied");
      } else {
        toast.error(`Microphone error: ${e.error}`);
        setState("idle");
      }
    };

    recognition.onend = () => {
      setInterimText("");
      // If we're still supposed to be recording, restart (Chrome stops after ~60s silence)
      if (recognitionRef.current === recognition && state === "recording") {
        try { recognition.start(); } catch { /* already stopped */ }
      }
    };

    setTranscript("");
    setInterimText("");
    setState("recording");
    recognition.start();
  }, [state]);

  const stopRecording = useCallback(async () => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) recognition.stop();

    setState("uploading");
    const finalText = transcript.trim();

    if (!finalText) {
      toast.error("No speech detected — try again");
      setState("idle");
      return;
    }

    try {
      const res = await fetch(`/api/tastings/${tastingId}/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalText }),
      });
      if (!res.ok) throw new Error("Failed to save");

      setState("processing");
      toast.success("Processing tasting notes...");

      const poll = setInterval(async () => {
        const statusRes = await fetch(`/api/tastings/${tastingId}/audio/status`);
        const { status } = await statusRes.json();
        if (status === "done") {
          clearInterval(poll);
          setState("done");
          router.refresh();
          toast.success("Tasting notes extracted!");
        } else if (status === "error") {
          clearInterval(poll);
          setState("idle");
          toast.error("Processing failed");
        }
      }, 2000);
    } catch {
      setState("idle");
      toast.error("Failed to save tasting note");
    }
  }, [transcript, tastingId, router]);

  const showGuide = state === "idle" || state === "recording";

  return (
    <div className="flex flex-col items-center gap-3">
      {showGuide && (
        <div className="w-full rounded-xl border border-border bg-muted/20 p-3 space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">What to cover</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              "Aroma", "Fruit", "Palate & structure", "Acidity",
              "Tannins", "Alcohol", "Sweet / dry", "Finish", "Anything else notable",
            ].map((attr) => (
              <span key={attr} className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {attr}
              </span>
            ))}
          </div>
        </div>
      )}

      {state === "unsupported" && (
        <div className="w-full rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground text-center">
          Voice notes aren&apos;t supported in this browser. Try Chrome or Safari.
        </div>
      )}

      {state === "idle" && (
        <Button onClick={startRecording} variant="outline" className="gap-2 h-14 w-full">
          <Mic className="w-5 h-5 text-primary" />
          Tap to Dictate Tasting Note
        </Button>
      )}

      {state === "recording" && (
        <div className="w-full space-y-3">
          <Button onClick={stopRecording} variant="destructive" className="gap-2 h-14 w-full">
            <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
            Listening... Tap to Stop
          </Button>
          {(transcript || interimText) && (
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm text-foreground min-h-16">
              <span>{transcript}</span>
              <span className="text-muted-foreground">{interimText}</span>
            </div>
          )}
        </div>
      )}

      {state === "uploading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Saving transcript...
        </div>
      )}

      {state === "processing" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Extracting tasting notes...
        </div>
      )}

      {state === "done" && (
        <div className="w-full space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600 justify-center py-2">
            <CheckCircle className="w-4 h-4" />
            Tasting note saved
          </div>
          <Button onClick={() => { setTranscript(""); setState("idle"); }} variant="outline" size="sm" className="w-full">
            <Mic className="w-4 h-4 mr-2" />
            Re-record
          </Button>
        </div>
      )}

      {state === "denied" && (
        <div className="w-full rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-destructive font-medium text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Microphone access denied
          </div>
          <p className="text-sm text-muted-foreground">
            Tap the <strong>⋯ menu → Settings → Privacy → Clear Browsing Data</strong>, check <strong>Site Settings</strong>, then come back and tap Try Again.
          </p>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setState("idle")}>
            <MicOff className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
