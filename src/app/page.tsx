import Link from "next/link";
import type { CSSProperties } from "react";
import { ArrowRight, Languages, ShoppingBag, Truck } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { db, liveProducts } from "@/lib/store";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { artUrl } from "@/lib/utils";
import { SearchBox } from "@/components/search-box";
import { ProductCard } from "@/components/product-card";
import { Ticker } from "@/components/ticker";
import { ProductArt, btn } from "@/components/ui";

const d = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export default async function Home() {
  const s = await getSession();
  const hi = s.lang === "hi";
  const live = liveProducts();
  const popular = [...live].sort((a, b) => b.rating - a.rating).slice(0, 8);
  const makers = db().sellers.filter((x) => x.status === "active");
  const heroArt = popular.slice(0, 3);
  const steps = [
    { icon: Languages, title: "Search the way you talk", body: "English, Hindi or Hinglish. Ask for “diwali ke liye diya” and get diyas." },
    { icon: ShoppingBag, title: "One cart, many makers", body: "Add from as many independent sellers as you like and check out once." },
    { icon: Truck, title: "Track every parcel", body: "Each maker ships their part. Follow each one from your orders page." },
  ];

  return (
    <div className="space-y-28">
      {/* Hero */}
      <section className="grid items-center gap-12 pt-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-7">
          <div className="rise inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm text-muted">
            <span className="size-2 rounded-full bg-pop" aria-hidden />
            {live.length} handmade products from {makers.length} makers
          </div>
          <h1 className="rise text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl" style={d(80)}>{t("hero_title", s.lang)}</h1>
          <p className="rise max-w-lg text-lg text-muted" style={d(160)}>{t("hero_sub", s.lang)}</p>
          <div className="rise max-w-xl" style={d(240)}><SearchBox big placeholder={t("search_ph", s.lang)} /></div>
          <div className="rise flex flex-wrap gap-3" style={d(320)}>
            <Link href="/search" className={btn("primary", "lg")}>{t("shop", s.lang)} <ArrowRight className="size-4" /></Link>
            <a href="#makers" className={btn("outline", "lg")}>{t("sellers", s.lang)}</a>
          </div>
        </div>
        <div className="relative hidden h-[460px] lg:block" aria-hidden>
          {heroArt.map((p, i) => (
            <div
              key={p.id}
              className="rise lift absolute overflow-hidden rounded-[28px] border border-line bg-surface2"
              style={{ ...d(200 + i * 140), ...[
                { width: 260, top: 0, right: 40, rotate: "4deg" },
                { width: 220, top: 150, left: 0, rotate: "-6deg" },
                { width: 200, bottom: 0, right: 0, rotate: "-2deg" },
              ][i] }}
            >
              <ProductArt src={artUrl(p)} alt="" />
            </div>
          ))}
        </div>
      </section>

      {/* Category ticker */}
      <section className="-mx-4 border-y border-line py-6" aria-label={t("categories", s.lang)}>
        <Ticker
          label={t("categories", s.lang)}
          items={[...CATEGORIES, ...CATEGORIES].map((c, i) => (
            <Link key={`${c.slug}-${i}`} href={`/search?category=${c.slug}`} className="flex items-center gap-3 text-2xl font-medium tracking-tight text-muted transition hover:text-fg sm:text-3xl">
              <span aria-hidden>{c.emoji}</span>{hi ? c.nameHi : c.name}
            </Link>
          ))}
        />
      </section>

      {/* Popular */}
      <section aria-labelledby="pop">
        <div data-reveal className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-muted">Top rated</p>
            <h2 id="pop" className="text-4xl font-semibold sm:text-5xl">{t("featured", s.lang)}</h2>
          </div>
          <Link href="/search" className={btn("outline")}>View all <ArrowRight className="size-4" /></Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {popular.map((p, i) => <div key={p.id} data-reveal style={d((i % 4) * 90)}><ProductCard p={p} lang={s.lang} /></div>)}
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how" className="rounded-[40px] bg-surface2 px-6 py-16 sm:px-12">
        <div data-reveal className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-muted">How it works</p>
          <h2 id="how" className="text-4xl font-semibold sm:text-5xl">Three steps from search to doorstep</h2>
        </div>
        <ol className="grid gap-4 md:grid-cols-3">
          {steps.map((st, i) => (
            <li key={st.title} data-reveal="left" style={d(i * 140)} className="rounded-[20px] border border-line bg-surface p-7">
              <div className="mb-8 flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-full bg-accent text-accent-fg gloss"><st.icon className="size-5" /></span>
                <span className="text-5xl font-semibold tracking-tight text-line">0{i + 1}</span>
              </div>
              <h3 className="text-xl font-semibold">{st.title}</h3>
              <p className="mt-2 text-muted">{st.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Makers */}
      <section id="makers" aria-labelledby="mk" className="scroll-mt-24">
        <div data-reveal className="mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-muted">Independent sellers</p>
          <h2 id="mk" className="text-4xl font-semibold sm:text-5xl">{t("sellers", s.lang)}</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {makers.map((m, i) => (
            <Link key={m.id} href={`/store/${m.id}`} data-reveal style={d((i % 3) * 110)} className="group flex items-center gap-4 rounded-[20px] border border-line bg-surface p-5 transition duration-300 hover:-translate-y-1 hover:lift">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `hsl(${m.hue} 70% 92%)` }} aria-hidden>{m.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold tracking-tight">{m.name}</span>
                <span className="block truncate text-sm text-muted">{m.tagline}</span>
                <span className="mt-1 block text-xs text-muted">{m.city} · ★ {m.rating.toFixed(1)}</span>
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted transition group-hover:translate-x-1 group-hover:text-fg" />
            </Link>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section data-reveal className="relative overflow-hidden rounded-[40px] bg-[#141416] px-6 py-20 text-center text-white sm:px-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 to-transparent" aria-hidden />
        <h2 className="mx-auto max-w-3xl text-4xl font-semibold sm:text-6xl">Pay once. Support every maker in your cart.</h2>
        <p className="mx-auto mt-4 max-w-xl text-white/60">Free delivery, transparent commission, and a shopping assistant that speaks Hinglish.</p>
        <Link href="/search" className="gloss mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-medium text-[#141416] transition hover:-translate-y-px">
          Start shopping <ArrowRight className="size-4" />
        </Link>
      </section>
    </div>
  );
}
