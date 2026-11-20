import Link from "next/link";
import type { Product } from "@/lib/types";
import { getSeller } from "@/lib/store";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { AddToCart } from "./cart";
import { ProductArt } from "./ui";

export function ProductCard({ p, lang = "en", why }: { p: Product; lang?: "en" | "hi"; why?: string[] }) {
  const seller = getSeller(p.sellerId);
  return (
    <article className="group flex flex-col gap-3">
      <Link href={`/product/${p.id}`} className="relative block overflow-hidden rounded-2xl border border-line" aria-label={p.title}>
        <ProductArt src={artUrl(p)} alt={p.title} className="transition duration-300 group-hover:scale-105" />
        {p.stock > 0 && p.stock <= 5 && <span className="absolute left-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-xs text-warn">Only {p.stock} left</span>}
        {p.stock < 1 && <span className="absolute left-2 top-2 rounded-full bg-surface/90 px-2 py-0.5 text-xs text-bad">Sold out</span>}
      </Link>
      <div className="space-y-0.5">
        <Link href={`/product/${p.id}`} className="line-clamp-1 text-sm font-medium hover:underline">{lang === "hi" ? p.titleHi : p.title}</Link>
        <div className="truncate text-xs text-muted">{seller?.name}{why?.[0] ? ` · ${why[0]}` : ""}</div>
        <div className="flex items-center justify-between pt-1">
          <span className="font-semibold tabular-nums">{formatINR(p.price)}</span>
          <AddToCart id={p.id} stock={p.stock} compact />
        </div>
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{Array.from({ length: n }).map((_, i) => <div key={i} className="skeleton aspect-[3/4]" />)}</div>;
}
