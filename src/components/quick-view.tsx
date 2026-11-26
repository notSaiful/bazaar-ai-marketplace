"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Eye, Loader2, Star, X } from "lucide-react";
import { useLang, useT } from "./lang";
import { AddToCart } from "./cart";
import { ProductArt } from "./ui";

interface Detail { title: string; title_hi?: string; price_display: string; stock: number; seller?: string; description: string; attributes: Record<string, string> }

/**
 * "Quick view" on product cards (larger screens): a popup with the live price, stock, seller, short
 * description and Add to cart. Details are fetched on open from the read-only product endpoint, so the
 * grid's HTML stays small and prices are never stale.
 */
export function QuickViewButton({ id, image, title, rating }: { id: string; image: string; title: string; rating: number }) {
  const t = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const [d, setD] = useState<Detail | null>(null);
  const [err, setErr] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    closeBtn.current?.focus();
    const back = opener.current;
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; back?.focus(); };
  }, [open]);

  async function show() {
    setOpen(true);
    if (d) return;
    setErr(false);
    try {
      const r = await fetch("/api/agent/tools/get_product", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ product_id: id }) });
      if (!r.ok) throw new Error();
      setD((await r.json()) as Detail);
    } catch { setErr(true); }
  }

  const name = d ? (lang === "hi" && d.title_hi ? d.title_hi : d.title) : title;
  const stockText = !d ? "" : d.stock < 1 ? t("out_of_stock") : d.stock <= 5 ? t("low_stock", { n: d.stock }) : t("in_stock");
  return (
    <>
      <button
        ref={opener}
        type="button"
        onClick={show}
        aria-label={t("browse.quick.label", { title })}
        className="absolute bottom-3 left-3 hidden h-8 items-center gap-1.5 rounded-full bg-surface/90 px-3 text-xs font-medium opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100 focus-visible:opacity-100 md:inline-flex"
      >
        <Eye className="size-3.5" aria-hidden /> {t("browse.quick.open")}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby={`qv-${id}`}>
          <button type="button" tabIndex={-1} aria-label={t("action.close")} className="fade-in absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <div className="pop relative grid max-h-[90dvh] w-full max-w-3xl overflow-auto rounded-2xl border border-line bg-bg shadow-2xl md:grid-cols-2">
            <div className="bg-surface2"><ProductArt src={image} alt={name} sizes="(min-width: 768px) 384px, 100vw" /></div>
            <div className="flex flex-col gap-4 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {d?.seller && <p className="text-sm text-muted">{d.seller}</p>}
                  <h2 id={`qv-${id}`} className="text-xl font-semibold tracking-tight">{name}</h2>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted"><Star className="size-3.5 fill-fg text-fg" aria-hidden /> {rating.toFixed(1)}</p>
                </div>
                <button ref={closeBtn} type="button" onClick={() => setOpen(false)} aria-label={t("action.close")} className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface2 hover:text-fg"><X className="size-5" /></button>
              </div>
              {err ? (
                <p role="alert" className="text-sm text-bad">{t("browse.quick.error")}</p>
              ) : !d ? (
                <p className="flex items-center gap-2 text-sm text-muted" role="status"><Loader2 className="size-4 animate-spin" aria-hidden /> {t("action.loading")}</p>
              ) : (
                <>
                  <div className="flex items-baseline gap-3"><span className="text-2xl font-semibold tabular-nums">{d.price_display}</span><span className={d.stock < 1 ? "text-sm text-bad" : d.stock <= 5 ? "text-sm text-warn" : "text-sm text-ok"}>{stockText}</span></div>
                  <p className="line-clamp-4 text-sm leading-relaxed text-muted">{d.description}</p>
                  {Object.keys(d.attributes).length > 0 && (
                    <dl className="grid grid-cols-2 gap-2 text-sm">{Object.entries(d.attributes).slice(0, 4).map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd>{v}</dd></div>)}</dl>
                  )}
                  <div className="mt-auto flex flex-col gap-2 pt-2">
                    <AddToCart id={id} stock={d.stock} className="h-11 w-full" />
                    <Link href={`/product/${id}`} onClick={() => setOpen(false)} className="text-center text-sm font-medium underline-offset-4 hover:underline">{t("browse.quick.details")}</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
