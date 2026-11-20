import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck, MapPin, ShieldCheck, Sparkles, Star, Truck } from "lucide-react";
import { getProduct, getSeller, isVisible, liveProducts } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { AddToCart, BuyNow } from "@/components/cart";
import { StockBadge } from "@/components/stock-badge";
import { Badge, Card, ProductArt } from "@/components/ui";
import { ProductCard } from "@/components/product-card";
import { CATEGORIES } from "@/lib/catalog";

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
  const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  const cat = CATEGORIES.find((c) => c.slug === p.category);
  const related = liveProducts().filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  const jsonLd = { "@context": "https://schema.org", "@type": "Product", name: p.title, description: p.description, offers: { "@type": "Offer", priceCurrency: "INR", price: p.price / 100, availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } };
  return (
    <div className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {!isVisible(p) && <p className="rounded-xl bg-warn/15 px-4 py-2 text-sm text-warn">Preview: this product is <b>{p.status}</b> and not visible to customers.{p.flagReason && ` Reason: ${p.flagReason}`}</p>}
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/" className="hover:text-fg">Home</Link> / <Link href={`/search?category=${p.category}`} className="hover:text-fg">{cat?.name}</Link> / <span className="text-fg">{p.title}</span></nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-3xl border border-line"><ProductArt src={artUrl(p)} alt={p.title} className="aspect-square" /></div>
          <div className="mt-3 grid grid-cols-4 gap-2" aria-hidden>
            {[0, 40, 80, 120].map((d) => <div key={d} className="overflow-hidden rounded-xl border border-line"><ProductArt src={p.image ?? `/api/art?h=${(p.hue + d) % 360}&e=${encodeURIComponent(p.emoji)}`} alt="" /></div>)}
          </div>
        </div>
        <div className="space-y-5">
          <div>
            <Link href={`/store/${seller.id}`} className="text-sm text-accent hover:underline">{seller.emoji} {seller.name}</Link>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">{p.title}</h1>
            <p className="text-lg text-muted" lang="hi">{p.titleHi}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1"><Star className="size-4 fill-warn text-warn" />{p.rating.toFixed(1)}</span>
              <StockBadge id={p.id} initial={p.stock} threshold={p.lowStockThreshold} />
              {p.aiGenerated && <Badge tone="accent"><Sparkles className="size-3" /> AI-assisted listing · seller verified</Badge>}
            </div>
          </div>
          <div className="flex items-baseline gap-3"><span className="text-3xl font-bold tabular-nums">{formatINR(p.price)}</span>{off > 0 && <><span className="text-muted line-through tabular-nums">{formatINR(p.mrp)}</span><Badge tone="ok">{off}% off</Badge></>}</div>
          <div className="flex gap-3"><AddToCart id={p.id} stock={p.stock} className="h-12 flex-1" /><BuyNow id={p.id} stock={p.stock} className="h-12 flex-1" /></div>
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-center gap-2"><Truck className="size-4 text-accent" /> Free delivery from {seller.city} · one payment for items from many sellers</li>
            <li className="flex items-center gap-2"><ShieldCheck className="size-4 text-accent" /> Refund protection · payout released to seller only after delivery</li>
          </ul>
          <section aria-labelledby="desc"><h2 id="desc" className="mb-1 font-semibold">About this item</h2><p className="text-sm leading-relaxed">{p.description}</p><p className="mt-2 text-sm leading-relaxed text-muted" lang="hi">{p.descriptionHi}</p></section>
          <dl className="grid grid-cols-2 gap-2 text-sm">{Object.entries(p.attributes).map(([k, v]) => <div key={k} className="rounded-xl bg-surface2 p-3"><dt className="text-xs text-muted">{k}</dt><dd className="font-medium">{v}</dd></div>)}</dl>
          <Card className="flex items-center gap-3 p-4">
            <span className="grid size-12 place-items-center rounded-xl text-2xl" style={{ background: `hsl(${seller.hue} 80% 90%)` }}>{seller.emoji}</span>
            <div className="flex-1"><div className="flex items-center gap-1 font-semibold">{seller.name} <BadgeCheck className="size-4 text-accent" aria-label="Verified seller" /></div><div className="flex items-center gap-1 text-xs text-muted"><MapPin className="size-3" />{seller.city} · ★ {seller.rating} · {seller.tagline}</div></div>
            <Link href={`/store/${seller.id}`} className="text-sm text-accent hover:underline">Visit store</Link>
          </Card>
        </div>
      </div>
      <section aria-labelledby="rev"><h2 id="rev" className="mb-3 text-xl font-semibold">Reviews</h2>
        <div className="grid gap-3 md:grid-cols-2">{p.reviews.map((r, i) => <Card key={i} className="p-4"><div className="flex items-center justify-between text-sm"><b>{r.author}</b><span className="text-warn">{"★".repeat(r.stars)}</span></div><p className="mt-1 text-sm text-muted">{r.text}</p></Card>)}</div>
        <p className="mt-2 text-xs text-muted">Review and listing text is treated as untrusted data by our shopping assistant.</p>
      </section>
      {related.length > 0 && <section aria-labelledby="rel"><h2 id="rel" className="mb-3 text-xl font-semibold">More in {cat?.name}</h2><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{related.map((x) => <ProductCard key={x.id} p={x} lang={s.lang} />)}</div></section>}
    </div>
  );
}
