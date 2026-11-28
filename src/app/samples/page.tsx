import type { Metadata } from "next";
import { feedAds, getProduct, getSeller } from "@/lib/store";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { ReelsFeed, type FeedCategory, type FeedItem } from "@/components/reels-feed";
import { CATEGORIES } from "@/lib/catalog";
import { EmptyState } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSession();
  return { title: t("samples.title", s.lang), description: t("samples.feed", s.lang) };
}

export default async function SamplesPage() {
  const s = await getSession();
  const hi = s.lang === "hi";
  const items: FeedItem[] = feedAds()
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => {
      const p = getProduct(a.productId)!;
      const shop = getSeller(a.sellerId)!;
      return {
        id: a.id,
        video: a.video,
        poster: a.poster ?? artUrl(p),
        caption: hi && a.captionHi ? a.captionHi : a.caption,
        durationSec: a.durationSec,
        product: {
          id: p.id, title: hi ? p.titleHi : p.title, price: formatINR(p.price), image: artUrl(p), stock: p.stock, lowStock: p.lowStockThreshold,
          category: p.category, description: hi ? p.descriptionHi : p.description, rating: p.rating, ratingCount: p.ratingCount ?? p.reviews.length,
        },
        shop: { id: shop.id, name: shop.name, emoji: shop.emoji, hue: shop.hue, city: shop.city },
      };
    });
  // Chips only for categories that have ads right now, in the store's usual order.
  const categories: FeedCategory[] = CATEGORIES.filter((c) => items.some((it) => it.product.category === c.slug)).map((c) => ({ slug: c.slug, name: hi ? c.nameHi : c.name }));
  if (!items.length) return <EmptyState emoji="🎬" title={t("samples.empty.title", s.lang)} hint={t("samples.empty.hint", s.lang)} />;
  return (
    <>
      <h1 className="sr-only">{t("samples.title", s.lang)}</h1>
      <ReelsFeed items={items} categories={categories} />
    </>
  );
}
