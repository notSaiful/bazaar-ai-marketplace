import Link from "next/link";
import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getProduct } from "@/lib/store";
import { getWishlistIds } from "@/lib/wishlist";
import { ProductCard } from "@/components/product-card";
import { EmptyState, PageHeader, btn } from "@/components/ui";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const s = await getSession();
  const items = (await getWishlistIds()).map((id) => getProduct(id)!);
  return (
    <div className="space-y-8">
      <PageHeader title="Wishlist" sub={items.length ? `${items.length} saved ${items.length === 1 ? "item" : "items"}` : undefined} />
      {items.length === 0 ? (
        <EmptyState emoji="♡" title="Nothing saved yet" hint="Tap the heart on any product to keep it here for later." action={<Link href="/search" className={btn("primary")}>Browse products</Link>} />
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} p={p} lang={s.lang} />)}</div>
      )}
    </div>
  );
}
