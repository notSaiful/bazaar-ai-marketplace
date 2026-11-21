"use client";
import { useEffect, useState } from "react";
import { useT } from "./lang";

/** Polls the stock endpoint (stands in for Supabase Realtime) so the badge follows seller edits within ~2s. */
export function StockBadge({ id, initial, threshold = 5 }: { id: string; initial: number; threshold?: number }) {
  const tr = useT();
  const [stock, setStock] = useState(initial);
  useEffect(() => {
    let alive = true;
    const tick = () => fetch(`/api/stock?ids=${id}`, { cache: "no-store" }).then((r) => r.json()).then((j) => alive && typeof j[id] === "number" && setStock(j[id])).catch(() => {});
    const t = setInterval(tick, 2000);
    return () => { alive = false; clearInterval(t); };
  }, [id]);
  if (stock < 1) return <span className="text-sm text-bad">{tr("out_of_stock")}</span>;
  if (stock <= threshold) return <span className="text-sm text-warn">{tr("low_stock", { n: stock })}</span>;
  return <span className="text-sm text-ok">{tr("in_stock")}</span>;
}
