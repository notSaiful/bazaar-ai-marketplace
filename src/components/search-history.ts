"use client";
import { useSyncExternalStore } from "react";

/** Recent searches in this browser only (localStorage), newest first. */
const KEY = "bz_searches";
const EVT = "bz-searches";
const MAX = 6;
const EMPTY: string[] = [];
let cacheRaw: string | null = null;
let cacheVal: string[] = EMPTY;

function read(): string[] {
  let raw: string | null = null;
  try { raw = localStorage.getItem(KEY); } catch {}
  if (raw === cacheRaw) return cacheVal;
  cacheRaw = raw;
  try {
    const v = JSON.parse(raw ?? "[]");
    cacheVal = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((x) => x.slice(0, 80)).slice(0, MAX) : EMPTY;
  } catch { cacheVal = EMPTY; }
  return cacheVal;
}
function write(list: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  window.dispatchEvent(new Event(EVT));
}
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(EVT, cb);
  return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVT, cb); };
};

export const useSearchHistory = () => useSyncExternalStore(subscribe, read, () => EMPTY);
export function saveSearch(q: string) {
  const s = q.trim().replace(/\s+/g, " ").slice(0, 80);
  if (s.length < 2) return;
  write([s, ...read().filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, MAX));
}
export const removeSearch = (q: string) => write(read().filter((x) => x !== q));
export const clearSearches = () => write([]);

/** Curated, catalogue-backed suggestions (each returns results in our search). */
export const TRENDING: Record<"en" | "hi", string[]> = {
  en: ["diwali diya", "silver jhumka", "masala chai", "sardi ke liye shawl", "gift under 1000", "block print kurta"],
  hi: ["दिवाली के दीये", "चांदी के झुमके", "मसाला चाय", "सर्दी के लिए शॉल", "1000 तक उपहार", "कुर्ता"],
};
