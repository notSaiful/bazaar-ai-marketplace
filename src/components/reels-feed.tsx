"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { ChevronDown, ChevronUp, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useT } from "./lang";
import { HeartButton } from "./wishlist";
import { ProductArt } from "./ui";

export interface FeedItem {
  id: string;
  video: string;
  poster: string;
  caption: string;
  durationSec: number;
  product: { id: string; title: string; price: string; image: string };
  shop: { id: string; name: string; emoji: string; hue: number };
}

const noop = () => () => {};
const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => { const m = matchMedia(RM); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };

/**
 * Vertical, one-ad-per-screen feed (scroll snap). Only the ad on screen and the next one get a <video>
 * element; everything else is a poster image, so nothing else downloads. Videos mount after hydration so
 * the first poster is what the browser paints first (Lighthouse LCP).
 */
export function ReelsFeed({ items }: { items: FeedItem[] }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const vids = useRef<Map<number, HTMLVideoElement>>(new Map());
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const reduced = useSyncExternalStore(subscribeRM, () => matchMedia(RM).matches, () => false);
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  /** null = default (autoplay unless reduced motion); true/false = the user's choice for this ad. */
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const paused = userPaused ?? (reduced || blocked);

  // Which ad fills the screen.
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio >= 0.6) {
            const i = Number((e.target as HTMLElement).dataset.i);
            setActive((cur) => {
              if (cur !== i) { setUserPaused(null); setBlocked(false); setProgress(0); }
              return i;
            });
          }
        }
      },
      { root, threshold: [0.6] },
    );
    root.querySelectorAll<HTMLElement>("[data-i]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items.length]);

  // Play the active ad, pause the rest. Mute is applied as a property (the attribute does not update).
  useEffect(() => {
    vids.current.forEach((v, i) => {
      v.muted = muted;
      if (i === active && !paused) {
        v.play().catch(() => setBlocked(true));
      } else v.pause();
    });
  }, [active, paused, muted, hydrated]);

  const go = useCallback((i: number) => {
    const root = box.current;
    if (!root) return;
    const n = Math.max(0, Math.min(items.length - 1, i));
    root.scrollTo({ top: n * root.clientHeight, behavior: reduced ? "auto" : "smooth" });
  }, [items.length, reduced]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a, button:not([data-tap])")) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") { e.preventDefault(); go(active + 1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") { e.preventDefault(); go(active - 1); }
    else if (e.key === " ") { e.preventDefault(); setUserPaused(!paused); }
    else if (e.key === "m") setMuted((m) => !m);
  };

  return (
    <div className="relative md:flex md:justify-center">
      <div
        ref={box}
        tabIndex={0}
        onKeyDown={onKey}
        role="region"
        aria-roledescription="carousel"
        aria-label={t("samples.feed")}
        className="fixed inset-0 z-[35] snap-y snap-mandatory overflow-y-auto overscroll-y-contain bg-black text-white outline-none no-scrollbar md:static md:z-auto md:aspect-[9/16] md:h-[calc(100dvh-9rem)] md:max-h-[860px] md:rounded-2xl md:focus-visible:ring-4 md:focus-visible:ring-fg/20"
      >
        {items.map((it, i) => {
          const near = hydrated && (i === active || i === active + 1) && !missing[it.id];
          const isActive = i === active;
          return (
            <section
              key={it.id}
              data-i={i}
              aria-roledescription="slide"
              aria-label={t("samples.slide", { i: i + 1, n: items.length, shop: it.shop.name })}
              className="relative h-full w-full snap-start snap-always overflow-hidden"
            >
              {/* Poster: always rendered underneath; the first one is the LCP image. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.poster} alt="" width={540} height={960} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : undefined} decoding={i === 0 ? "sync" : "async"} className="absolute inset-0 h-full w-full object-cover" />
              {near && (
                <video
                  ref={(el) => { if (el) vids.current.set(i, el); else vids.current.delete(i); }}
                  src={it.video}
                  poster={it.poster}
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label={it.caption}
                  onTimeUpdate={isActive ? (e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || it.durationSec)) : undefined}
                  onError={() => setMissing((m) => ({ ...m, [it.id]: true }))}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {/* Tap anywhere on the video to pause / play. */}
              <button
                type="button"
                data-tap
                onClick={() => isActive && setUserPaused(!paused)}
                aria-label={paused ? t("samples.play") : t("samples.pause")}
                className="absolute inset-0 z-10 cursor-pointer"
              />
              {isActive && paused && (
                <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 backdrop-blur-sm" aria-hidden>
                  <Play className="ml-1 size-7 fill-white" />
                </span>
              )}
              {/* Progress */}
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 bg-white/25" aria-hidden>
                <div className="h-full bg-white transition-[width] duration-200 ease-linear" style={{ width: isActive ? `${Math.min(100, progress * 100)}%` : "0%" }} />
              </div>
              {missing[it.id] && <p className="absolute inset-x-4 top-16 z-20 rounded-lg bg-black/60 px-3 py-2 text-xs">{t("samples.unavailable")}</p>}

              {/* Overlay */}
              <div className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-t from-black/75 via-black/10 to-black/30" aria-hidden />
              <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] md:hidden">
                <span className="text-base font-semibold tracking-tight">{t("samples.title")}</span>
              </div>
              <div className="absolute inset-x-0 bottom-0 z-30 flex items-end gap-3 px-4 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-5">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center gap-2">
                    <Link href={`/store/${it.shop.id}`} className="flex min-w-0 items-center gap-2 text-sm font-semibold hover:underline">
                      <span className="grid size-8 shrink-0 place-items-center rounded-full border border-white/60 text-sm" style={{ background: `hsl(${it.shop.hue} 70% 90%)` }} aria-hidden>{it.shop.emoji}</span>
                      <span className="truncate">{it.shop.name}</span>
                    </Link>
                    <span className="rounded border border-white/50 px-1.5 text-[10px] font-medium uppercase tracking-wide text-white/85">{t("samples.ad")}</span>
                  </div>
                  <p className="line-clamp-3 text-sm leading-snug text-white/95 [text-shadow:0_1px_2px_rgb(0_0_0/0.5)]">{it.caption}</p>
                  <Link href={`/product/${it.product.id}`} className="flex items-center gap-3 rounded-xl bg-white/12 p-2 pr-3 backdrop-blur-md transition hover:bg-white/20">
                    <span className="size-11 shrink-0 overflow-hidden rounded-lg bg-white/10"><ProductArt src={it.product.image} alt="" sizes="44px" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{it.product.title}</span>
                      <span className="block text-sm tabular-nums text-white/80">{it.product.price}</span>
                    </span>
                    <span className="shrink-0 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black">{t("samples.viewProduct")}</span>
                  </Link>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-3 pb-1">
                  <HeartButton id={it.product.id} title={it.product.title} className="size-11" />
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    aria-pressed={!muted}
                    aria-label={muted ? t("samples.soundOn") : t("samples.soundOff")}
                    className="grid size-11 place-items-center rounded-full bg-white/15 backdrop-blur-md transition hover:bg-white/25"
                  >
                    {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                  </button>
                  {isActive && (
                    <button type="button" onClick={() => setUserPaused(!paused)} aria-label={paused ? t("samples.play") : t("samples.pause")} className="hidden size-11 place-items-center rounded-full bg-white/15 backdrop-blur-md transition hover:bg-white/25 md:grid">
                      {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
                    </button>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
      {/* Desktop: previous / next */}
      <div className="hidden flex-col justify-center gap-3 pl-4 md:flex">
        <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label={t("samples.prev")} className="grid size-11 place-items-center rounded-full border border-line bg-surface transition hover:bg-surface2 disabled:opacity-40"><ChevronUp className="size-5" /></button>
        <button type="button" onClick={() => go(active + 1)} disabled={active >= items.length - 1} aria-label={t("samples.next")} className="grid size-11 place-items-center rounded-full border border-line bg-surface transition hover:bg-surface2 disabled:opacity-40"><ChevronDown className="size-5" /></button>
      </div>
    </div>
  );
}
