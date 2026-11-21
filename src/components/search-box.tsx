"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search } from "lucide-react";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { ProductArt } from "./ui";

interface R { ms: number; total: number; parsed: { intents: string[]; maxPrice?: number }; results: { id: string; title: string; price: number; emoji: string; hue: number; image?: string; why: string[] }[] }

export function SearchBox({ placeholder, initial = "", big = false }: { placeholder: string; initial?: string; big?: boolean }) {
  const [q, setQ] = useState(initial);
  const [r, setR] = useState<R | null>(null);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setR(null); return; }
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
      <form role="search" onSubmit={(e) => { e.preventDefault(); setOpen(false); router.push(`/search?q=${encodeURIComponent(q)}`); }}>
        <label htmlFor={big ? "hero-search" : "nav-search"} className="sr-only">Search products</label>
        <div className={`flex items-center gap-2 rounded-lg border border-line bg-surface px-3 transition focus-within:border-fg/40 focus-within:ring-4 focus-within:ring-fg/5 ${big ? "h-12" : "h-9"}`}>
          <Search className="size-4 shrink-0 text-muted" />
          <input id={big ? "hero-search" : "nav-search"} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} placeholder={placeholder} autoComplete="off" className="w-full bg-transparent text-sm outline-none placeholder:text-muted sm:text-base" />
        </div>
      </form>
      {open && r && q.trim().length >= 2 && (
        <div className="pop absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl">
          {r.results.length === 0 ? <p className="p-4 text-sm text-muted">No matches. Try “kurta”, “diya”, or “sardi ke liye shawl”.</p> : (
            <ul>
              {r.results.map((p) => (
                <li key={p.id}>
                  <Link href={`/product/${p.id}`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 hover:bg-surface2">
                    <div className="size-10 shrink-0 overflow-hidden rounded-lg"><ProductArt src={artUrl(p)} alt="" /></div>
                    <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{p.title}</div><div className="truncate text-xs text-muted">{p.why[0] ?? "Related"}</div></div>
                    <div className="text-sm font-semibold tabular-nums">{formatINR(p.price)}</div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/search?q=${encodeURIComponent(q)}`} onClick={() => setOpen(false)} className="flex justify-between border-t border-line px-3 py-2 text-xs text-muted hover:bg-surface2"><span>See all {r.total} results</span></Link>
        </div>
      )}
    </div>
  );
}
