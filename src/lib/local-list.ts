"use client";
import { useSyncExternalStore } from "react";

/**
 * A small list kept in this browser only (localStorage), shared by every component on the page through
 * useSyncExternalStore. Values are re-validated on every read: localStorage is user-editable, so anything
 * that fails `valid` is dropped. Store ids and display hints only, never prices (the server owns those).
 */
export function localList<T>(key: string, max: number, valid: (x: unknown) => x is T, idOf: (x: T) => string) {
  const EVT = `${key}-change`;
  const EMPTY: T[] = [];
  let cacheRaw: string | null = null;
  let cacheVal: T[] = EMPTY;

  function read(): T[] {
    let raw: string | null = null;
    try { raw = localStorage.getItem(key); } catch {}
    if (raw === cacheRaw) return cacheVal;
    cacheRaw = raw;
    try {
      const v: unknown = JSON.parse(raw ?? "[]");
      cacheVal = Array.isArray(v) ? v.filter(valid).slice(0, max) : EMPTY;
    } catch { cacheVal = EMPTY; }
    return cacheVal;
  }
  function write(next: T[]) {
    try { localStorage.setItem(key, JSON.stringify(next.slice(0, max))); } catch {}
    window.dispatchEvent(new Event(EVT));
  }
  const subscribe = (cb: () => void) => {
    window.addEventListener("storage", cb);
    window.addEventListener(EVT, cb);
    return () => { window.removeEventListener("storage", cb); window.removeEventListener(EVT, cb); };
  };

  return {
    max,
    read,
    write,
    has: (id: string) => read().some((x) => idOf(x) === id),
    /** Adds to the front (moving it if already present). Returns false when the list is full. */
    add(item: T): boolean {
      const cur = read().filter((x) => idOf(x) !== idOf(item));
      if (cur.length >= max) return false;
      write([item, ...cur]);
      return true;
    },
    remove: (id: string) => write(read().filter((x) => idOf(x) !== id)),
    clear: () => write([]),
    use: () => useSyncExternalStore(subscribe, read, () => EMPTY),
  };
}

export const PRODUCT_ID = /^p_[a-z0-9_]{1,40}$/i;
