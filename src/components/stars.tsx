import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Read-only star row. Supports halves visually by clipping the filled layer. */
export function Stars({ value, size = "size-4", className, label = true }: { value: number; size?: string; className?: string; label?: boolean }) {
  const pct = Math.max(0, Math.min(5, value)) / 5 * 100;
  return (
    <span className={cn("relative inline-flex shrink-0", className)} role={label ? "img" : undefined} aria-label={label ? `${value.toFixed(1)} out of 5 stars` : undefined} aria-hidden={label ? undefined : true}>
      <span className="flex text-line">{[0, 1, 2, 3, 4].map((i) => <Star key={i} className={cn(size, "fill-current")} />)}</span>
      <span className="absolute inset-0 flex overflow-hidden text-fg" style={{ width: `${pct}%` }}>{[0, 1, 2, 3, 4].map((i) => <Star key={i} className={cn(size, "shrink-0 fill-current")} />)}</span>
    </span>
  );
}
