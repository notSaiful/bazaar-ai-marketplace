"use client";
import { useRef, useState, useSyncExternalStore } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, useT } from "./lang";

/** Minimal Web Speech API types (not in every TS lib.dom yet). */
interface SRResult { isFinal: boolean; 0: { transcript: string } }
interface SREvent { resultIndex: number; results: ArrayLike<SRResult> }
interface SR {
  lang: string; interimResults: boolean; continuous: boolean; maxAlternatives: number;
  onresult: ((e: SREvent) => void) | null; onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null;
  start(): void; stop(): void; abort(): void;
}
type SRCtor = new () => SR;
const getSR = (): SRCtor | undefined => (typeof window === "undefined" ? undefined : ((window as unknown as { SpeechRecognition?: SRCtor; webkitSpeechRecognition?: SRCtor }).SpeechRecognition ?? (window as unknown as { webkitSpeechRecognition?: SRCtor }).webkitSpeechRecognition));
const noop = () => () => {};

/**
 * Speak to search. Hindi UI listens in hi-IN (Devanagari, which search understands); English UI in en-IN,
 * which also transcribes Hinglish. Hidden where the browser has no speech recognition.
 */
export function VoiceSearch({ onText, onFinal, className }: { onText: (t: string) => void; onFinal: (t: string) => void; className?: string }) {
  const t = useT();
  const lang = useLang();
  const supported = useSyncExternalStore(noop, () => !!getSR(), () => false);
  const [listening, setListening] = useState(false);
  const [note, setNote] = useState("");
  const rec = useRef<SR | null>(null);

  if (!supported) return null;

  function toggle() {
    if (listening) { rec.current?.stop(); return; }
    const Ctor = getSR();
    if (!Ctor) return;
    const r = new Ctor();
    r.lang = lang === "hi" ? "hi-IN" : "en-IN";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    let finalText = "";
    r.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      onText((finalText + interim).trim());
    };
    r.onerror = (e) => setNote(e.error === "not-allowed" || e.error === "service-not-allowed" ? t("shop.voice.denied") : e.error === "no-speech" ? t("shop.voice.error") : "");
    r.onend = () => {
      setListening(false);
      rec.current = null;
      const text = finalText.trim();
      if (text) onFinal(text);
    };
    rec.current = r;
    setNote(t("shop.voice.listening"));
    setListening(true);
    try { r.start(); } catch { setListening(false); setNote(t("shop.voice.error")); }
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={listening}
        aria-label={listening ? t("shop.voice.stop") : t("shop.voice.start")}
        title={listening ? t("shop.voice.stop") : t("shop.voice.start")}
        className={cn("relative grid size-8 shrink-0 place-items-center rounded-md transition hover:bg-surface2", listening ? "text-bad" : "text-fg", className)}
      >
        {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
        {listening && <span className="absolute right-1 top-1 size-1.5 animate-ping rounded-full bg-bad" aria-hidden />}
      </button>
      <span className="sr-only" aria-live="polite">{listening || note ? note : ""}</span>
      {note && !listening && <span role="status" className="absolute left-0 right-0 top-full z-50 mt-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs text-muted shadow">{note}</span>}
    </>
  );
}
