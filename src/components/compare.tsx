"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Check, Scale, X } from "lucide-react";
import { compareHref, compareList, type CompareItem } from "@/lib/shopping-lists";
import { cn } from "@/lib/utils";
import { btn, ProductArt } from "./ui";
import { useLang, useT } from "./lang";

const nameIn = (lang: string, x: { title: string; titleHi: string }) => (lang === "hi" && x.titleHi ? x.titleHi : x.title);

/** "Add to compare" toggle for a product page or quick view. Holds up to 3 products. */
export function CompareButton({ item, className }: { item: CompareItem; className?: string }) {
  const list = compareList.use();
  const t = useT();
  const [full, setFull] = useState(false);
  const on = list.some((x) => x.id === item.id);
  const toggle = () => {
    setFull(false);
    if (on) compareList.remove(item.id);
    else if (!compareList.add(item)) setFull(true);
  };
  return (
    <div className={className}>
      <button
        type="button"
        aria-pressed={on}
        onClick={toggle}
        className={cn("inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium transition", on ? "border-accent bg-accent text-accent-fg" : "border-line hover:bg-surface2")}
      >
        {on ? <Check className="size-4" aria-hidden /> : <Scale className="size-4" aria-hidden />}
        {on ? t("browse.compare.added") : t("browse.compare.add")}
      </button>
      {full && (
        <p role="status" className="mt-2 text-xs text-warn">
          {t("browse.compare.full")} <Link href={compareHref(list.map((x) => x.id))} className="font-medium underline">{t("browse.compare.go", { n: list.length })}</Link>
        </p>
      )}
    </div>
  );
}

const HIDE_ON = /^\/(compare|samples|checkout|pay)(\/|$)/;

/** Floating pill with the products picked for comparison and a link to the compare page. Shoppers only. */
export function CompareTray() {
  const list = compareList.use();
  const path = usePathname();
  const t = useT();
  const lang = useLang();
  if (!list.length || HIDE_ON.test(path)) return null;
  return (
    <section aria-label={t("browse.compare.tray")} className="compare-tray pop fixed left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-line bg-bg/95 p-1.5 shadow-xl backdrop-blur-xl">
      <ul className="flex -space-x-2 pl-1">
        {list.map((x) => (
          <li key={x.id}>
            <button type="button" onClick={() => compareList.remove(x.id)} aria-label={t("browse.compare.removeLabel", { title: nameIn(lang, x) })} title={nameIn(lang, x)} className="group relative block size-9 overflow-hidden rounded-full ring-2 ring-bg">
              <ProductArt src={x.image} alt="" sizes="36px" />
              <span className="absolute inset-0 grid place-items-center bg-black/55 text-white opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100"><X className="size-4" aria-hidden /></span>
            </button>
          </li>
        ))}
      </ul>
      <Link href={compareHref(list.map((x) => x.id))} className={cn(btn("primary", "sm"), "h-9 rounded-full px-4")}>
        <Scale className="size-4" aria-hidden />{t("browse.compare.go", { n: list.length })}
      </Link>
      <button type="button" onClick={() => compareList.clear()} aria-label={t("browse.compare.clear")} className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-surface2 hover:text-fg"><X className="size-4" aria-hidden /></button>
    </section>
  );
}

/** Compare page: remove one product (from the saved list and the URL). */
export function CompareRemove({ id, ids, title }: { id: string; ids: string[]; title: string }) {
  const router = useRouter();
  const t = useT();
  const remove = () => {
    compareList.remove(id);
    router.replace(compareHref(ids.filter((x) => x !== id)));
  };
  return (
    <button type="button" onClick={remove} aria-label={t("browse.compare.removeLabel", { title })} className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted transition hover:bg-surface2 hover:text-bad">
      <X className="size-3.5" aria-hidden />{t("browse.compare.remove")}
    </button>
  );
}

/** Opening /compare without ?ids= (e.g. from a bookmark) shows the products saved in this browser. */
export function CompareSync({ hasIds }: { hasIds: boolean }) {
  const router = useRouter();
  const list = compareList.use();
  useEffect(() => {
    if (!hasIds && list.length) router.replace(compareHref(list.map((x) => x.id)));
  }, [hasIds, list, router]);
  return null;
}
