"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { btn, inputCls } from "./ui";
import { useT } from "./lang";

interface Props {
  q: string;
  category: string;
  sort: string;
  seller: string;
  min: string;
  max: string;
  sellers: { id: string; name: string }[];
}

const SORTS = [
  ["", "shop.sort.relevance"],
  ["price_asc", "shop.sort.priceAsc"],
  ["price_desc", "shop.sort.priceDesc"],
  ["rating", "shop.sort.rating"],
] as const;

/** PRD 11.1 filter drawer: bottom sheet on phones, side panel on larger screens. State lives in the URL. */
export function FilterDrawer({ q, category, sort, seller, min, max, sellers }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const t = useT();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const active = [sort, seller, min || max].filter(Boolean).length;

  useEffect(() => {
    if (!open) return;
    const prev = (document.activeElement as HTMLElement | null) ?? opener.current;
    panel.current?.querySelector<HTMLElement>("input, select, button")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      prev?.focus();
    };
  }, [open]);

  function apply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    for (const [k, v] of new FormData(e.currentTarget)) if (typeof v === "string" && v.trim()) p.set(k, v.trim());
    setOpen(false);
    router.push(`/search${p.size ? `?${p}` : ""}`);
  }

  function reset() {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category", category);
    setOpen(false);
    router.push(`/search${p.size ? `?${p}` : ""}`);
  }

  return (
    <>
      <button ref={opener} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className={cn(btn("outline"), "gap-2")}>
        <SlidersHorizontal className="size-4" /> {t("shop.filter.button")}
        {active > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-fg">{active}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-labelledby="filters-title">
          <button aria-label={t("shop.filter.close")} tabIndex={-1} className="fade-in absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            ref={panel}
            className="sheet-up absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col rounded-t-2xl border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] sm:slide-in-right sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-96 sm:rounded-none sm:border-l sm:border-t-0"
          >
            <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line sm:hidden" aria-hidden />
            <div className="flex items-center justify-between px-5 py-4">
              <h2 id="filters-title" className="text-base font-semibold">{t("shop.filter.title")}</h2>
              <button onClick={() => setOpen(false)} aria-label={t("shop.filter.close")} className="grid size-8 place-items-center rounded-lg text-muted hover:bg-surface2 hover:text-fg"><X className="size-4" /></button>
            </div>
            <form onSubmit={apply} className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-6 overflow-y-auto px-5 pb-4">
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">{t("shop.filter.sortBy")}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {SORTS.map(([v, label]) => (
                      <label key={v || "best"} className="cursor-pointer">
                        <input type="radio" name="sort" value={v} defaultChecked={sort === v} className="peer sr-only" />
                        <span className="flex h-10 items-center justify-center rounded-lg border border-line px-2 text-center text-sm transition peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-fg peer-focus-visible:ring-2 peer-focus-visible:ring-fg/30">{t(label)}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div>
                  <label htmlFor="f-seller" className="mb-2 block text-sm font-medium">{t("role.name.seller")}</label>
                  <select id="f-seller" name="seller" defaultValue={seller} className={cn(inputCls, "h-10")}>
                    <option value="">{t("shop.filter.anySeller")}</option>
                    {sellers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </select>
                </div>
                <fieldset>
                  <legend className="mb-2 text-sm font-medium">{t("shop.filter.price")}</legend>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label htmlFor="f-min" className="sr-only">{t("shop.filter.minLabel")}</label><input id="f-min" name="min" type="number" inputMode="numeric" min={0} placeholder={t("shop.filter.min")} defaultValue={min} className={cn(inputCls, "h-10")} /></div>
                    <div><label htmlFor="f-max" className="sr-only">{t("shop.filter.maxLabel")}</label><input id="f-max" name="max" type="number" inputMode="numeric" min={0} placeholder={t("shop.filter.max")} defaultValue={max} className={cn(inputCls, "h-10")} /></div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[["", "500"], ["500", "1000"], ["1000", "2500"], ["2500", ""]].map(([lo, hi]) => (
                      <button
                        key={lo + hi}
                        type="button"
                        onClick={(e) => {
                          const f = e.currentTarget.form!;
                          (f.elements.namedItem("min") as HTMLInputElement).value = lo;
                          (f.elements.namedItem("max") as HTMLInputElement).value = hi;
                        }}
                        className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-fg/30 hover:text-fg"
                      >
                        {lo && hi ? `₹${lo}–${hi}` : lo ? `₹${lo}+` : t("shop.priceUnder", { n: hi })}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
              <div className="flex gap-2 border-t border-line px-5 py-4">
                <button type="button" onClick={reset} className={cn(btn("ghost", "lg"))}>{t("shop.filter.reset")}</button>
                <button className={cn(btn("primary", "lg"), "flex-1")}>{t("shop.filter.show")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
