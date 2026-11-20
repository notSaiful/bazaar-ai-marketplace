import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { liveProducts } from "@/lib/store";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { SearchBox } from "@/components/search-box";
import { ProductCard } from "@/components/product-card";

export default async function Home() {
  const s = await getSession();
  const popular = [...liveProducts()].sort((a, b) => b.rating - a.rating).slice(0, 8);
  return (
    <div className="space-y-16">
      <section className="mx-auto max-w-2xl space-y-6 pt-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{t("hero_title", s.lang)}</h1>
        <p className="text-muted">{t("hero_sub", s.lang)}</p>
        <SearchBox big placeholder={t("search_ph", s.lang)} />
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {CATEGORIES.map((c) => <Link key={c.slug} href={`/search?category=${c.slug}`} className="rounded-full border border-line px-4 py-1.5 text-sm text-muted transition hover:border-accent hover:text-fg">{s.lang === "hi" ? c.nameHi : c.name}</Link>)}
        </div>
      </section>
      <section aria-labelledby="pop">
        <div className="mb-6 flex items-baseline justify-between"><h2 id="pop" className="text-xl font-semibold">{t("featured", s.lang)}</h2><Link href="/search" className="text-sm text-accent">View all</Link></div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{popular.map((p) => <ProductCard key={p.id} p={p} lang={s.lang} />)}</div>
      </section>
    </div>
  );
}
