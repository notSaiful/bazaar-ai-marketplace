"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { btn, ProductArt, EmptyState, Skeleton } from "./ui";
import { formatINR } from "@/lib/money";
import { artUrl, cn } from "@/lib/utils";
import type { CartLine } from "@/lib/types";
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
  const { lines } = useCart();
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
  if (!lines.length || !data.groups.length) return <EmptyState emoji="🛍️" title={t("checkout.cart.empty")} hint={t("checkout.cart.emptyHint")} action={<Link href="/search" className={btn("primary")}>{t("checkout.browse")}</Link>} />;
  // The pricing API returns titleHi when available; fall back to the English title.
  const title = (p: { title: string; titleHi?: string }) => (lang === "hi" && p.titleHi ? p.titleHi : p.title);
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
                  </div>
                </div>
                <div className="text-sm font-semibold tabular-nums">{formatINR(l.lineTotal)}</div>
              </li>
            ))}
          </ul>
          
        </section>
      ))}
    </div>
  );
}

export function CartButton() {
  const { count, setOpen } = useCart();
  const t = useT();
  return (
    <button onClick={() => setOpen(true)} aria-label={t("checkout.cart.open", { n: count })} className="relative grid size-9 place-items-center rounded-lg border border-line bg-surface transition hover:bg-surface2">
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

export function AddToCart({ id, stock, className, label, compact }: { id: string; stock: number; className?: string; label?: string; compact?: boolean }) {
  const { add } = useCart();
  const t = useT();
  // One tap adds the item and opens the cart with a Checkout button.
  return (
    <button disabled={stock < 1} onClick={() => add(id)} aria-label={compact ? t("checkout.cart.addToCart") : undefined} className={cn(btn(compact ? "outline" : "primary", compact ? "sm" : "md"), compact && "h-11 px-4 sm:h-8 sm:px-3", className)}>
      {compact ? (stock < 1 ? t("checkout.cart.soldOut") : t("checkout.cart.add")) : stock < 1 ? t("checkout.cart.outOfStock") : (label ?? t("checkout.cart.addToCart"))}
    </button>
  );
}
