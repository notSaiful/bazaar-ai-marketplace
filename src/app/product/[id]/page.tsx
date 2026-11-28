import Link from "next/link";
import { ZoomableImage } from "@/components/zoomable-image";
import { StickyBuyBar } from "@/components/sticky-buy-bar";
import { RecentlyViewed, RecordView } from "@/components/recently-viewed";
import { ShareButton } from "@/components/share-button";
import { CompareButton } from "@/components/compare";
import { notFound } from "next/navigation";
import { getProduct, getSeller, isVisible, publicReviews } from "@/lib/store";
import { accountName, getSession } from "@/lib/session";
import { ReviewsSection } from "@/components/reviews";
import { Stars } from "@/components/stars";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { AddToCart } from "@/components/cart";
import { StockBadge } from "@/components/stock-badge";
import { ProductArt } from "@/components/ui";
import { PHOTO_CREDITS, licenseLabel } from "@/lib/catalog";
import { DICT, t, tn } from "@/lib/i18n";

type P = Promise<{ id: string }>;
export async function generateMetadata({ params }: { params: P }) {
  const p = getProduct((await params).id);
  const { lang } = await getSession();
  const hi = lang === "hi";
  return { title: (hi ? p?.titleHi : p?.title) ?? t("shop.product.meta", lang), description: hi ? p?.descriptionHi : p?.description };
}

export default async function ProductPage({ params }: { params: P }) {
  const { id } = await params;
  const s = await getSession();
  const p = getProduct(id);
  if (!p) notFound();
  const owner = s.role === "admin" || (s.role === "seller" && s.sellerId === p.sellerId);
  if (!isVisible(p) && !owner) notFound();
  const seller = getSeller(p.sellerId)!;
  const credit = PHOTO_CREDITS[p.id];
  const reviews = publicReviews(p);
  const ratingCount = p.ratingCount ?? reviews.length;
  const jsonLd = {
    "@context": "https://schema.org", "@type": "Product", name: p.title, description: p.description,
    offers: { "@type": "Offer", priceCurrency: "INR", price: p.price / 100, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
    ...(ratingCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating, reviewCount: ratingCount } } : {}),
    review: reviews.slice(0, 5).map((r) => ({ "@type": "Review", author: { "@type": "Person", name: r.author }, reviewRating: { "@type": "Rating", ratingValue: r.stars }, reviewBody: r.text, ...(r.at ? { datePublished: r.at.slice(0, 10) } : {}) })),
  };
  // Product and review text is untrusted: escape "<" so it can never close the script tag.
  const ld = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
  const L = s.lang;
  const hi = L === "hi";
  const statusLabel = hi && DICT[`status.${p.status}`] ? t(`status.${p.status}`, L) : p.status;
  return (
    <div className="space-y-16">
    <div data-fly-root className="grid gap-10 md:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
      <figure>
        <div className="relative overflow-hidden rounded-xl bg-surface2"><ZoomableImage src={artUrl(p)} title={hi ? p.titleHi : p.title} /><ProductArt src={artUrl(p)} alt={p.title} eager sizes="(min-width: 1280px) 580px, (min-width: 768px) 45vw, 100vw" className="aspect-square" /></div>
        {credit && p.image === `/products/${p.id}.jpg` && (
          <figcaption className="mt-2 text-xs text-muted">
            {t("shop.product.photo", L)} <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">{credit.creator || t("shop.unknown", L)}</a>, <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">{licenseLabel(credit.license)}</a>. {t("shop.product.illustrative", L)}
          </figcaption>
        )}
      </figure>
      <div className="space-y-6 md:pt-4">
        {!isVisible(p) && <p className="rounded-xl bg-warn/15 px-4 py-2 text-sm text-warn">{t("shop.product.preview", L, { status: statusLabel })}</p>}
        <div>
          <Link href={`/store/${seller.id}`} className="text-sm text-muted hover:text-accent">{seller.name} · {seller.city}</Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight" lang={hi ? "hi" : undefined}>{hi ? p.titleHi : p.title}</h1>
          <p className="text-muted" lang={hi ? "en" : "hi"}>{hi ? p.title : p.titleHi}</p>
          {ratingCount > 0 && (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
              <Stars value={p.rating} label={false} lang={L} /> <span className="font-medium text-fg">{p.rating.toFixed(1)}</span> · {tn(ratingCount, "shop.rating.one", "shop.rating.many", L)} · {tn(reviews.length, "shop.review.one", "shop.review.many", L)}
            </a>
          )}
        </div>
        <div className="flex items-center gap-4"><span className="text-3xl font-semibold tabular-nums">{formatINR(p.price)}</span><StockBadge id={p.id} initial={p.stock} threshold={p.lowStockThreshold} /></div>
        <div id="buy-box" className="flex gap-2">
          <AddToCart id={p.id} stock={p.stock} className="h-12 flex-1" />
          <ShareButton path={`/product/${p.id}`} title={hi ? p.titleHi : p.title} />
        </div>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="pt-2 text-sm text-muted">{t("shop.product.delivery", L, { city: seller.city })}</p>
          {s.role === "customer" && <CompareButton item={{ id: p.id, title: p.title, titleHi: p.titleHi, image: artUrl(p) }} />}
        </div>
        <section className="space-y-2 border-t border-line pt-6"><p className="leading-relaxed" lang={hi ? "hi" : undefined}>{hi ? p.descriptionHi : p.description}</p><p className="text-sm leading-relaxed text-muted" lang={hi ? "en" : "hi"}>{hi ? p.description : p.descriptionHi}</p></section>
        <details className="border-t border-line pt-4 text-sm"><summary className="cursor-pointer text-muted hover:text-fg">{t("shop.product.details", L)}</summary>
          <dl className="mt-3 grid grid-cols-2 gap-3">{Object.entries(p.attributes).map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd>{v}</dd></div>)}</dl>
        </details>
      </div>
    </div>
    <StickyBuyBar targetId="buy-box" id={p.id} stock={p.stock} price={formatINR(p.price)} title={hi ? p.titleHi : p.title} />
    <RecordView item={{ id: p.id, title: p.title, titleHi: p.titleHi, image: artUrl(p) }} />
    <ReviewsSection p={p} canReview={s.role === "customer" && isVisible(p)} mine={p.reviews.find((r) => r.customerId === s.customerId)} defaultName={s.role === "customer" ? accountName(s.role, s.sellerId) : ""} lang={L} />
    <RecentlyViewed exclude={p.id} />
    </div>
  );
}
