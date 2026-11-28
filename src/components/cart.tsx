"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { Bookmark, Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { btn, ProductArt, EmptyState, Skeleton } from "./ui";
import { formatINR } from "@/lib/money";
import { artUrl, cn } from "@/lib/utils";
import type { CartLine } from "@/lib/types";
import { savedList } from "@/lib/shopping-lists";
import { useLang, useT } from "./lang";

const ETA_HI = new Intl.DateTimeFormat("hi-IN-u-nu-latn", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

interface Ctx {
  lines: CartLine[];
  count: number;
  /** Pass { open: false } to add without opening the cart drawer (e.g. from the Samples feed). */
  add: (id: string, qty?: number, opts?: { open?: boolean }) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  open: boolean;
  setOpen: (o: boolean) => void;
  toast: null;
}
const CartCtx = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(CartCtx);
  if (!c) throw new Error("CartProvider missing");
  return c;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try { setLines(JSON.parse(localStorage.getItem("bazaar_cart") || "[]")); } catch {}
    const onStorage = () => { try { setLines(JSON.parse(localStorage.getItem("bazaar_cart") || "[]")); } catch {} };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const save = useCallback((next: CartLine[]) => { setLines(next); localStorage.setItem("bazaar_cart", JSON.stringify(next)); }, []);
  const add = useCallback((id: string, qty = 1, opts?: { open?: boolean }) => {
    setLines((cur) => {
      const ex = cur.find((l) => l.productId === id);
      const next = ex ? cur.map((l) => (l.productId === id ? { ...l, qty: l.qty + qty } : l)) : [...cur, { productId: id, qty }];
      localStorage.setItem("bazaar_cart", JSON.stringify(next));
      return next;
    });
    if (opts?.open !== false) setOpen(true);
  }, []);
  const setQty = useCallback((id: string, qty: number) => save(lines.map((l) => (l.productId === id ? { ...l, qty: Math.max(1, qty) } : l))), [lines, save]);
  const remove = useCallback((id: string) => save(lines.filter((l) => l.productId !== id)), [lines, save]);
  const clear = useCallback(() => save([]), [save]);
  const value = useMemo(() => ({ lines, count: lines.reduce((a, l) => a + l.qty, 0), add, setQty, remove, clear, open, setOpen, toast: null }), [lines, add, setQty, remove, clear, open]);
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export interface PricedCartDTO {
  groups: { seller: { id: string; name: string; city: string }; eta: string; etaAt?: string; subtotal: number; lines: { product: { id: string; title: string; titleHi?: string; price: number; hue: number; emoji: string; image?: string; stock: number }; qty: number; lineTotal: number; issue?: string }[] }[];
  total: number;
  count: number;
  issues: string[];
}

export function usePricedCart() {
  return usePriced(useCart().lines);
}

/** Live prices and details for any list of lines, from the server's pricing endpoint (prices are never stored in the browser). */
function usePriced(lines: CartLine[]) {
  const [data, setData] = useState<PricedCartDTO | null>(null);
  const key = JSON.stringify(lines);
  useEffect(() => {
    if (!lines.length) { setData({ groups: [], total: 0, count: 0, issues: [] }); return; }
    const ctl = new AbortController();
    fetch("/api/cart/price", { method: "POST", body: JSON.stringify({ lines }), headers: { "content-type": "application/json" }, signal: ctl.signal })
      .then((r) => r.json()).then(setData).catch(() => {});
    return () => ctl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return data;
}

export function CartLines({ compact = false }: { compact?: boolean }) {
  const { setQty, remove, lines } = useCart();
  const data = usePricedCart();
  const t = useT();
  const lang = useLang();
  if (!data) return <div className="space-y-3"><Skeleton className="h-20" /><Skeleton className="h-20" /></div>;
  if (!lines.length || !data.groups.length) return (
    <div className="space-y-6">
      <EmptyState emoji="🛍️" title={t("checkout.cart.empty")} hint={t("checkout.cart.emptyHint")} action={<Link href="/search" className={btn("primary")}>{t("checkout.browse")}</Link>} />
      <SavedForLater compact={compact} />
    </div>
  );
  const title = titleIn(lang);
  const saveForLater = (id: string) => { savedList.add(id); remove(id); };
  return (
    <div className="space-y-5">
      {data.issues.map((i) => <p key={i} className="rounded-lg bg-warn/15 px-3 py-2 text-sm text-warn">{i}</p>)}
      {data.groups.map((g) => (
        <section key={g.seller.id} aria-label={t("checkout.cart.itemsFrom", { name: g.seller.name })} className="rounded-xl border border-line">
          <header className="flex items-center justify-between border-b border-line px-3 py-2 text-sm">
            <span className="font-semibold">{g.seller.name} <span className="font-normal text-muted">· {g.seller.city}</span></span>
            <span className="text-xs text-muted">{t("checkout.cart.arrives", { eta: lang === "hi" && g.etaAt ? ETA_HI.format(new Date(g.etaAt)) : g.eta })}</span>
          </header>
          <ul className="divide-y divide-line">
            {g.lines.map((l) => (
              <li key={l.product.id} className="flex gap-3 p-3">
                <div className={cn("shrink-0 overflow-hidden rounded-lg", compact ? "size-14" : "size-20")}><ProductArt src={artUrl(l.product)} alt="" sizes="64px" /></div>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${l.product.id}`} className="line-clamp-2 text-sm font-medium hover:underline">{title(l.product)}</Link>
                  <div className="mt-0.5 text-sm tabular-nums text-muted">{formatINR(l.product.price)}</div>
                  {l.issue && <div className="text-xs text-warn">{l.issue}</div>}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-line">
                      <button aria-label={t("checkout.cart.decrease")} className="grid size-8 place-items-center hover:bg-surface2 disabled:opacity-40" disabled={l.qty <= 1} onClick={() => setQty(l.product.id, l.qty - 1)}><Minus className="size-3.5" /></button>
                      <span className="w-8 text-center text-sm tabular-nums" aria-live="polite">{l.qty}</span>
                      <button aria-label={t("checkout.cart.increase")} className="grid size-8 place-items-center hover:bg-surface2 disabled:opacity-40" disabled={l.qty >= l.product.stock} onClick={() => setQty(l.product.id, l.qty + 1)}><Plus className="size-3.5" /></button>
                    </div>
                    <button aria-label={t("checkout.cart.remove", { title: title(l.product) })} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface2 hover:text-bad" onClick={() => remove(l.product.id)}><Trash2 className="size-4" /></button>
                    <button type="button" aria-label={t("browse.saved.saveLabel", { title: title(l.product) })} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-muted hover:bg-surface2 hover:text-fg" onClick={() => saveForLater(l.product.id)}>
                      <Bookmark className="size-3.5" aria-hidden />{t("browse.saved.save")}
                    </button>
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums">{formatINR(l.lineTotal)}</div>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <SavedForLater compact={compact} />
    </div>
  );
}

/** The pricing API returns titleHi when available; fall back to the English title. */
const titleIn = (lang: string) => (p: { title: string; titleHi?: string }) => (lang === "hi" && p.titleHi ? p.titleHi : p.title);

/**
 * Items moved out of the cart with "Save for later". Only ids live in the browser; titles, photos, prices
 * and stock come from the pricing endpoint each time, so nothing shown here can be stale.
 */
function SavedForLater({ compact }: { compact?: boolean }) {
  const ids = savedList.use();
  const { add } = useCart();
  const t = useT();
  const title = titleIn(useLang());
  const lines = useMemo(() => ids.map((productId) => ({ productId, qty: 1 })), [ids]);
  const data = usePriced(lines);
  if (!ids.length) return null;
  // Keep the saved order; products that are gone (removed or hidden) simply drop out of the list.
  const byId = new Map((data?.groups ?? []).flatMap((g) => g.lines.map((l) => [l.product.id, l.product] as const)));
  const items = ids.flatMap((id) => (byId.has(id) ? [byId.get(id)!] : []));
  const move = (id: string) => { add(id, 1, { open: false }); savedList.remove(id); };
  return (
    <section aria-labelledby="saved-title" className="space-y-2 border-t border-line pt-5">
      <h3 id="saved-title" className="text-sm font-semibold">{t("browse.saved.title", { n: ids.length })}</h3>
      {!data ? <Skeleton className="h-16" /> : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {items.map((p) => (
            <li key={p.id} className="flex items-center gap-3 p-3">
              <div className={cn("shrink-0 overflow-hidden rounded-lg", compact ? "size-12" : "size-16")}><ProductArt src={artUrl(p)} alt="" sizes="64px" /></div>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${p.id}`} className="line-clamp-1 text-sm font-medium hover:underline">{title(p)}</Link>
                <div className="text-sm tabular-nums text-muted">{formatINR(p.price)}{p.stock < 1 && <span className="text-bad"> · {t("out_of_stock")}</span>}</div>
              </div>
              <button type="button" disabled={p.stock < 1} aria-label={t("browse.saved.moveLabel", { title: title(p) })} onClick={() => move(p.id)} className={cn(btn("outline", "sm"), "shrink-0")}>{t("browse.saved.move")}</button>
              <button type="button" aria-label={t("browse.saved.removeLabel", { title: title(p) })} onClick={() => savedList.remove(p.id)} className="grid size-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface2 hover:text-bad"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function CartButton() {
  const { count, setOpen } = useCart();
  const t = useT();
  return (
    <button data-cart-target onClick={() => setOpen(true)} aria-label={t("checkout.cart.open", { n: count })} className="relative grid size-9 place-items-center rounded-lg border border-line bg-surface transition hover:bg-surface2">
      <ShoppingBag className="size-5" />
      {count > 0 && <span className="absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-fg">{count}</span>}
    </button>
  );
}

export function CartDrawer() {
  const { open, setOpen, lines } = useCart();
  const data = usePricedCart();
  const t = useT();
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [open, setOpen]);
  return (
    <>
            {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t("checkout.cart.dialog")}>
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="pop absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-bg shadow-2xl">
            <header className="flex items-center justify-between border-b border-line p-4">
              <h2 className="text-lg font-semibold">{t("nav.cart")}</h2>
              <button aria-label={t("checkout.cart.close")} onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg hover:bg-surface2"><X className="size-5" /></button>
            </header>
            <div className="flex-1 overflow-y-auto p-4"><CartLines compact /></div>
            {lines.length > 0 && data && data.groups.length > 0 && (
              <footer className="space-y-3 border-t border-line p-4">
                <div className="flex justify-between text-base font-semibold"><span>{t("checkout.total")}</span><span className="tabular-nums">{formatINR(data.total)}</span></div>
                <Link href="/checkout" onClick={() => setOpen(false)} className={cn(btn("primary", "lg"), "w-full")}>{t("checkout.checkout")}</Link>
              </footer>
            )}
          </aside>
        </div>
      )}
    </>
  );
}

/**
 * Fly-to-cart: a copy of the product photo arcs from `from` into the visible cart icon (header on
 * desktop, tab bar on phones), the icon gives a little bump, then `done` runs. Skipped (done runs at
 * once) when the user prefers reduced motion or there is no photo or visible cart icon.
 */
function flyToCart(from: Element | null, done: () => void) {
  const img = from?.querySelector("img");
  const target = [...document.querySelectorAll<HTMLElement>("[data-cart-target]")].find((el) => el.getBoundingClientRect().width > 0);
  const a = img?.getBoundingClientRect();
  if (!img || !a?.width || !target || typeof img.animate !== "function" || matchMedia("(prefers-reduced-motion: reduce)").matches) return done();
  const b = target.getBoundingClientRect();
  const size = Math.min(a.width, a.height, 140);
  const ghost = document.createElement("img");
  ghost.src = img.currentSrc || img.src;
  ghost.alt = "";
  ghost.setAttribute("aria-hidden", "true");
  Object.assign(ghost.style, { position: "fixed", left: `${a.left + a.width / 2 - size / 2}px`, top: `${a.top + a.height / 2 - size / 2}px`, width: `${size}px`, height: `${size}px`, objectFit: "cover", borderRadius: "16px", zIndex: "90", pointerEvents: "none", boxShadow: "0 12px 32px rgb(0 0 0 / .28)" });
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const lift = Math.min(120, Math.abs(dx) * 0.25 + 40); // rise a little first so the path reads as an arc
  const fly = ghost.animate(
    [
      { transform: "translate(0, 0) scale(1)", opacity: 1 },
      { transform: `translate(${dx * 0.35}px, ${Math.min(0, dy) * 0.35 - lift}px) scale(.55)`, opacity: 1, offset: 0.4 },
      { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0.4 },
    ],
    { duration: 620, easing: "cubic-bezier(.45,0,.55,1)" },
  );
  let finished = false;
  const end = () => {
    if (finished) return;
    finished = true;
    ghost.remove();
    target.animate([{ transform: "scale(1)" }, { transform: "scale(1.22)" }, { transform: "scale(1)" }], { duration: 320, easing: "ease-out" });
    done();
  };
  fly.onfinish = end;
  fly.oncancel = end;
  setTimeout(end, 900); // safety net if the animation never reports back (e.g. tab hidden)
}

export function AddToCart({ id, stock, className, label, compact }: { id: string; stock: number; className?: string; label?: string; compact?: boolean }) {
  const { add, setOpen } = useCart();
  const t = useT();
  // One tap adds the item, flies its photo into the cart icon, then opens the cart with a Checkout button.
  const onAdd = (e: MouseEvent<HTMLButtonElement>) => {
    add(id, 1, { open: false });
    flyToCart(e.currentTarget.closest("[data-fly-root], article, [role=dialog]"), () => setOpen(true));
  };
  return (
    <button disabled={stock < 1} onClick={onAdd} aria-label={compact ? t("checkout.cart.addToCart") : undefined} className={cn(btn(compact ? "outline" : "primary", compact ? "sm" : "md"), compact && "h-11 px-4 sm:h-8 sm:px-3", className)}>
      {compact ? (stock < 1 ? t("checkout.cart.soldOut") : t("checkout.cart.add")) : stock < 1 ? t("checkout.cart.outOfStock") : (label ?? t("checkout.cart.addToCart"))}
    </button>
  );
}
