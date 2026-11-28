import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { getProduct, getSeller, isVisible } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { t } from "@/lib/i18n";
import { artUrl, cn } from "@/lib/utils";
import type { Product } from "@/lib/types";
import { AddToCart } from "@/components/cart";
import { CompareRemove, CompareSync } from "@/components/compare";
import { btn, EmptyState, PageHeader, ProductArt } from "@/components/ui";

// The ids come from the URL, so treat them as untrusted: well-formed, real and visible products only.
const ID = /^p_[a-z0-9_]{1,40}$/i;
type SP = Promise<{ ids?: string | string[] }>;

export async function generateMetadata(): Promise<Metadata> {
  return { title: t("browse.compare.title", (await getSession()).lang), robots: { index: false } };
}

export default async function ComparePage({ searchParams }: { searchParams: SP }) {
  const { lang: L } = await getSession();
  const hi = L === "hi";
  const raw = (await searchParams).ids;
  const ids = [...new Set((Array.isArray(raw) ? raw[0] : raw ?? "").split(",").filter((x) => ID.test(x)))].slice(0, 3);
  const products = ids.map((id) => getProduct(id)).filter((p): p is Product => !!p && isVisible(p));
  const shown = products.map((p) => p.id);
  const name = (p: Product) => (hi ? p.titleHi : p.title);

  // Badges only when they tell the shopper something (more than one product and not all equal).
  const prices = products.map((p) => p.price);
  const ratings = products.map((p) => p.rating);
  const lowest = products.length > 1 && new Set(prices).size > 1 ? Math.min(...prices) : null;
  const best = products.length > 1 && new Set(ratings).size > 1 ? Math.max(...ratings) : null;
  const attrKeys = [...new Set(products.flatMap((p) => Object.keys(p.attributes)))];

  const stock = (p: Product) =>
    p.stock < 1 ? <span className="text-bad">{t("out_of_stock", L)}</span>
    : p.stock <= p.lowStockThreshold ? <span className="text-warn">{t("low_stock", L, { n: p.stock })}</span>
    : <span className="text-ok">{t("in_stock", L)}</span>;
  const badge = (label: string) => <span className="ml-2 inline-block rounded-full bg-accent px-2 py-0.5 align-middle text-[11px] font-semibold text-accent-fg">{label}</span>;

  const rows: [string, (p: Product) => ReactNode][] = [
    [t("browse.compare.price", L), (p) => <><span className="text-base font-semibold tabular-nums">{formatINR(p.price)}</span>{p.price === lowest && badge(t("browse.compare.lowest", L))}</>],
    [t("browse.compare.rating", L), (p) => <><span className="font-medium">★ {p.rating.toFixed(1)}</span>{(p.ratingCount ?? 0) > 0 && <span className="text-muted"> · {t("browse.compare.ratings", L, { n: p.ratingCount! })}</span>}{p.rating === best && badge(t("browse.compare.topRated", L))}</>],
    [t("browse.compare.seller", L), (p) => { const s = getSeller(p.sellerId); return s ? <Link href={`/store/${s.id}`} className="hover:underline">{s.name}</Link> : "—"; }],
    [t("browse.compare.shipsFrom", L), (p) => getSeller(p.sellerId)?.city ?? "—"],
    [t("browse.compare.stock", L), stock],
    ...attrKeys.map((k): [string, (p: Product) => ReactNode] => [k, (p) => p.attributes[k] ?? <span className="text-muted">—</span>]),
  ];

  return (
    <div className="space-y-8">
      <CompareSync hasIds={ids.length > 0} />
      <PageHeader title={t("browse.compare.title", L)} sub={t("browse.compare.sub", L)} />
      {products.length === 0 ? (
        <EmptyState emoji="⚖️" title={t("browse.compare.empty", L)} hint={t("browse.compare.emptyHint", L)} action={<Link href="/search" className={btn("primary")}>{t("browse.compare.browse", L)}</Link>} />
      ) : (
        <>
          {products.length === 1 && <p className="rounded-xl bg-surface2 px-4 py-3 text-sm">{t("browse.compare.addMore", L)} <Link href="/search" className="font-medium underline">{t("browse.compare.browse", L)}</Link></p>}
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className={cn("w-full table-fixed border-separate border-spacing-0 text-sm", products.length > 1 && "min-w-[34rem]")}>
              <caption className="sr-only">{t("browse.compare.title", L)}</caption>
              <colgroup><col className="w-24 sm:w-40" />{products.map((p) => <col key={p.id} />)}</colgroup>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 bg-bg p-3 text-left align-bottom text-xs font-medium text-muted">{t("browse.compare.product", L)}</th>
                  {products.map((p) => (
                    <th key={p.id} scope="col" className="p-3 text-left align-top font-normal">
                      <div data-fly-root className="flex flex-col gap-2">
                        <Link href={`/product/${p.id}`} className="block overflow-hidden rounded-xl bg-surface2"><ProductArt src={artUrl(p)} alt={p.title} sizes="(min-width: 768px) 240px, 40vw" /></Link>
                        <Link href={`/product/${p.id}`} className="line-clamp-2 text-sm font-semibold leading-snug hover:underline" lang={hi ? "hi" : undefined}>{name(p)}</Link>
                        <AddToCart id={p.id} stock={p.stock} className="h-10 w-full" />
                        <CompareRemove id={p.id} ids={shown} title={name(p)} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(([label, cell]) => (
                  <tr key={label}>
                    <th scope="row" className="sticky left-0 z-10 border-t border-line bg-bg p-3 text-left align-top text-xs font-medium text-muted">{label}</th>
                    {products.map((p) => <td key={p.id} className="border-t border-line p-3 align-top">{cell(p)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
