import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getProduct } from "@/lib/store";
import { getWishlistIds } from "@/lib/wishlist";
import { t, tn } from "@/lib/i18n";
import { ProductCard } from "@/components/product-card";
import { EmptyState, PageHeader, btn } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const { lang } = await getSession();
  return { title: t("nav.wishlist", lang) };
}

export default async function WishlistPage() {
  const s = await getSession();
  const items = (await getWishlistIds()).map((id) => getProduct(id)!);
  return (
    <div className="space-y-8">
      <PageHeader title={t("nav.wishlist", s.lang)} sub={items.length ? tn(items.length, "shop.wish.saved.one", "shop.wish.saved.many", s.lang) : undefined} />
      {items.length === 0 ? (
        <EmptyState emoji="♡" title={t("shop.wish.empty", s.lang)} hint={t("shop.wish.emptyHint", s.lang)} action={<Link href="/search" className={btn("primary")}>{t("shop.wish.browse", s.lang)}</Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{items.map((p, i) => <ProductCard key={p.id} p={p} lang={s.lang} eager={i < 2} defer={i >= 4} />)}</div>
      )}
    </div>
  );
}
