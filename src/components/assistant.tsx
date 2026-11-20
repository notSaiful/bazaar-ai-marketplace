"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Send, Sparkles, X, ShoppingCart, ChevronDown } from "lucide-react";
import { useCart } from "./cart";
import { ProductArt, btn } from "./ui";
import { formatINR } from "@/lib/money";
import { artUrl, cn } from "@/lib/utils";
import type { AssistantReply } from "@/lib/assistant";

interface Msg { from: "me" | "bot"; text: string; data?: AssistantReply }
const PROMPTS = ["Diwali gift 2000 tak maa ke liye", "sardi ke liye shawl", "diya aur masala chai"];

export function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "Namaste! Tell me what you need and I'll find it and build a cart. Prices and stock are always live." }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { lines, add, setOpen: openCart } = useCart();
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => end.current?.scrollIntoView({ behavior: "smooth" }), [msgs, open]);

  async function send(q: string) {
    if (!q.trim() || busy) return;
    setMsgs((m) => [...m, { from: "me", text: q }]);
    setText("");
    setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: q, cart: lines }) });
      const data = (await r.json()) as AssistantReply;
      setMsgs((m) => [...m, { from: "bot", text: data.reply ?? "Sorry, something went wrong.", data }]);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "I couldn't reach the catalogue just now. Please try again." }]);
    } finally { setBusy(false); }
  }

  return (
    <>
      <button onClick={() => setOpen(true)} aria-label="Open shopping assistant" className={cn("fixed bottom-4 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-accent px-5 text-accent-fg shadow-xl transition hover:scale-105", open && "hidden")}>
        <Sparkles className="size-5" /><span className="hidden text-sm font-semibold sm:inline">Ask for help</span>
      </button>
      {open && (
        <section role="dialog" aria-label="Shopping assistant" className="pop fixed inset-x-0 bottom-0 z-50 flex h-[85dvh] flex-col rounded-t-3xl border border-line bg-bg shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:h-[620px] sm:w-[400px] sm:rounded-3xl">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-accent-soft text-accent"><Bot className="size-4" /></span><div><div className="text-sm font-semibold">Bazaar AI assistant</div><div className="text-xs text-muted">Hindi, English or Hinglish</div></div></div>
            <button aria-label="Close assistant" onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg hover:bg-surface2"><X className="size-4" /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[92%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm", m.from === "me" ? "bg-accent text-accent-fg" : "bg-surface2")}>
                  {m.text}
                  {m.data && m.data.cards.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.data.cards.map((c) => (
                        <div key={c.id} className="flex gap-2 rounded-xl border border-line bg-surface p-2 text-fg">
                          <div className="size-14 shrink-0 overflow-hidden rounded-lg"><ProductArt src={artUrl(c)} alt="" /></div>
                          <div className="min-w-0 flex-1">
                            <Link href={`/product/${c.id}`} className="line-clamp-1 text-sm font-medium hover:underline" onClick={() => setOpen(false)}>{c.title}</Link>
                            <div className="text-xs text-muted">{c.sellerName} · {c.stock <= 5 ? `only ${c.stock} left` : "in stock"}</div>
                            {c.why[0] && <div className="text-[11px] text-accent">Why: {c.why[0]}</div>}
                            <div className="mt-1 flex items-center justify-between"><span className="text-sm font-semibold tabular-nums">{formatINR(c.price)}</span><button onClick={() => add(c.id)} className={btn("outline", "sm")}>Add</button></div>
                          </div>
                        </div>
                      ))}
                      {m.data.suggestedCart.length > 1 && (
                        <button className={cn(btn("primary"), "w-full")} onClick={() => { m.data!.suggestedCart.forEach((l) => add(l.productId, l.qty)); openCart(true); setOpen(false); }}>
                          <ShoppingCart className="size-4" /> Add all to cart · {formatINR(m.data.suggestedTotal ?? 0)}
                        </button>
                      )}
                    </div>
                  )}
                  {m.data && m.data.trace.length > 0 && (
                    <details className="mt-2 text-[11px] text-muted">
                      <summary className="flex cursor-pointer items-center gap-1"><ChevronDown className="size-3" /> How I found this</summary>
                      <ul className="mt-1 space-y-0.5 font-mono">{m.data.trace.map((t, k) => <li key={k}>{t.tool}({t.args}) → {t.result}</li>)}</ul>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="text-sm text-muted">Searching catalogue…</div>}
            <div ref={end} />
          </div>
          <div className="space-y-2 border-t border-line p-3">
            <div className="flex gap-2 overflow-x-auto pb-1">{PROMPTS.map((p) => <button key={p} onClick={() => send(p)} className="shrink-0 rounded-full border border-line bg-surface px-3 py-1 text-xs hover:bg-surface2">{p}</button>)}</div>
            <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2">
              <label className="sr-only" htmlFor="assistant-input">Message</label>
              <input id="assistant-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. 1500 tak ka gift for papa" className="h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-sm" />
              <button className={cn(btn("primary"), "size-11 px-0")} aria-label="Send" disabled={busy}><Send className="size-4" /></button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
