import Link from "next/link";
import { Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { getSeller } from "@/lib/store";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { AddToCart } from "./cart";
import { Badge, ProductArt } from "./ui";

export function ProductCard({ p, lang = "en", why }: { p: Product; lang?: "en" | "hi"; why?: string[] }) {
  const seller = getSeller(p.sellerId);
  const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0;
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/product/${p.id}`} className="relative block overflow-hidden" aria-label={p.title}>
        <ProductArt src={artUrl(p)} alt={p.title} className="transition duration-300 group-hover:scale-105" />
        {off > 0 && <Badge tone="accent" className="absolute left-2 top-2 bg-surface/90">{off}% off</Badge>}
        {p.stock > 0 && p.stock <= 5 && <Badge tone="warn" className="absolute right-2 top-2 bg-surface/90">Only {p.stock} left</Badge>}
        {p.stock < 1 && <Badge tone="bad" className="absolute right-2 top-2 bg-surface/90">Sold out</Badge>}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/store/${p.sellerId}`} className="truncate text-xs text-muted hover:text-accent">{seller?.emoji} {seller?.name} · {seller?.city}</Link>
        <Link href={`/product/${p.id}`} className="line-clamp-2 text-sm font-medium leading-snug hover:underline">{lang === "hi" ? p.titleHi : p.title}</Link>
        {why && why.length > 0 && <p className="text-[11px] text-accent">Why: {why[0]}</p>}
        <div className="mt-auto flex items-end justify-between pt-1">
          <div>
            <div className="text-base font-semibold tabular-nums">{formatINR(p.price)}</div>
            {off > 0 && <div className="text-xs text-muted line-through tabular-nums">{formatINR(p.mrp)}</div>}
          </div>
          <span className="flex items-center gap-0.5 text-xs text-muted"><Star className="size-3.5 fill-warn text-warn" />{p.rating.toFixed(1)}</span>
        </div>
        <AddToCart id={p.id} stock={p.stock} className="mt-1 w-full" />
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: n }).map((_, i) => <div key={i} className="skeleton aspect-[3/4]" />)}</div>;
}
