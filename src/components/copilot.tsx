"use client";
import { useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { HBars } from "./charts";
import { btn, Card } from "./ui";
import { cn } from "@/lib/utils";

interface A { q: string; text: string; source: string; chart?: { label: string; value: number }[] }
const Q = ["Who are my top sellers?", "How is commission trending?", "Does the ledger reconcile?", "Any fraud flags?", "What's low on stock?"];

export function Copilot() {
  const [items, setItems] = useState<A[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  async function ask(text: string) {
    if (!text.trim()) return;
    setBusy(true); setQ("");
    const r = await fetch("/api/copilot", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: text }) });
    const j = await r.json();
    setItems((x) => [{ q: text, text: j.text ?? j.error, source: j.source ?? "", chart: j.chart }, ...x]);
    setBusy(false);
  }
  return (
    <Card className="p-5">
      <h2 className="mb-1 flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-accent" /> Admin copilot</h2>
      <p className="mb-3 text-xs text-muted">Answers come from read-only views. It cannot change data.</p>
      <div className="mb-3 flex flex-wrap gap-2">{Q.map((x) => <button key={x} onClick={() => ask(x)} className="rounded-full border border-line bg-surface px-3 py-1 text-xs hover:bg-surface2">{x}</button>)}</div>
      <form onSubmit={(e) => { e.preventDefault(); ask(q); }} className="flex gap-2"><label htmlFor="cq" className="sr-only">Ask the copilot</label><input id="cq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about GMV, commission, sellers…" className="h-10 flex-1 rounded-xl border border-line bg-surface px-3 text-sm" /><button disabled={busy} aria-label="Ask" className={cn(btn("primary"), "w-10 px-0")}><Send className="size-4" /></button></form>
      <div className="mt-4 space-y-4">
        {items.map((a, i) => (
          <div key={i} className="rounded-xl bg-surface2 p-3 text-sm">
            <div className="text-xs text-muted">Q: {a.q}</div>
            <p className="mt-1">{a.text}</p>
            {a.chart && a.chart.length > 0 && <div className="mt-3"><HBars data={a.chart.slice(0, 6)} money={!/stock/i.test(a.q)} /></div>}
            <div className="mt-2 text-[11px] text-muted">Source: {a.source}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
