import { notFound } from "next/navigation";
import { getSeller, liveProducts } from "@/lib/store";
import { getSession } from "@/lib/session";
import { ProductCard } from "@/components/product-card";
import { EmptyState } from "@/components/ui";

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = getSeller(id);
  const s = await getSession();
  if (!seller || (seller.status !== "active" && s.role === "customer")) notFound();
  const prods = liveProducts().filter((p) => p.sellerId === id);
  return (
    <div className="space-y-8">
      <header><h1 className="text-3xl font-semibold tracking-tight">{seller.name}</h1><p className="mt-1 text-muted">{seller.tagline} · {seller.city}</p></header>
      {prods.length ? <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">{prods.map((p) => <ProductCard key={p.id} p={p} lang={s.lang} />)}</div> : <EmptyState title="No products yet" />}
    </div>
  );
}
