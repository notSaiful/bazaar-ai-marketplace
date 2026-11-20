import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { search } from "@/lib/search";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { ProductCard } from "@/components/product-card";
import { EmptyState, btn, inputCls } from "@/components/ui";
import { cn } from "@/lib/utils";

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
  const r = search(q, { category: category || undefined, sellerId: seller || undefined, min, max, sort: sort || undefined });
  const sellers = db().sellers.filter((x) => x.status === "active");
  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams();
    const cur: Record<string, string> = { q, category, seller, sort, min: one(sp.min), max: one(sp.max), ...over };
    for (const [k, v] of Object.entries(cur)) if (v) p.set(k, v);
    return `/search?${p.toString()}`;
  };
  const hasFilters = !!(seller || sort || min || max);
  const title = q ? `“${q}”` : category ? CATEGORIES.find((c) => c.slug === category)?.name : "Shop";
  const understood = [...r.parsed.intents, ...(r.parsed.maxPrice ? [`under ${formatINR(r.parsed.maxPrice)}`] : [])];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{r.total} items{understood.length > 0 && q ? ` · understood as ${understood.join(", ")}` : ""}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={href({ category: "" })} className={cn("rounded-full border px-4 py-1.5 text-sm", !category ? "border-accent text-accent" : "border-line text-muted hover:text-fg")}>All</Link>
        {CATEGORIES.map((c) => <Link key={c.slug} href={href({ category: c.slug })} className={cn("rounded-full border px-4 py-1.5 text-sm", category === c.slug ? "border-accent text-accent" : "border-line text-muted hover:text-fg")}>{s.lang === "hi" ? c.nameHi : c.name}</Link>)}
        <details className="ml-auto" open={hasFilters}>
          <summary className="cursor-pointer text-sm text-muted hover:text-fg">Sort & filter</summary>
          <form action="/search" className="absolute right-4 z-20 mt-2 w-72 space-y-3 rounded-2xl border border-line bg-surface p-4 shadow-lg">
            {q && <input type="hidden" name="q" value={q} />}
            {category && <input type="hidden" name="category" value={category} />}
            <div><label htmlFor="sort" className="mb-1 block text-sm">Sort</label><select id="sort" name="sort" defaultValue={sort} className={inputCls}><option value="">Best match</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Rating</option></select></div>
            <div><label htmlFor="seller" className="mb-1 block text-sm">Seller</label><select id="seller" name="seller" defaultValue={seller} className={inputCls}><option value="">Any</option>{sellers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-2"><div><label htmlFor="min" className="mb-1 block text-sm">Min ₹</label><input id="min" name="min" type="number" min={0} defaultValue={one(sp.min)} className={inputCls} /></div><div><label htmlFor="max" className="mb-1 block text-sm">Max ₹</label><input id="max" name="max" type="number" min={0} defaultValue={one(sp.max)} className={inputCls} /></div></div>
            <div className="flex gap-2"><button className={cn(btn("primary"), "flex-1")}>Apply</button><Link href={q ? `/search?q=${encodeURIComponent(q)}` : "/search"} className={btn("ghost")}>Reset</Link></div>
          </form>
        </details>
      </div>
      {r.hits.length === 0 ? (
        <EmptyState emoji="🔍" title="Nothing found" hint="Try fewer words, or something like “sardi ke liye shawl”." action={<Link href="/search" className={btn("primary")}>Clear search</Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{r.hits.map((h) => <ProductCard key={h.product.id} p={h.product} lang={s.lang} why={q ? h.why : undefined} />)}</div>
      )}
    </div>
  );
}
