import { notFound } from "next/navigation";
import { MapPin, Star } from "lucide-react";
import { getSeller, liveProducts } from "@/lib/store";
import { getSession } from "@/lib/session";
import { ProductCard } from "@/components/product-card";
import { Badge, EmptyState } from "@/components/ui";

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = getSeller(id);
  const s = await getSession();
  if (!seller || (seller.status !== "active" && s.role === "customer")) notFound();
  const prods = liveProducts().filter((p) => p.sellerId === id);
  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center gap-4 rounded-3xl border border-line p-6" style={{ background: `linear-gradient(135deg, hsl(${seller.hue} 80% 94%), var(--surface))` }}>
        <span className="grid size-16 place-items-center rounded-2xl bg-surface text-4xl shadow-sm">{seller.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold">{seller.name}</h1>
          <p className="text-sm text-muted">{seller.tagline}</p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs"><Badge><MapPin className="size-3" />{seller.city}</Badge><Badge tone="ok"><Star className="size-3" />{seller.rating || "New"}</Badge><Badge tone="accent">{prods.length} products</Badge>{seller.status !== "active" && <Badge tone="warn">{seller.status}</Badge>}</div>
        </div>
      </section>
      {prods.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{prods.map((p) => <ProductCard key={p.id} p={p} lang={s.lang} />)}</div> : <EmptyState title="No products yet" hint="This store hasn't published anything." />}
    </div>
  );
}
