import Link from "next/link";
import { SlidersHorizontal, Sparkles } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { search } from "@/lib/search";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { ProductCard } from "@/components/product-card";
import { Badge, EmptyState, btn, inputCls } from "@/components/ui";
import { cn } from "@/lib/utils";

type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export async function generateMetadata({ searchParams }: { searchParams: SP }) {
  const q = one((await searchParams).q);
  return { title: q ? `“${q}”` : "Shop all" };
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
  const filters = (
    <form action="/search" className="space-y-4">
      {q && <input type="hidden" name="q" value={q} />}
      <div><label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label>
        <select id="category" name="category" defaultValue={category} className={inputCls}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></div>
      <div><label htmlFor="seller" className="mb-1 block text-sm font-medium">Seller</label>
        <select id="seller" name="seller" defaultValue={seller} className={inputCls}><option value="">All sellers</option>{sellers.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></div>
      <div className="grid grid-cols-2 gap-2">
        <div><label htmlFor="min" className="mb-1 block text-sm font-medium">Min ₹</label><input id="min" name="min" type="number" min={0} defaultValue={one(sp.min)} className={inputCls} /></div>
        <div><label htmlFor="max" className="mb-1 block text-sm font-medium">Max ₹</label><input id="max" name="max" type="number" min={0} defaultValue={one(sp.max)} className={inputCls} /></div>
      </div>
      <div><label htmlFor="sort" className="mb-1 block text-sm font-medium">Sort by</label>
        <select id="sort" name="sort" defaultValue={sort} className={inputCls}><option value="">Relevance</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="rating">Rating</option></select></div>
      <div className="flex gap-2"><button className={cn(btn("primary"), "flex-1")}>Apply</button><Link href={q ? `/search?q=${encodeURIComponent(q)}` : "/search"} className={btn("outline")}>Reset</Link></div>
    </form>
  );
  const title = category ? CATEGORIES.find((c) => c.slug === category)?.name : q ? `Results for “${q}”` : "All products";
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div><h1 className="text-2xl font-semibold">{title}</h1><p className="text-sm text-muted">{r.total} products · {r.ms} ms · {r.mode}</p></div>
      </div>
      {(r.parsed.intents.length > 0 || r.parsed.maxPrice || r.parsed.tokens.length > 0) && q && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent">
          <Sparkles className="size-4" /> <span className="font-medium">How we read your search:</span>
          {r.parsed.tokens.map((x) => <Badge key={x} tone="neutral" className="bg-surface">{x}</Badge>)}
          {r.parsed.intents.map((x) => <Badge key={x} tone="accent" className="bg-surface">intent: {x}</Badge>)}
          {r.parsed.maxPrice && <Badge tone="accent" className="bg-surface">max {formatINR(r.parsed.maxPrice)}</Badge>}
        </div>
      )}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1" aria-label="Category filters">
        <Link href={href({ category: "" })} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-sm", !category ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface")}>All</Link>
        {CATEGORIES.map((c) => <Link key={c.slug} href={href({ category: c.slug })} className={cn("shrink-0 rounded-full border px-3 py-1.5 text-sm", category === c.slug ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface")}>{c.emoji} {s.lang === "hi" ? c.nameHi : c.name}</Link>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>
        <details className="rounded-xl border border-line bg-surface p-3 lg:hidden"><summary className="flex cursor-pointer items-center gap-2 text-sm font-medium"><SlidersHorizontal className="size-4" /> Filters & sort</summary><div className="mt-3">{filters}</div></details>
        <div>
          {r.hits.length === 0 ? (
            <EmptyState emoji="🔍" title="No matches" hint="Try fewer words, or a Hinglish phrase like “sardi ke liye shawl”." action={<Link href="/search" className={btn("primary")}>Clear search</Link>} />
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">{r.hits.map((h) => <ProductCard key={h.product.id} p={h.product} lang={s.lang} why={q ? h.why : undefined} />)}</div>
          )}
        </div>
      </div>
    </div>
  );
}
