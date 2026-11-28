"use client";
import { useSyncExternalStore } from "react";

/**
 * True once the page has finished loading and the main thread has had an idle moment. Use it to hold back
 * anything that is not needed for the first screen (videos, the guided tour, the compare tray...), so it
 * never competes with the first paint. One shared timer for the whole page; false during SSR/hydration.
 */
let ready = false;
let started = false;
const listeners = new Set<() => void>();

function start() {
  if (started) return;
  started = true;
  const done = () => { ready = true; listeners.forEach((l) => l()); };
  // Safari has no requestIdleCallback: fall back to a short timeout.
  const idle = () => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(done, { timeout: 1500 }) : window.setTimeout(done, 300));
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle, { once: true });
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  start();
  return () => { listeners.delete(cb); };
}

export const useAfterLoad = () => useSyncExternalStore(subscribe, () => ready, () => false);
