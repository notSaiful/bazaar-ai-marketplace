"use client";
import { Sparkles } from "lucide-react";
import { useT } from "./lang";

/** Header entry point for the assistant on small screens (the floating button is desktop-only so it never covers Add). */
export function AssistantTrigger() {
  const t = useT();
  return (
    <button aria-label={t("shop.assistant.ask")} className="grid size-11 place-items-center rounded-xl border border-line bg-surface hover:bg-surface2 md:hidden" onClick={() => window.dispatchEvent(new Event("open-assistant"))}>
      <Sparkles className="size-5 text-accent" />
    </button>
  );
}
