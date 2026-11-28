"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useAfterLoad } from "@/lib/use-after-load";

type W = Window & { __bzAsk?: string; __bzAssistantReady?: boolean };

// The chat panel is not needed for first paint, so keep it out of the initial bundle (PRD NFR-01/02),
// and only fetch it after the page has painted (or at once if someone asks for it before then).
const Assistant = dynamic(() => import("./assistant").then((m) => m.Assistant), { ssr: false });

export function AssistantLazy({ aiLive }: { aiLive: boolean }) {
  const ready = useAfterLoad();
  const [asked, setAsked] = useState(false);
  // If someone taps ✨ before the chunk arrives, remember the request; Assistant replays it on mount.
  useEffect(() => {
    const w = window as W;
    const early = (e: Event) => {
      if (w.__bzAssistantReady) return;
      w.__bzAsk = (e as CustomEvent<string>).detail ?? "";
      setAsked(true);
    };
    window.addEventListener("open-assistant", early);
    return () => window.removeEventListener("open-assistant", early);
  }, []);
  return ready || asked ? <Assistant aiLive={aiLive} /> : null;
}
