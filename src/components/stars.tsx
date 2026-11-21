import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { t, type Lang } from "@/lib/i18n";

/** Read-only star row. Supports halves visually by clipping the filled layer. */
export function Stars({ value, size = "size-4", className, label = true, lang = "en" }: { value: number; size?: string; className?: string; label?: boolean; lang?: Lang }) {
  const pct = Math.max(0, Math.min(5, value)) / 5 * 100;
  return (
    <span className={cn("relative inline-flex shrink-0", className)} role={label ? "img" : undefined} aria-label={label ? t("shop.stars.label", lang, { v: value.toFixed(1) }) : undefined} aria-hidden={label ? undefined : true}>
      <span className="flex text-line">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className={cn(size, "fill-current")} />)}</span>
      <span className="absolute inset-0 flex overflow-hidden text-fg" style={{ width: `${pct}%` }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className={cn(size, "shrink-0 fill-current")} />)}</span>
    </span>
  );
}
