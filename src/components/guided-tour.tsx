"use client";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "./lang";

const STEPS = ["lang", "voice", "assistant", "samples"] as const;
type Step = (typeof STEPS)[number];
const DONE_KEY = "bz_tour_done";
const PAD = 6;

/** First visible element marked data-tour="<step>" (the header and the tab bar both have a Samples link). */
function target(step: Step): HTMLElement | null {
  for (const el of document.querySelectorAll<HTMLElement>(`[data-tour="${step}"]`)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden") return el;
  }
  return null;
}

/**
 * First-visit tour for shoppers: spotlights the Hindi toggle, voice search, the AI assistant and Samples.
 * Starts once on the home page after it has loaded (never during automated runs unless ?tour=1), can be
 * replayed from the footer ("start-tour" event), and is fully keyboard operable.
 */
export function GuidedTour() {
  const t = useT();
  const path = usePathname();
  const [steps, setSteps] = useState<Step[]>([]);
  const [i, setI] = useState(-1);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const primary = useRef<HTMLButtonElement>(null);

  const place = useCallback((list: Step[], idx: number) => {
    const el = target(list[idx]);
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.top < 0 || r.bottom > window.innerHeight) {
      el.scrollIntoView({ block: "center" });
      requestAnimationFrame(() => setRect(el.getBoundingClientRect()));
    } else setRect(r);
  }, []);

  const start = useCallback(() => {
    const list = STEPS.filter((s) => target(s));
    if (!list.length) return;
    setSteps(list);
    setI(0);
    place(list, 0);
  }, [place]);

  const finish = useCallback(() => {
    setI(-1);
    setRect(null);
    try { localStorage.setItem(DONE_KEY, "1"); } catch {}
  }, []);

  const go = useCallback((n: number) => {
    if (n >= steps.length) return finish();
    if (n < 0) return;
    setI(n);
    place(steps, n);
  }, [steps, place, finish]);

  // Auto-start once on the home page; ?tour=1 forces it; the footer link fires "start-tour".
  useEffect(() => {
    // The footer button sets this flag too, in case it is clicked before this (deferred) component loads.
    const w = window as Window & { __bzTourRequested?: boolean };
    const onStart = () => { w.__bzTourRequested = false; start(); };
    window.addEventListener("start-tour", onStart);
    const requested = !!w.__bzTourRequested;
    w.__bzTourRequested = false;
    const forced = requested || new URLSearchParams(window.location.search).get("tour") === "1";
    let seen = false;
    try { seen = localStorage.getItem(DONE_KEY) === "1"; } catch {}
    const auto = !forced && path === "/" && !seen && !navigator.webdriver;
    let timer: number | undefined;
    if (forced || auto) {
      const kick = () => { timer = window.setTimeout(start, forced ? 300 : 2500); };
      if (document.readyState === "complete") kick();
      else window.addEventListener("load", kick, { once: true });
    }
    return () => { window.removeEventListener("start-tour", onStart); if (timer) clearTimeout(timer); };
  }, [path, start]);

  // Follow the target on resize/scroll; keyboard: Esc skips, Enter / arrows move.
  useEffect(() => {
    if (i < 0) return;
    const update = () => place(steps, i);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight") go(i + 1);
      else if (e.key === "ArrowLeft") go(i - 1);
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, { passive: true });
    document.addEventListener("keydown", key);
    primary.current?.focus();
    return () => { window.removeEventListener("resize", update); window.removeEventListener("scroll", update); document.removeEventListener("keydown", key); };
  }, [i, steps, place, go, finish]);

  if (i < 0 || !rect) return null;
  const step = steps[i];
  const vw = window.innerWidth, vh = window.innerHeight;
  const w = Math.min(320, vw - 32);
  const below = rect.bottom + 180 < vh;
  const left = Math.max(16, Math.min(rect.left + rect.width / 2 - w / 2, vw - w - 16));
  const last = i === steps.length - 1;
  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body">
      {/* Click-catcher + spotlight around the target */}
      <div className="absolute inset-0" onClick={finish} aria-hidden />
      <div
        className="pointer-events-none absolute rounded-xl ring-2 ring-white transition-all duration-300 ease-out motion-reduce:transition-none"
        style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.55)" }}
        aria-hidden
      />
      <div
        className={cn("pop absolute rounded-xl border border-line bg-surface p-4 text-fg shadow-2xl")}
        style={{ width: w, left, ...(below ? { top: rect.bottom + PAD + 10 } : { bottom: vh - rect.top + PAD + 10 }) }}
      >
        <div className="mb-1 flex items-center justify-between">
          <span className="text-xs font-medium text-muted">{t("tour.label")} · {t("tour.step", { i: i + 1, n: steps.length })}</span>
          <button type="button" onClick={finish} aria-label={t("tour.skip")} className="-mr-1 grid size-7 place-items-center rounded-md text-muted hover:bg-surface2 hover:text-fg"><X className="size-4" /></button>
        </div>
        <h2 id="tour-title" className="text-base font-semibold">{t(`tour.${step}.title`)}</h2>
        <p id="tour-body" className="mt-1 text-sm text-muted">{t(`tour.${step}.body`)}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1" aria-hidden>{steps.map((s, k) => <span key={s} className={cn("h-1.5 rounded-full transition-all", k === i ? "w-4 bg-fg" : "w-1.5 bg-line")} />)}</div>
          <div className="flex gap-2">
            {i > 0 && <button type="button" onClick={() => go(i - 1)} className="h-9 rounded-lg px-3 text-sm font-medium hover:bg-surface2">{t("tour.back")}</button>}
            <button ref={primary} type="button" onClick={() => go(i + 1)} className="h-9 rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg">{last ? t("tour.done") : t("tour.next")}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

