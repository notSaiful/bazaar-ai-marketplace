"use client";
import { Sparkles } from "lucide-react";

/** Header entry point for the assistant on small screens (the floating button is desktop-only so it never covers Add). */
export function AssistantTrigger() {
  return (
    <button aria-label="Ask for help" className="grid size-11 place-items-center rounded-xl border border-line bg-surface hover:bg-surface2 md:hidden" onClick={() => window.dispatchEvent(new Event("open-assistant"))}>
      <Sparkles className="size-5 text-accent" />
    </button>
  );
}
