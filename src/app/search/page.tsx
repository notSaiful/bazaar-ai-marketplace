import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { search } from "@/lib/search";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { formatINR } from "@/lib/money";
import { ProductCard } from "@/components/product-card";
import { EmptyState, btn } from "@/components/ui";
import { CategoryChips } from "@/components/category-chips";
import { FilterDrawer } from "@/components/filter-drawer";
import { X } from "lucide-react";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: { searchParams: SP }) {
  const q = one((await searchParams).q);
  const { lang } = await getSession();
  return { title: q ? `“${q}”` : t("nav.shop", lang) };
}

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const s = await getSession();
  const q = one(sp.q), category = one(sp.category), seller = one(sp.seller), sort = one(sp.sort) as "relevance" | "price_asc" | "price_desc" | "rating";
  const min = one(sp.min) ? Number(one(sp.min)) * 100 : undefined;
  const max = one(sp.max) ? Number(one(sp.max)) * 100 : undefined;
  const PAGE = 24;
  const show = Math.min(200, Math.max(PAGE, Math.floor(Number(one(sp.show)) || PAGE)));
  const r = search(q, { category: category || undefined, sellerId: seller || undefined, min, max, sort: sort || undefined });
  const sellers = db().sellers.filter((x) => x.status === "active");
  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string> = { q, category, seller, sort, min: one(sp.min), max: one(sp.max), ...over };
    for (const [k, v] of Object.entries(cur)) if (v) p.set(k, v);
    return `/search?${p.toString()}`;
  };
  const L = s.lang;
  const cat = category ? CATEGORIES.find((c) => c.slug === category) : undefined;
  const title = q ? `“${q}”` : category ? (cat && L === "hi" ? cat.nameHi : cat?.name) : t("nav.shop", L);
  const understood = [...r.parsed.intents, ...(r.parsed.maxPrice ? [t("shop.search.under", L, { price: formatINR(r.parsed.maxPrice) })] : [])];
  const SORT_LABEL: Record<string, string> = { price_asc: t("shop.sort.priceAsc", L), price_desc: t("shop.sort.priceDesc", L), rating: t("shop.sort.rating", L) };
  const lo = one(sp.min), hi = one(sp.max);
  const chips = [
    ...(sort && SORT_LABEL[sort] ? [{ label: SORT_LABEL[sort], href: href({ sort: "" }) }] : []),
    ...(seller ? [{ label: sellers.find((x) => x.id === seller)?.name ?? t("role.name.seller", L), href: href({ seller: "" }) }] : []),
    ...(lo || hi ? [{ label: lo && hi ? `₹${lo}–₹${hi}` : lo ? `₹${lo}+` : t("shop.priceUnder", L, { n: hi }), href: href({ min: "", max: "" }) }] : []),
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{t("shop.search.count", L, { n: r.total })}{understood.length > 0 && q ? ` · ${t("shop.search.understood", L, { list: understood.join(", ") })}` : ""}</p>
      </div>
      <CategoryChips active={category} hrefFor={(c) => href({ category: c })} lang={s.lang} />
      <div className="flex flex-wrap items-center gap-2">
        <FilterDrawer q={q} category={category} sort={sort ?? ""} seller={seller} min={one(sp.min)} max={one(sp.max)} sellers={sellers.map((x) => ({ id: x.id, name: x.name }))} />
        {chips.map((c) => (
          <Link key={c.label} href={c.href} aria-label={t("shop.search.removeFilter", L, { label: c.label })} className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface pl-3 pr-2 text-sm transition hover:border-fg/30">
            {c.label}<X className="size-3.5 text-muted group-hover:text-fg" />
          </Link>
        ))}
        {chips.length > 1 && <Link href={href({ sort: "", seller: "", min: "", max: "" })} className="px-2 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">{t("shop.search.clearAll", L)}</Link>}
      </div>
      {r.hits.length === 0 ? (
        <EmptyState emoji="🔍" title={t("shop.search.empty", L)} hint={t("shop.search.emptyHint", L)} action={<Link href="/search" className={btn("primary")}>{t("shop.search.clear", L)}</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{r.hits.slice(0, show).map((h, i) => <ProductCard key={h.product.id} p={h.product} lang={s.lang} why={q ? h.why : undefined} eager={i < 2} defer={i >= 4} />)}</div>
          {r.hits.length > show && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-sm text-muted">{t("shop.search.showing", L, { n: show, total: r.hits.length })}</p>
              <Link href={href({ show: String(show + PAGE) })} scroll={false} className={btn("outline", "lg")}>{t("shop.search.showMore", L)}</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
