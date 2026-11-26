"use client";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useLang, useT } from "./lang";
import { ProductArt } from "./ui";

/**
 * Recently viewed products, kept in this browser only (localStorage). We store id, titles and photo,
 * never a price: prices are owned by the server and could be stale, so the cards link to the live page.
 */
export interface RecentItem { id: string; title: string; titleHi: string; image: string }
const KEY = "bz_recent";
const EVT = "bz-recent";
const MAX = 12;
const EMPTY: RecentItem[] = [];

let cacheRaw: string | null = null;
let cacheVal: RecentItem[] = EMPTY;
function read(): RecentItem[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch {}
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try {
    const v = JSON.parse(raw ?? "[]");
    cacheVal = Array.isArray(v) ? v.filter((x) => x && typeof x.id === "string" && /^p_\w+$/.test(x.id) && typeof x.title === "string" && typeof x.image === "string").slice(0, MAX) : EMPTY;
  } catch { cacheVal = EMPTY; }
  return cacheVal;
}
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(EVT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVT, cb); };
};
const useRecent = () => useSyncExternalStore(subscribe, read, () => EMPTY);

/** Drop on a product page: remembers the visit (most recent first). Renders nothing. */
export function RecordView({ item }: { item: RecentItem }) {
  useEffect(() => {
    const next = [item, ...read().filter((x) => x.id !== item.id)].slice(0, MAX);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new Event(EVT));
  }, [item]);
  return null;
}

export function RecentlyViewed({ exclude, className }: { exclude?: string; className?: string }) {
  const t = useT();
  const lang = useLang();
  const items = useRecent().filter((x) => x.id !== exclude);
  if (!items.length) return null;
  const clear = () => {
    try { localStorage.removeItem(KEY); } catch {}
    window.dispatchEvent(new Event(EVT));
  };
  return (
    <section aria-labelledby="recent-title" className={className}>
      <div className="mb-4 flex items-center justify-between">
        <h2 id="recent-title" className="text-base font-semibold tracking-tight">{t("browse.recent.title")}</h2>
        <button type="button" onClick={clear} className="text-sm text-muted transition hover:text-fg">{t("browse.recent.clear")}</button>
      </div>
      <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {items.map((x) => (
          <li key={x.id} className="w-32 shrink-0 snap-start sm:w-36">
            <Link href={`/product/${x.id}`} className="group block">
              <span className="block overflow-hidden rounded-xl bg-surface2"><ProductArt src={x.image} alt="" sizes="144px" className="transition duration-500 group-hover:scale-105" /></span>
              <span className="mt-2 line-clamp-2 block text-xs font-medium leading-snug">{lang === "hi" && x.titleHi ? x.titleHi : x.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
