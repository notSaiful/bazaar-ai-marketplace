"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Send, Sparkles, X, ShoppingCart, ChevronDown, MessageCircle } from "lucide-react";
import { useCart } from "./cart";
import { AiDemoBadge } from "./ai-demo-badge";
import { ProductArt, btn } from "./ui";
import { formatINR } from "@/lib/money";
import { artUrl, cn } from "@/lib/utils";
import type { AssistantReply } from "@/lib/assistant";
import { useT } from "./lang";

/** `key` marks UI-authored bot lines (greeting), translated at render time so they follow the language toggle. */
interface Msg { from: "me" | "bot"; text: string; key?: string; data?: AssistantReply }
// Hinglish example prompts: kept as-is in both languages (the assistant understands them either way).
const PROMPTS = ["Diwali gift 2000 tak maa ke liye", "sardi ke liye shawl", "diya aur masala chai"];

export function Assistant({ aiLive = false }: { aiLive?: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "", key: "shop.assistant.greeting" }]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const { lines, add, setOpen: openCart } = useCart();
  const end = useRef<HTMLDivElement>(null);
  const sendRef = useRef<(q: string) => void>(() => {});
  // NB: effect bodies must not return a value: React would call it as a cleanup (this caused "i is not a function").
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [msgs, open]);
  useEffect(() => {
    const show = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent<string>).detail;
      if (typeof q === "string" && q) sendRef.current(q);
    };
    window.addEventListener("open-assistant", show);
    // Replay a ✨ tap that happened before this lazily loaded panel arrived (see assistant-lazy.tsx).
    const w = window as Window & { __bzAsk?: string; __bzAssistantReady?: boolean };
    w.__bzAssistantReady = true;
    if (w.__bzAsk !== undefined) { const q = w.__bzAsk; delete w.__bzAsk; setTimeout(() => show(new CustomEvent("open-assistant", { detail: q })), 0); }
    return () => { window.removeEventListener("open-assistant", show); w.__bzAssistantReady = false; };
  }, []);

  async function send(q: string) {
    if (!q.trim() || busy) return;
    setMsgs((m) => [...m, { from: "me", text: q }]);
    setText("");
    setBusy(true);
    try {
      const r = await fetch("/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ message: q, cart: lines }) });
      const data = (await r.json()) as AssistantReply;
      setMsgs((m) => [...m, { from: "bot", text: data.reply ?? t("shop.assistant.error"), data }]);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: t("shop.assistant.offline") }]);
    } finally { setBusy(false); }
  }

  useEffect(() => { sendRef.current = send; });

  return (
    <>
      <button onClick={() => setOpen(true)} className={cn("fixed bottom-5 right-5 z-40 hidden h-14 items-center gap-3 rounded-full bg-[linear-gradient(100deg,#0f766e_0%,#14b8a6_45%,#f59e0b_100%)] pl-2 pr-2 text-white shadow-xl shadow-teal-900/20 transition hover:scale-105 md:flex", open && "md:hidden")}>
        <span className="grid size-10 place-items-center rounded-full bg-white/20"><Sparkles className="size-5" /></span><span className="text-sm font-semibold">{t("shop.assistant.ask")}</span><span className="grid size-10 place-items-center rounded-full bg-white text-amber-600"><MessageCircle className="size-5" /></span>
      </button>
      {open && (
        <section role="dialog" aria-label={t("assistant")} className="pop fixed inset-x-0 bottom-0 z-[65] flex h-[85dvh] flex-col rounded-t-3xl border border-line bg-bg shadow-2xl sm:inset-x-auto sm:bottom-4 sm:right-4 sm:h-[620px] sm:w-[400px] sm:rounded-3xl">
          <header className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2"><span className="grid size-8 place-items-center rounded-full bg-accent-soft text-accent"><Bot className="size-4" /></span><div><div className="text-sm font-semibold">{t("shop.assistant.title")}</div><div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">{t("shop.assistant.langs")}{!aiLive && <AiDemoBadge />}</div></div></div>
            <button aria-label={t("shop.assistant.close")} onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-lg hover:bg-surface2"><X className="size-4" /></button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[92%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm", m.from === "me" ? "bg-accent text-accent-fg" : "bg-surface2")}>
                  {m.key ? t(m.key) : m.text}
                  {m.data && m.data.cards.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.data.cards.map((c) => (
                        <div key={c.id} className="flex gap-2 rounded-xl border border-line bg-surface p-2 text-fg">
                          <div className="size-14 shrink-0 overflow-hidden rounded-lg"><ProductArt src={artUrl(c)} alt="" sizes="64px" /></div>
                          <div className="min-w-0 flex-1">
                            <Link href={`/product/${c.id}`} className="line-clamp-1 text-sm font-medium hover:underline" onClick={() => setOpen(false)}>{c.title}</Link>
                            <div className="text-xs text-muted">{c.sellerName} · {c.stock <= 5 ? t("shop.assistant.onlyLeft", { n: c.stock }) : t("shop.assistant.inStock")}</div>
                            {c.why[0] && <div className="text-[11px] text-accent">{t("shop.assistant.why", { why: c.why[0] })}</div>}
                            <div className="mt-1 flex items-center justify-between"><span className="text-sm font-semibold tabular-nums">{formatINR(c.price)}</span><button onClick={() => add(c.id)} className={btn("outline", "sm")}>{t("shop.assistant.add")}</button></div>
                          </div>
                        </div>
                      ))}
                      {m.data.suggestedCart.length > 1 && (
                        <button className={cn(btn("primary"), "w-full")} onClick={() => { m.data!.suggestedCart.forEach((l) => add(l.productId, l.qty)); openCart(true); setOpen(false); }}>
                          <ShoppingCart className="size-4" /> {t("shop.assistant.addAll", { total: formatINR(m.data.suggestedTotal ?? 0) })}
                        </button>
                      )}
                    </div>
                  )}
                  {m.data && m.data.trace.length > 0 && (
                    <details className="mt-2 text-[11px] text-muted">
                      <summary className="flex cursor-pointer items-center gap-1"><ChevronDown className="size-3" /> {t("shop.assistant.trace")}</summary>
                      <ul className="mt-1 space-y-0.5 font-mono">{m.data.trace.map((step, k) => <li key={k}>{step.tool}({step.args}) → {step.result}</li>)}</ul>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {busy && <div className="text-sm text-muted">{t("shop.assistant.busy")}</div>}
            <div ref={end} />
          </div>
          <div className="space-y-2 border-t border-line p-3">
            <div className="flex gap-2 overflow-x-auto pb-1">{PROMPTS.map((p) => <button key={p} onClick={() => send(p)} className="shrink-0 rounded-full border border-line bg-surface px-3 py-2 text-xs hover:bg-surface2">{p}</button>)}</div>
            <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="flex gap-2">
              <label className="sr-only" htmlFor="assistant-input">{t("shop.assistant.message")}</label>
              <input id="assistant-input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t("shop.assistant.placeholder")} className="h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-sm" />
              <button className={cn(btn("primary"), "size-11 px-0")} aria-label={t("shop.assistant.send")} disabled={busy}><Send className="size-4" /></button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}
