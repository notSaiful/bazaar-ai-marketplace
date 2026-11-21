import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { db, liveProducts } from "@/lib/store";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { SearchBox } from "@/components/search-box";
import { ProductCard } from "@/components/product-card";
import { ProductArt, btn } from "@/components/ui";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

function SectionHead({ id, title, href, cta = "See all" }: { id: string; title: string; href?: string; cta?: string }) {
  return (
    <div data-reveal className="mb-4 flex items-center justify-between">
      <h2 id={id} className="text-base font-semibold tracking-tight">{title}</h2>
      {href && <Link href={href} className="group flex items-center gap-1 text-sm text-muted transition hover:text-fg">{cta}<ChevronRight className="size-4 transition group-hover:translate-x-0.5" /></Link>}
    </div>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-line bg-surface ${className}`}>{children}</div>;
}

export default async function Home() {
  const s = await getSession();
  const hi = s.lang === "hi";
  const live = liveProducts();
  const catName = Object.fromEntries(CATEGORIES.map((c) => [c.slug, hi ? c.nameHi : c.name]));
  const sellers = db().sellers;
  const sellerName = (id: string) => sellers.find((x) => x.id === id)?.name ?? "";
  // Newest first, but take turns across categories so one seller's batch upload doesn't fill the list.
  const byCat = CATEGORIES.map((c) => live.filter((p) => p.category === c.slug).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  const newest = Array.from({ length: 6 }, (_, i) => byCat[i % byCat.length][Math.floor(i / byCat.length)]).filter(Boolean);
  const popular = [...live].sort((a, b) => b.rating - a.rating).slice(0, 8);
  const makers = sellers.filter((x) => x.status === "active").map((m) => ({ m, items: live.filter((p) => p.sellerId === m.id) })).filter((x) => x.items.length);
  const steps = [
    { title: "Search the way you talk", body: "English, Hindi or Hinglish. “diwali ke liye diya” just works." },
    { title: "One cart, many makers", body: "Add from any number of independent sellers and pay once." },
    { title: "Track every parcel", body: "Each maker ships their part. Follow each one from your orders." },
  ];

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="max-w-3xl pt-2">
        <div className="rise mb-6 inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-1 text-[13px] text-muted">
          <span className="status-dot" aria-hidden /> {live.length} handmade products · {makers.length} makers · free delivery
        </div>
        <h1 className="rise text-[44px] font-semibold leading-[1] tracking-tight sm:text-[56px]" style={d(60)}>{t("hero_title", s.lang)}</h1>
        <p className="rise mt-5 max-w-xl text-base text-muted sm:text-lg" style={d(120)}>{t("hero_sub", s.lang)}</p>
        <div className="rise mt-7 flex flex-wrap gap-2" style={d(180)}>
          <Link href="/search" className={btn("primary", "lg")}>{t("shop", s.lang)} <ArrowRight className="size-4" /></Link>
          <a href="#makers" className={btn("outline", "lg")}>{t("sellers", s.lang)}</a>
        </div>
        <div className="rise mt-8 max-w-xl" style={d(240)}><SearchBox big placeholder={t("search_ph", s.lang)} /></div>
      </section>

      {/* What's new: compact list rows */}
      <section aria-labelledby="new">
        <SectionHead id="new" title="What's new" href="/search" />
        <Panel className="grid divide-y divide-line overflow-hidden sm:grid-cols-2 sm:divide-y-0">
          {newest.map((p, i) => (
            <Link
              key={p.id}
              href={`/product/${p.id}`}
              data-reveal="right"
              style={d(i * 70)}
              className={`group flex items-center gap-3 p-3 transition-colors hover:bg-surface2 sm:border-line ${i % 2 === 0 ? "sm:border-r" : ""} ${i < newest.length - 2 ? "sm:border-b" : ""}`}
            >
              <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-surface2"><ProductArt src={artUrl(p)} alt="" className="transition duration-500 group-hover:scale-110" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{hi ? p.titleHi : p.title}</span>
                <span className="block truncate text-xs text-muted">{catName[p.category]} · {sellerName(p.sellerId)}</span>
              </span>
              <span className="text-sm font-medium tabular-nums">{formatINR(p.price)}</span>
              <ChevronRight className="size-4 text-muted transition group-hover:translate-x-0.5 group-hover:text-fg" />
            </Link>
          ))}
        </Panel>
      </section>

      {/* Popular grid */}
      <section aria-labelledby="pop">
        <SectionHead id="pop" title={t("featured", s.lang)} href="/search" cta="View all" />
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
          {popular.map((p, i) => <div key={p.id} data-reveal style={d((i % 4) * 80)}><ProductCard p={p} lang={s.lang} /></div>)}
        </div>
      </section>

      {/* Makers: project-style cards with a photo mosaic cover */}
      <section id="makers" aria-labelledby="mk" className="scroll-mt-24">
        <SectionHead id="mk" title={t("sellers", s.lang)} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {makers.map(({ m, items }, i) => (
            <Link key={m.id} href={`/store/${m.id}`} data-reveal style={d((i % 3) * 90)} className="group overflow-hidden rounded-xl border border-line bg-surface transition duration-300 hover:lift">
              <div className="grid aspect-[16/9] grid-cols-3 gap-px overflow-hidden bg-line">
                {[0, 1, 2].map((k) => {
                  const p = items[k % items.length];
                  return <div key={k} className="overflow-hidden bg-surface2"><ProductArt src={artUrl(p)} alt="" className="h-full transition duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-110" /></div>;
                })}
              </div>
              <div className="flex items-start gap-3 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg text-base" style={{ background: `hsl(${m.hue} 70% 90%)` }} aria-hidden>{m.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold tracking-tight">{m.name}</span>
                  <span className="block truncate text-xs text-muted">{m.city} · {items.length} products · ★ {m.rating.toFixed(1)}</span>
                </span>
                <span className="flex items-center gap-1 rounded-md border border-line px-2 py-1 text-xs text-muted transition group-hover:border-fg/30 group-hover:text-fg">View store <ArrowUpRight className="size-3" /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works: article-style rows */}
      <section aria-labelledby="how">
        <SectionHead id="how" title="How Bazaar works" />
        <Panel className="divide-y divide-line">
          {steps.map((st, i) => (
            <div key={st.title} data-reveal="left" style={d(i * 110)} className="flex items-start gap-4 p-4 sm:items-center">
              <span className="w-8 shrink-0 text-sm font-medium tabular-nums text-muted">0{i + 1}</span>
              <span className="flex-1 sm:flex sm:items-center sm:justify-between sm:gap-6">
                <span className="block text-sm font-medium">{st.title}</span>
                <span className="mt-0.5 block text-sm text-muted sm:mt-0 sm:text-right">{st.body}</span>
              </span>
            </div>
          ))}
        </Panel>
      </section>

      {/* Closing CTA */}
      <section data-reveal className="flex flex-col items-start justify-between gap-6 rounded-xl bg-accent p-8 text-accent-fg sm:flex-row sm:items-center sm:p-10">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">Pay once. Support every maker in your cart.</h2>
          <p className="mt-2 text-sm opacity-60">Free delivery, transparent commission, and an assistant that speaks Hinglish.</p>
        </div>
        <Link href="/search" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-accent-fg px-5 text-sm font-medium text-accent transition hover:opacity-90">
          Start shopping <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}
