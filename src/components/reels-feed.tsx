"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type MouseEvent } from "react";
import { Check, ChevronDown, ChevronUp, Heart, Pause, Play, ShoppingBag, Star, Store, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "./lang";
import { HeartButton, useWishlist } from "./wishlist";
import { AddToCart, useCart } from "./cart";
import { ShareButton } from "./share-button";
import { btn, ProductArt } from "./ui";

export interface FeedItem {
  id: string;
  video: string;
  poster: string;
  caption: string;
  durationSec: number;
  product: { id: string; title: string; price: string; image: string; stock: number; lowStock: number; category: string; description: string; rating: number; ratingCount: number };
  shop: { id: string; name: string; emoji: string; hue: number; city: string };
}
export interface FeedCategory { slug: string; name: string }

const noop = () => () => {};
const RM = "(prefers-reduced-motion: reduce)";
const subscribeRM = (cb: () => void) => { const m = matchMedia(RM); m.addEventListener("change", cb); return () => m.removeEventListener("change", cb); };
const DOUBLE_TAP_MS = 280;
// Light round buttons on top of the video: a 44px touch target that covers as little of the picture as possible.
const fab = "grid size-11 place-items-center rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/45 active:scale-95";

/**
 * Vertical, one-ad-per-screen feed (scroll snap). Only the ad on screen and the next one get a <video>
 * element; everything else is a poster image, so nothing else downloads. Videos mount after hydration so
 * the first poster is what the browser paints first (Lighthouse LCP).
 * Category chips filter the feed; tap pauses, double-tap saves to the wishlist; on desktop a side panel
 * shows the product in the current ad.
 */
export function ReelsFeed({ items, categories }: { items: FeedItem[]; categories: FeedCategory[] }) {
  const t = useT();
  const box = useRef<HTMLDivElement>(null);
  const vids = useRef<Map<number, HTMLVideoElement>>(new Map());
  const hydrated = useSyncExternalStore(noop, () => true, () => false);
  const reduced = useSyncExternalStore(subscribeRM, () => matchMedia(RM).matches, () => false);
  const [cat, setCat] = useState("");
  const [active, setActive] = useState(0);
  const [muted, setMuted] = useState(true);
  /** null = default (autoplay unless reduced motion); true/false = the user's choice for this ad. */
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [progress, setProgress] = useState(0);
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [burst, setBurst] = useState<{ key: number; id: string; x: number; y: number } | null>(null);
  const [toast, setToast] = useState<{ kind: "cart" | "wish"; key: number } | null>(null);
  const { add, setOpen: openCart } = useCart();
  const wish = useWishlist();
  const paused = userPaused ?? (reduced || blocked);
  const shown = cat ? items.filter((it) => it.product.category === cat) : items;
  const current = shown[Math.min(active, shown.length - 1)];

  const seq = useRef(0);
  const flash = (kind: "cart" | "wish") => {
    const key = ++seq.current;
    setToast({ kind, key });
    window.setTimeout(() => setToast((cur) => (cur?.key === key ? null : cur)), 2600);
  };
  // Add without opening the cart drawer, so the video keeps playing; a short toast confirms it.
  const addToCart = (id: string) => { add(id, 1, { open: false }); flash("cart"); };

  const pick = (slug: string) => {
    setCat(slug);
    setActive(0);
    setUserPaused(null);
    setBlocked(false);
    setProgress(0);
    setExpanded(null);
    box.current?.scrollTo({ top: 0 });
  };

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
              if (cur !== i) { setUserPaused(null); setBlocked(false); setProgress(0); setExpanded(null); }
              return i;
            });
          }
        }
      },
      { root, threshold: [0.6] },
    );
    root.querySelectorAll<HTMLElement>("[data-i]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [shown.length, cat]);

  // Play the active ad, pause the rest. Mute is applied as a property (the attribute does not update).
  // Only NotAllowedError means "autoplay blocked"; AbortError just means a play() was superseded (the
  // user scrolled on, or the video unmounted) and must not pause the ad that is now on screen.
  useEffect(() => {
    vids.current.forEach((v, i) => {
      v.muted = muted;
      if (i === active && !paused) {
        v.play().catch((e: unknown) => { if ((e as Error)?.name === "NotAllowedError") setBlocked(true); });
      } else v.pause();
    });
  }, [active, paused, muted, hydrated, cat]);

  // Tap = play/pause, double-tap = save to wishlist with a heart burst. The single tap waits briefly so a
  // double-tap never also pauses. Keyboard activation (detail 0) toggles at once.
  const pausedRef = useRef(paused);
  useEffect(() => { pausedRef.current = paused; });
  const lastTap = useRef(0);
  const tapTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(tapTimer.current), []);
  const onTap = (e: MouseEvent<HTMLButtonElement>, i: number, it: FeedItem) => {
    if (i !== active) return;
    if (e.detail === 0) { setUserPaused(!paused); return; }
    const now = e.timeStamp;
    if (e.detail >= 2 || now - lastTap.current < DOUBLE_TAP_MS) {
      window.clearTimeout(tapTimer.current);
      lastTap.current = 0;
      const r = e.currentTarget.getBoundingClientRect();
      const key = ++seq.current;
      setBurst({ key, id: it.id, x: e.clientX - r.left, y: e.clientY - r.top });
      window.setTimeout(() => setBurst((cur) => (cur?.key === key ? null : cur)), 900);
      if (!wish.has(it.product.id)) { wish.toggle(it.product.id); flash("wish"); }
      return;
    }
    lastTap.current = now;
    window.clearTimeout(tapTimer.current);
    tapTimer.current = window.setTimeout(() => { lastTap.current = 0; setUserPaused(!pausedRef.current); }, DOUBLE_TAP_MS);
  };

  const go = useCallback((i: number) => {
    const root = box.current;
    if (!root) return;
    const n = Math.max(0, Math.min(shown.length - 1, i));
    root.scrollTo({ top: n * root.clientHeight, behavior: reduced ? "auto" : "smooth" });
  }, [shown.length, reduced]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a, button:not([data-tap])")) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "j") { e.preventDefault(); go(active + 1); }
    else if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "k") { e.preventDefault(); go(active - 1); }
    else if (e.key === " ") { e.preventDefault(); setUserPaused(!paused); }
    else if (e.key === "m") setMuted((m) => !m);
  };

  const chips = [{ slug: "", name: t("shop.all") }, ...categories];
  return (
    <div className="relative md:mx-auto md:max-w-[1080px]">
      {/* Phone: title + chips float over the video. Desktop: a row above the player. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[36] bg-gradient-to-b from-black/55 to-transparent px-4 pb-6 pt-[max(0.75rem,env(safe-area-inset-top))] text-white md:pointer-events-auto md:static md:z-auto md:mb-4 md:bg-none md:p-0 md:text-fg">
        <p className="text-base font-semibold tracking-tight md:hidden">{t("samples.title")}</p>
        {categories.length > 1 && (
          <div role="group" aria-label={t("samples.filter")} className="no-scrollbar pointer-events-auto -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 md:mx-0 md:mt-0 md:justify-center md:px-0">
            {chips.map((c) => {
              const on = c.slug === cat;
              return (
                <button
                  key={c.slug || "all"}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(c.slug)}
                  className={cn(
                    "h-8 shrink-0 rounded-full px-3.5 text-sm font-medium backdrop-blur-md transition",
                    on ? "bg-white text-black md:bg-accent md:text-accent-fg" : "bg-white/15 text-white hover:bg-white/25 md:border md:border-line md:bg-surface md:text-fg md:backdrop-blur-none md:hover:bg-surface2",
                  )}
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="md:flex md:items-stretch md:justify-center md:gap-4">
        <div
          ref={box}
          tabIndex={0}
          onKeyDown={onKey}
          role="region"
          aria-roledescription="carousel"
          aria-label={t("samples.feed")}
          className="fixed inset-0 z-[35] snap-y snap-mandatory overflow-y-auto overscroll-y-contain bg-black text-white outline-none no-scrollbar md:static md:z-auto md:aspect-[9/16] md:h-[calc(100dvh-12rem)] md:max-h-[820px] md:shrink-0 md:rounded-2xl md:focus-visible:ring-4 md:focus-visible:ring-fg/20"
        >
          {shown.map((it, i) => {
            const near = hydrated && (i === active || i === active + 1) && !missing[it.id];
            const isActive = i === active;
            const open = expanded === it.id;
            return (
              <section
                key={it.id}
                data-i={i}
                aria-roledescription="slide"
                aria-label={t("samples.slide", { i: i + 1, n: shown.length, shop: it.shop.name })}
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
                {/* Tap anywhere on the video to pause / play; double-tap to save. */}
                <button
                  type="button"
                  data-tap
                  onClick={(e) => onTap(e, i, it)}
                  aria-label={paused ? t("samples.play") : t("samples.pause")}
                  className="absolute inset-0 z-10 cursor-pointer touch-manipulation"
                />
                {burst?.id === it.id && (
                  <Heart key={burst.key} aria-hidden className="heart-burst pointer-events-none absolute z-20 size-24 fill-white text-white drop-shadow-[0_4px_16px_rgb(0_0_0/0.45)]" style={{ left: burst.x - 48, top: burst.y - 48 }} />
                )}
                {isActive && paused && (
                  <span className="pointer-events-none absolute left-1/2 top-1/2 z-20 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/45 backdrop-blur-sm" aria-hidden>
                    <Play className="ml-1 size-7 fill-white" />
                  </span>
                )}
                {/* Progress */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 bg-white/25" aria-hidden>
                  <div className="h-full bg-white transition-[width] duration-200 ease-linear" style={{ width: isActive ? `${Math.min(100, progress * 100)}%` : "0%" }} />
                </div>
                {missing[it.id] && <p className="absolute inset-x-4 top-24 z-20 rounded-lg bg-black/60 px-3 py-2 text-xs">{t("samples.unavailable")}</p>}

                {/* Overlay */}
                <div className={cn("pointer-events-none absolute inset-0 z-20 bg-gradient-to-t via-transparent to-transparent", open ? "from-black/90 via-black/40" : "from-black/70")} aria-hidden />
                <div className="absolute inset-x-0 bottom-0 z-30 flex items-end gap-3 px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-5">
                  <div className="min-w-0 flex-1 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <Link href={`/store/${it.shop.id}`} className="flex min-w-0 items-center gap-2 text-sm font-semibold [text-shadow:0_1px_2px_rgb(0_0_0/0.5)] hover:underline">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/60 text-xs" style={{ background: `hsl(${it.shop.hue} 70% 90%)` }} aria-hidden>{it.shop.emoji}</span>
                        <span className="truncate">{it.shop.name}</span>
                      </Link>
                      <span className="rounded border border-white/50 px-1.5 text-[10px] font-medium uppercase tracking-wide text-white/85">{t("samples.ad")}</span>
                    </div>
                    <div>
                      <p id={`cap-${it.id}`} className={cn("text-sm leading-snug text-white/95 [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]", !open && "line-clamp-2")}>{it.caption}</p>
                      {it.caption.length > 80 && (
                        <button type="button" aria-expanded={open} aria-controls={`cap-${it.id}`} onClick={() => setExpanded(open ? null : it.id)} className="mt-0.5 text-xs font-semibold text-white/80 hover:text-white">
                          {open ? t("samples.less") : t("samples.more")}
                        </button>
                      )}
                    </div>
                    {/* Phone: slim product bar (desktop shows the side panel instead). */}
                    <Link href={`/product/${it.product.id}`} className="flex items-center gap-2.5 rounded-xl bg-black/35 p-1.5 pr-2 ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black/45 md:hidden">
                      <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-white/10"><ProductArt src={it.product.image} alt="" sizes="40px" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-[13px] font-medium leading-tight">{it.product.title}</span>
                        <span className="block text-xs tabular-nums text-white/80">{it.product.price}</span>
                      </span>
                      <span className="shrink-0 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-black">{t("samples.viewProduct")}</span>
                    </Link>
                  </div>
                  <div className="flex shrink-0 flex-col items-center gap-2.5 pb-0.5">
                    <HeartButton id={it.product.id} title={it.product.title} overlay className={cn(fab, "shadow-none")} />
                    <button
                      type="button"
                      onClick={() => addToCart(it.product.id)}
                      disabled={it.product.stock < 1}
                      aria-label={it.product.stock < 1 ? t("samples.soldOut") : `${t("samples.addToCart")}: ${it.product.title}`}
                      className={cn(fab, "disabled:opacity-40")}
                    >
                      {toast?.kind === "cart" && isActive ? <Check className="size-5" /> : <ShoppingBag className="size-5" />}
                    </button>
                    <ShareButton path={`/product/${it.product.id}`} title={it.product.title} variant="overlay" />
                    <button
                      type="button"
                      onClick={() => setMuted((m) => !m)}
                      aria-pressed={!muted}
                      aria-label={muted ? t("samples.soundOn") : t("samples.soundOff")}
                      className={fab}
                    >
                      {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
                    </button>
                    {isActive && (
                      <button type="button" onClick={() => setUserPaused(!paused)} aria-label={paused ? t("samples.play") : t("samples.pause")} className={cn(fab, "hidden md:grid")}>
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
        <div className="hidden flex-col justify-center gap-3 md:flex">
          <button type="button" onClick={() => go(active - 1)} disabled={active === 0} aria-label={t("samples.prev")} className="grid size-11 place-items-center rounded-full border border-line bg-surface transition hover:bg-surface2 disabled:opacity-40"><ChevronUp className="size-5" /></button>
          <button type="button" onClick={() => go(active + 1)} disabled={active >= shown.length - 1} aria-label={t("samples.next")} className="grid size-11 place-items-center rounded-full border border-line bg-surface transition hover:bg-surface2 disabled:opacity-40"><ChevronDown className="size-5" /></button>
        </div>

        {current && <AdPanel key={current.id} it={current} />}
      </div>

      {toast && (
        <div role="status" className="pop fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[45] mx-auto flex max-w-sm items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm text-black shadow-xl md:bottom-6">
          <span className="flex items-center gap-2 font-medium">
            {toast.kind === "cart" ? <Check className="size-4" aria-hidden /> : <Heart className="size-4 fill-bad text-bad" aria-hidden />}
            {toast.kind === "cart" ? t("samples.added") : t("samples.liked")}
          </span>
          {toast.kind === "cart"
            ? <button type="button" onClick={() => openCart(true)} className="font-semibold underline underline-offset-4">{t("samples.viewCart")}</button>
            : <Link href="/wishlist" className="font-semibold underline underline-offset-4">{t("samples.viewWishlist")}</Link>}
        </div>
      )}
    </div>
  );
}

/** Desktop only: the product in the ad on screen, with live price, stock and Add to cart. */
function AdPanel({ it }: { it: FeedItem }) {
  const t = useT();
  const p = it.product;
  const [stockText, stockTone] = p.stock < 1 ? [t("out_of_stock"), "text-bad"] : p.stock <= p.lowStock ? [t("low_stock", { n: p.stock }), "text-warn"] : [t("in_stock"), "text-ok"];
  return (
    <aside aria-label={t("samples.panel")} data-fly-root className="fade-in hidden w-80 shrink-0 flex-col gap-4 overflow-y-auto rounded-2xl border border-line bg-surface p-5 md:flex md:h-[calc(100dvh-12rem)] md:max-h-[820px]">
      <Link href={`/store/${it.shop.id}`} className="flex items-center gap-2 text-sm hover:underline">
        <span className="grid size-8 shrink-0 place-items-center rounded-full text-sm" style={{ background: `hsl(${it.shop.hue} 70% 90%)` }} aria-hidden>{it.shop.emoji}</span>
        <span className="min-w-0"><span className="block truncate font-semibold">{it.shop.name}</span><span className="block text-xs text-muted">{it.shop.city}</span></span>
      </Link>
      <Link href={`/product/${p.id}`} className="block overflow-hidden rounded-xl bg-surface2"><ProductArt src={p.image} alt={p.title} sizes="280px" /></Link>
      <div>
        <Link href={`/product/${p.id}`} className="text-lg font-semibold leading-snug tracking-tight hover:underline">{p.title}</Link>
        {p.ratingCount > 0 && <p className="mt-1 flex items-center gap-1 text-sm text-muted"><Star className="size-3.5 fill-fg text-fg" aria-hidden /> <span className="font-medium text-fg">{p.rating.toFixed(1)}</span> · {t("samples.ratings", { n: p.ratingCount })}</p>}
      </div>
      <div className="flex items-baseline gap-3"><span className="text-2xl font-semibold tabular-nums">{p.price}</span><span className={cn("text-sm", stockTone)}>{stockText}</span></div>
      <p className="line-clamp-4 text-sm leading-relaxed text-muted">{p.description}</p>
      <div className="mt-auto space-y-2 pt-1">
        <AddToCart id={p.id} stock={p.stock} className="h-11 w-full" />
        <Link href={`/product/${p.id}`} className={cn(btn("outline", "md"), "h-10 w-full")}>{t("samples.viewProduct")}</Link>
        <Link href={`/store/${it.shop.id}`} className="flex items-center justify-center gap-1.5 pt-1 text-sm text-muted transition hover:text-fg"><Store className="size-4" aria-hidden />{t("samples.moreFromShop", { shop: it.shop.name })}</Link>
      </div>
    </aside>
  );
}
