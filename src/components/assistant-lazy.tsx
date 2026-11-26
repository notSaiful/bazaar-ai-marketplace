"use client";
import dynamic from "next/dynamic";
import { useEffect } from "react";

type W = Window & { __bzAsk?: string; __bzAssistantReady?: boolean };

// The chat panel is not needed for first paint, so keep it out of the initial bundle (PRD NFR-01/02).
const Assistant = dynamic(() => import("./assistant").then((m) => m.Assistant), { ssr: false });

export function AssistantLazy({ aiLive }: { aiLive: boolean }) {
  // If someone taps ✨ before the chunk arrives, remember the request; Assistant replays it on mount.
  useEffect(() => {
    const w = window as W;
    const early = (e: Event) => {
      if (!w.__bzAssistantReady) w.__bzAsk = (e as CustomEvent<string>).detail ?? "";
    };
    window.addEventListener("open-assistant", early);
    return () => window.removeEventListener("open-assistant", early);
  }, []);
  return <Assistant aiLive={aiLive} />;
}
