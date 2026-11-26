"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Search, Sparkles, TrendingUp, X } from "lucide-react";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { ProductArt } from "./ui";
import { useLang, useT } from "./lang";
import { VoiceSearch } from "./voice-search";
import { clearSearches, removeSearch, saveSearch, TRENDING, useSearchHistory } from "./search-history";

interface R { ms: number; total: number; parsed: { intents: string[]; maxPrice?: number }; results: { id: string; title: string; titleHi?: string; price: number; emoji: string; hue: number; image?: string; why: string[] }[] }

export function SearchBox({ placeholder, initial = "", big = false }: { placeholder: string; initial?: string; big?: boolean }) {
  const [q, setQ] = useState(initial);
  const [r, setR] = useState<R | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const tr = useT();
  const lang = useLang();
  const box = useRef<HTMLDivElement>(null);
  const history = useSearchHistory();
  const go = (text: string) => { const s = text.trim(); if (!s) return; saveSearch(s); setQ(s); setOpen(false); router.push(`/search?q=${encodeURIComponent(s)}`); };

  useEffect(() => {
    if (q.trim().length < 2) return;
    const ctl = new AbortController();
    const t = setTimeout(() => fetch(`/api/search?q=${encodeURIComponent(q)}&limit=5`, { signal: ctl.signal }).then((x) => x.json()).then(setR).catch(() => {}), 120);
    return () => { clearTimeout(t); ctl.abort(); };
  }, [q]);
  useEffect(() => {
    const h = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={box} className="relative w-full">
      <form role="search" onSubmit={(e) => { e.preventDefault(); go(q); }}>
        <label htmlFor={big ? "hero-search" : "nav-search"} className="sr-only">{tr("shop.searchbox.label")}</label>
        <div className={`flex items-center gap-2 rounded-lg border border-line bg-surface px-3 transition focus-within:border-fg/40 focus-within:ring-4 focus-within:ring-fg/5 ${big ? "h-12" : "h-9"}`}>
          <Search className="size-4 shrink-0 text-muted" />
          <input id={big ? "hero-search" : "nav-search"} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} autoComplete="off" className="w-full bg-transparent text-sm outline-none placeholder:text-muted sm:text-base" />
          <VoiceSearch onText={(text) => { setQ(text); setOpen(true); }} onFinal={(text) => go(text)} />
          <button type="button" onClick={() => { setOpen(false); window.dispatchEvent(new CustomEvent("open-assistant", { detail: q.trim() })); }} data-tour="assistant" aria-label={tr("shop.searchbox.ask")} title={tr("shop.searchbox.ask")} className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-fg transition hover:bg-surface2">
            <Sparkles className="size-4" />
          </button>
        </div>
      </form>
      {open && q.trim().length < 2 && (
        <div className="pop absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-surface p-2 shadow-xl">
          {history.length > 0 && (
            <div className="mb-1">
              <div className="flex items-center justify-between px-2 py-1.5">
                <span className="text-xs font-medium text-muted">{tr("browse.search.recent")}</span>
                <button type="button" onClick={clearSearches} className="text-xs text-muted hover:text-fg">{tr("browse.search.clear")}</button>
              </div>
              <ul>
                {history.map((h) => (
                  <li key={h} className="group flex items-center rounded-lg hover:bg-surface2">
                    <button type="button" onClick={() => go(h)} className="flex min-w-0 flex-1 items-center gap-2.5 px-2 py-2 text-left text-sm"><Clock className="size-4 shrink-0 text-muted" aria-hidden /><span className="truncate">{h}</span></button>
                    <button type="button" onClick={() => removeSearch(h)} aria-label={tr("browse.search.remove", { q: h })} className="mr-1 grid size-7 shrink-0 place-items-center rounded-md text-muted opacity-60 hover:bg-surface hover:text-fg hover:opacity-100"><X className="size-3.5" /></button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="px-2 py-1.5 text-xs font-medium text-muted">{tr("browse.search.trending")}</div>
          <div className="flex flex-wrap gap-2 px-2 pb-2">
            {TRENDING[lang].map((s) => (
              <button key={s} type="button" onClick={() => go(s)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-sm transition hover:border-fg/30 hover:bg-surface2"><TrendingUp className="size-3.5 text-muted" aria-hidden />{s}</button>
            ))}
          </div>
        </div>
      )}
      {open && r && q.trim().length >= 2 && (
        <div className="pop absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
          {r.results.length === 0 ? <p className="p-4 text-sm text-muted">{tr("shop.searchbox.none")}</p> : (
            <ul>
              {r.results.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.id}`} onClick={() => { saveSearch(q); setOpen(false); }} className="flex items-center gap-3 px-3 py-2 hover:bg-surface2">
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg"><ProductArt src={artUrl(p)} alt="" sizes="40px" /></div>
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{lang === "hi" && p.titleHi ? p.titleHi : p.title}</div><div className="truncate text-xs text-muted">{p.why[0] ?? tr("shop.searchbox.related")}</div></div>
                    <div className="text-sm font-semibold tabular-nums">{formatINR(p.price)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/search?q=${encodeURIComponent(q)}`} onClick={() => { saveSearch(q); setOpen(false); }} className="flex justify-between border-t border-line px-3 py-2 text-xs text-muted hover:bg-surface2"><span>{tr("shop.searchbox.seeAll", { n: r.total })}</span></Link>
        </div>
      )}
    </div>
  );
}
