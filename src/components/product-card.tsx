import Link from "next/link";
import type { Product } from "@/lib/types";
import { getSeller } from "@/lib/store";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { AddToCart } from "./cart";
import { ProductArt } from "./ui";
import { HeartButton } from "./wishlist";
import { DeferredArt } from "./deferred-art";

/** `defer` mounts the photo only near the viewport (use for cards past the first row). */
export function ProductCard({ p, lang = "en", why, eager, defer }: { p: Product; lang?: "en" | "hi"; why?: string[]; eager?: boolean; defer?: boolean }) {
  const seller = getSeller(p.sellerId);
  return (
    <article className="group flex flex-col gap-3">
      <div className="relative">
        <Link href={`/product/${p.id}`} className="relative block overflow-hidden rounded-xl bg-surface2 transition duration-500 group-hover:lift">
          {defer && !eager ? (
            <DeferredArt src={artUrl(p)} alt={p.title} className="transition duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]" />
          ) : (
            <ProductArt eager={eager} src={artUrl(p)} alt={p.title} className="transition duration-700 ease-[cubic-bezier(.22,1,.36,1)] group-hover:scale-[1.04]" />
          )}
          {p.stock > 0 && p.stock <= 5 && <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium text-warn backdrop-blur">Only {p.stock} left</span>}
          {p.stock < 1 && <span className="absolute left-3 top-3 rounded-full bg-surface/90 px-2.5 py-1 text-xs font-medium text-bad backdrop-blur">Sold out</span>}
          {seller && (
            <span title={`Sold by ${seller.name}`} className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full border-2 border-surface text-base shadow-sm" style={{ background: `hsl(${seller.hue} 70% 90%)` }}>
              <span aria-hidden>{seller.emoji}</span><span className="sr-only">Sold by {seller.name}</span>
            </span>
          )}
        </Link>
        <HeartButton id={p.id} title={p.title} className="absolute right-3 top-3" />
      </div>
      <div className="space-y-0.5 px-1">
        <Link href={`/product/${p.id}`} className="line-clamp-1 text-sm font-medium tracking-tight hover:underline">{lang === "hi" ? p.titleHi : p.title}</Link>
        <div className="truncate text-xs text-muted">{seller?.name} · ★ {p.rating.toFixed(1)}{why?.[0] ? ` · ${why[0]}` : ""}</div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-semibold tabular-nums">{formatINR(p.price)}</span>
          <AddToCart id={p.id} stock={p.stock} compact />
        </div>
      </div>
    </article>
  );
}

/** Mirrors ProductCard (square photo, title, seller line, price row) so nothing jumps when real cards arrive. */
export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4" role="status" aria-label="Loading products">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3" aria-hidden>
          <div className="skeleton aspect-square rounded-xl" />
          <div className="space-y-2 px-1">
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-3 w-1/2" />
            <div className="flex items-center justify-between pt-1"><div className="skeleton h-5 w-16" /><div className="skeleton h-8 w-14 rounded-lg" /></div>
          </div>
        </div>
      ))}
    </div>
  );
}
