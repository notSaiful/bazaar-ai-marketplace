import type { ReactNode } from "react";

/** Infinite horizontal marquee. Items are rendered twice so the loop is seamless. */
export function Ticker({ items, label }: { items: ReactNode[]; label: string }) {
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {items.map((it, i) => <li key={i} className="shrink-0">{it}</li>)}
    </ul>
  );
  return (
    <div className="ticker-wrap ticker-mask overflow-hidden" role="region" aria-label={label}>
      <div className="ticker">{row(false)}{row(true)}</div>
    </div>
  );
}
