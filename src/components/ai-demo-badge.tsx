"use client";
import { cn } from "@/lib/utils";
import { useT } from "./lang";

/**
 * Shown only while Claude is not configured (no ANTHROPIC_API_KEY on the server), so a demo is honest
 * about running on built-in rules. Parents render it only when `aiLive` is false.
 */
export function AiDemoBadge({ className }: { className?: string }) {
  const t = useT();
  return (
    <span
      role="note"
      title={t("ai.demoHint")}
      className={cn("inline-flex items-center gap-1 rounded-md border border-line bg-surface2 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted", className)}
    >
      <span className="size-1.5 rounded-full bg-warn" aria-hidden />
      {t("ai.demo")}
      <span className="sr-only">. {t("ai.demoHint")}</span>
    </span>
  );
}
