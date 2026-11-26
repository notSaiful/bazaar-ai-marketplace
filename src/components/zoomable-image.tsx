"use client";
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { X, ZoomIn } from "lucide-react";
import { useT } from "./lang";

const MIN = 1, MAX = 4;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/**
 * Invisible button over the product photo that opens a full-screen viewer: pinch or wheel to zoom,
 * double-tap / double-click to toggle 2.5x at that point, drag to pan when zoomed, Esc to close.
 * The page's own photo (the LCP image) is untouched; the viewer loads the largest variant on demand.
 */
export function ZoomableImage({ src, title }: { src: string; title: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const [gesturing, setGesturing] = useState(false);
  const pts = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; s: number } | null>(null);
  const drag = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const lastTap = useRef(0);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const big = src.replace(/-(160|400)\.webp$/, "-800.webp").replace(/\.jpg$/, "-800.webp");

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const back = opener.current;
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; back?.focus(); };
  }, [open]);

  const zoomAt = (cx: number, cy: number, s: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2);
    setView((v) => {
      const ns = clamp(s, MIN, MAX);
      if (ns === 1) return { s: 1, x: 0, y: 0 };
      const k = ns / v.s;
      return { s: ns, x: ox - (ox - v.x) * k, y: oy - (oy - v.y) * k };
    });
  };

  const down = (e: RPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setGesturing(true);
    if (pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), s: view.s };
      drag.current = null;
    } else {
      const now = Date.now();
      if (now - lastTap.current < 300) { zoomAt(e.clientX, e.clientY, view.s > 1 ? 1 : 2.5, e.currentTarget); lastTap.current = 0; return; }
      lastTap.current = now;
      drag.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
    }
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    if (!pts.current.has(e.pointerId)) return;
    pts.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pts.current.size === 2) {
      const [a, b] = [...pts.current.values()];
      zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, pinch.current.s * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.current.d), e.currentTarget);
    } else if (drag.current && view.s > 1) {
      const d = drag.current;
      setView((v) => ({ ...v, x: d.vx + e.clientX - d.x, y: d.vy + e.clientY - d.y }));
    }
  };
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    pts.current.delete(e.pointerId);
    if (pts.current.size < 2) pinch.current = null;
    if (!pts.current.size) { drag.current = null; setGesturing(false); }
  };

  return (
    <>
      <button
        ref={opener}
        type="button"
        onClick={() => { setView({ s: 1, x: 0, y: 0 }); setOpen(true); }}
        aria-label={t("browse.zoom.open")}
        className="group absolute inset-0 z-10 cursor-zoom-in rounded-xl focus-visible:ring-4 focus-visible:ring-fg/20"
      >
        <span className="absolute bottom-3 left-3 grid size-9 place-items-center rounded-full bg-surface/90 opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden><ZoomIn className="size-4" /></span>
      </button>
      {open && (
        <div className="fixed inset-0 z-[90] bg-black/95" role="dialog" aria-modal="true" aria-label={t("browse.zoom.label", { title })}>
          <div
            className="absolute inset-0 touch-none select-none overflow-hidden"
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={up}
            onWheel={(e) => zoomAt(e.clientX, e.clientY, view.s * (e.deltaY < 0 ? 1.15 : 1 / 1.15), e.currentTarget)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={big}
              alt={title}
              draggable={false}
              className="absolute left-1/2 top-1/2 max-h-full max-w-full object-contain"
              style={{ transform: `translate(calc(-50% + ${view.x}px), calc(-50% + ${view.y}px)) scale(${view.s})`, transition: gesturing ? "none" : "transform 160ms ease-out" }}
            />
          </div>
          <p className="pointer-events-none absolute inset-x-0 bottom-[max(1.5rem,env(safe-area-inset-bottom))] text-center text-xs text-white/70">{t("browse.zoom.hint")}</p>
          <button ref={closeBtn} type="button" onClick={() => setOpen(false)} aria-label={t("action.close")} className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"><X className="size-5" /></button>
        </div>
      )}
    </>
  );
}
