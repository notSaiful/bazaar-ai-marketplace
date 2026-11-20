import Link from "next/link";
import { ArrowRight, Bot, Camera, Languages, ShieldCheck, Split } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { db, liveProducts } from "@/lib/store";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { SearchBox } from "@/components/search-box";
import { ProductCard } from "@/components/product-card";
import { Badge, Card, btn } from "@/components/ui";
import { search } from "@/lib/search";

const EXAMPLES = ["diwali ke liye diya", "sardi ke liye shawl", "maa ke liye gift 2000 tak", "सस्ता earphones", "kurta"];

export default async function Home() {
  const s = await getSession();
  const prods = liveProducts();
  const popular = [...prods].sort((a, b) => b.rating - a.rating).slice(0, 8);
  const festive = search("diwali tyohar gift", { limit: 4 }).hits;
  const sellers = db().sellers.filter((x) => x.status === "active");
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-accent-soft via-surface to-surface p-6 sm:p-10">
        <div className="max-w-2xl">
          <Badge tone="accent" className="mb-4">🇮🇳 {sellers.length} independent sellers · {prods.length} products · one checkout</Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{t("hero_title", s.lang)}</h1>
          <p className="mt-3 text-base text-muted sm:text-lg">{t("hero_sub", s.lang)}</p>
          <div className="mt-6 max-w-xl"><SearchBox big placeholder={t("search_ph", s.lang)} /></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLES.map((e) => <Link key={e} href={`/search?q=${encodeURIComponent(e)}`} className="rounded-full border border-line bg-surface px-3 py-1 text-xs hover:bg-surface2">{e}</Link>)}
          </div>
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 hidden select-none text-[11rem] opacity-20 md:block">🪔</div>
      </section>

      <section aria-labelledby="cats">
        <h2 id="cats" className="mb-3 text-xl font-semibold">{t("categories", s.lang)}</h2>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/search?category=${c.slug}`} className="flex min-w-36 flex-1 flex-col items-center gap-1 rounded-2xl border border-line bg-surface p-4 text-center transition hover:border-accent hover:shadow-sm">
              <span className="text-3xl" aria-hidden>{c.emoji}</span>
              <span className="text-sm font-medium">{s.lang === "hi" ? c.nameHi : c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="festive">
        <div className="mb-3 flex items-end justify-between"><h2 id="festive" className="text-xl font-semibold">🪔 Festive picks <span className="text-sm font-normal text-muted">found with “diwali tyohar gift”</span></h2><Link href="/search?q=diwali%20tyohar%20gift" className="flex items-center gap-1 text-sm text-accent">See all <ArrowRight className="size-4" /></Link></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{festive.map((h) => <ProductCard key={h.product.id} p={h.product} lang={s.lang} why={h.why} />)}</div>
      </section>

      <section aria-labelledby="pop">
        <div className="mb-3 flex items-end justify-between"><h2 id="pop" className="text-xl font-semibold">{t("featured", s.lang)}</h2><Link href="/search" className="flex items-center gap-1 text-sm text-accent">View all <ArrowRight className="size-4" /></Link></div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{popular.map((p) => <ProductCard key={p.id} p={p} lang={s.lang} />)}</div>
      </section>

      <section aria-labelledby="makers">
        <h2 id="makers" className="mb-3 text-xl font-semibold">{t("sellers", s.lang)}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sellers.map((x) => (
            <Link key={x.id} href={`/store/${x.id}`}>
              <Card className="flex items-center gap-3 p-4 transition hover:border-accent">
                <span className="grid size-12 place-items-center rounded-xl text-2xl" style={{ background: `hsl(${x.hue} 80% 90%)` }}>{x.emoji}</span>
                <div className="min-w-0"><div className="font-semibold">{x.name}</div><div className="truncate text-xs text-muted">{x.tagline} · {x.city} · ★ {x.rating}</div></div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4" aria-label="Platform highlights">
        {[
          { i: Camera, t: "Photo → listing", d: "Sellers list from a photo in under a minute, in English + Hindi.", h: "/seller/products/new", c: "Try as seller" },
          { i: Languages, t: "Hinglish search", d: "Search the way you speak. We understand intent, not just keywords.", h: "/search?q=sardi%20ke%20liye%20shawl", c: "Try a search" },
          { i: Split, t: "Transparent split", d: "Every order shows platform fee and seller payout. Ledger reconciles to ₹0.", h: "/orders", c: "See an order" },
          { i: Bot, t: "Agent-ready", d: "UCP discovery + MCP tools let outside AI agents shop here.", h: "/.well-known/ucp", c: "Open UCP doc" },
        ].map((x) => (
          <Card key={x.t} className="p-4"><x.i className="mb-2 size-6 text-accent" /><h3 className="font-semibold">{x.t}</h3><p className="mt-1 text-sm text-muted">{x.d}</p><Link href={x.h} className={`${btn("ghost", "sm")} -ml-3 mt-2`}>{x.c} <ArrowRight className="size-3.5" /></Link></Card>
        ))}
      </section>
      <p className="flex items-center justify-center gap-2 text-xs text-muted"><ShieldCheck className="size-4" /> Prices and stock are always read from the database. AI only proposes.</p>
    </div>
  );
}
