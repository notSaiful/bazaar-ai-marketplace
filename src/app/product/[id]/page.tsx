import Link from "next/link";
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

type P = Promise<{ id: string }>;
export async function generateMetadata({ params }: { params: P }) {
  const p = getProduct((await params).id);
  return { title: p?.title ?? "Product", description: p?.description };
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
  return (
    <div className="space-y-16">
    <div className="grid gap-10 md:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
      <figure>
        <div className="overflow-hidden rounded-xl bg-surface2"><ProductArt src={artUrl(p)} alt={p.title} eager sizes="(min-width: 1280px) 580px, (min-width: 768px) 45vw, 100vw" className="aspect-square" /></div>
        {credit && p.image === `/products/${p.id}.jpg` && (
          <figcaption className="mt-2 text-xs text-muted">
            Photo: <a href={credit.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">{credit.creator || "Unknown"}</a>, <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">{licenseLabel(credit.license)}</a>. Illustrative image.
          </figcaption>
        )}
      </figure>
      <div className="space-y-6 md:pt-4">
        {!isVisible(p) && <p className="rounded-xl bg-warn/15 px-4 py-2 text-sm text-warn">Preview only: this item is {p.status} and hidden from customers.</p>}
        <div>
          <Link href={`/store/${seller.id}`} className="text-sm text-muted hover:text-accent">{seller.name} · {seller.city}</Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{p.title}</h1>
          <p className="text-muted" lang="hi">{p.titleHi}</p>
          {ratingCount > 0 && (
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm text-muted hover:text-fg">
              <Stars value={p.rating} label={false} /> <span className="font-medium text-fg">{p.rating.toFixed(1)}</span> · {ratingCount} {ratingCount === 1 ? "rating" : "ratings"} · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
            </a>
          )}
        </div>
        <div className="flex items-center gap-4"><span className="text-3xl font-semibold tabular-nums">{formatINR(p.price)}</span><StockBadge id={p.id} initial={p.stock} threshold={p.lowStockThreshold} /></div>
        <AddToCart id={p.id} stock={p.stock} className="h-12 w-full" />
        <p className="text-sm text-muted">Free delivery from {seller.city}. Pay once for items from different sellers.</p>
        <section className="space-y-2 border-t border-line pt-6"><p className="leading-relaxed">{p.description}</p><p className="text-sm leading-relaxed text-muted" lang="hi">{p.descriptionHi}</p></section>
        <details className="border-t border-line pt-4 text-sm"><summary className="cursor-pointer text-muted hover:text-fg">Product details</summary>
          <dl className="mt-3 grid grid-cols-2 gap-3">{Object.entries(p.attributes).map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd>{v}</dd></div>)}</dl>
        </details>
      </div>
    </div>
    <ReviewsSection p={p} canReview={s.role === "customer" && isVisible(p)} mine={p.reviews.find((r) => r.customerId === s.customerId)} defaultName={s.role === "customer" ? accountName(s.role, s.sellerId) : ""} />
    </div>
  );
}
