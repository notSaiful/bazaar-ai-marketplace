import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { search } from "@/lib/search";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";
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
  return { title: q ? `“${q}”` : "Shop" };
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
  const title = q ? `“${q}”` : category ? CATEGORIES.find((c) => c.slug === category)?.name : "Shop";
  const understood = [...r.parsed.intents, ...(r.parsed.maxPrice ? [`under ${formatINR(r.parsed.maxPrice)}`] : [])];
  const SORT_LABEL: Record<string, string> = { price_asc: "Price: low to high", price_desc: "Price: high to low", rating: "Top rated" };
  const lo = one(sp.min), hi = one(sp.max);
  const chips = [
    ...(sort && SORT_LABEL[sort] ? [{ label: SORT_LABEL[sort], href: href({ sort: "" }) }] : []),
    ...(seller ? [{ label: sellers.find((x) => x.id === seller)?.name ?? "Seller", href: href({ seller: "" }) }] : []),
    ...(lo || hi ? [{ label: lo && hi ? `₹${lo}–₹${hi}` : lo ? `₹${lo}+` : `Under ₹${hi}`, href: href({ min: "", max: "" }) }] : []),
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{r.total} items{understood.length > 0 && q ? ` · understood as ${understood.join(", ")}` : ""}</p>
      </div>
      <CategoryChips active={category} hrefFor={(c) => href({ category: c })} lang={s.lang} />
      <div className="flex flex-wrap items-center gap-2">
        <FilterDrawer q={q} category={category} sort={sort ?? ""} seller={seller} min={one(sp.min)} max={one(sp.max)} sellers={sellers.map((x) => ({ id: x.id, name: x.name }))} />
        {chips.map((c) => (
          <Link key={c.label} href={c.href} aria-label={`Remove filter: ${c.label}`} className="group inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface pl-3 pr-2 text-sm transition hover:border-fg/30">
            {c.label}<X className="size-3.5 text-muted group-hover:text-fg" />
          </Link>
        ))}
        {chips.length > 1 && <Link href={href({ sort: "", seller: "", min: "", max: "" })} className="px-2 text-sm text-muted underline-offset-4 hover:text-fg hover:underline">Clear all</Link>}
      </div>
      {r.hits.length === 0 ? (
        <EmptyState emoji="🔍" title="Nothing found" hint="Try fewer words, or something like “sardi ke liye shawl”." action={<Link href="/search" className={btn("primary")}>Clear search</Link>} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{r.hits.slice(0, show).map((h, i) => <ProductCard key={h.product.id} p={h.product} lang={s.lang} why={q ? h.why : undefined} eager={i < 4} />)}</div>
          {r.hits.length > show && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-sm text-muted">Showing {show} of {r.hits.length}</p>
              <Link href={href({ show: String(show + PAGE) })} scroll={false} className={btn("outline", "lg")}>Show more</Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
