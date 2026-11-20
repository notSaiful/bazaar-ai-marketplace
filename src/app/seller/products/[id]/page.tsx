import { notFound } from "next/navigation";
import { getProduct, getSeller } from "@/lib/store";
import { getSession } from "@/lib/session";
import { ProductForm } from "@/components/product-form";
import { PageHeader, StatusPill } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "Edit product" };
export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const s = await getSession();
  const p = getProduct(id);
  if (!p || p.sellerId !== s.sellerId) notFound();
  const seller = getSeller(s.sellerId)!;
  return (
    <div>
      <PageHeader title="Edit product" sub={p.id} action={<StatusPill status={p.status} />} />
      <Flash sp={sp} />
      {p.flagReason && <p className="mb-4 rounded-xl bg-bad/15 px-4 py-3 text-sm text-bad">Flagged: {p.flagReason}</p>}
      <ProductForm canPublish={seller.status === "active"} initial={{ id: p.id, title: p.title, titleHi: p.titleHi, description: p.description, descriptionHi: p.descriptionHi, category: p.category, tags: p.tags.join(", "), attributes: Object.entries(p.attributes).map(([k, v]) => `${k}: ${v}`).join("\n"), price: String(p.price / 100), mrp: String(p.mrp / 100), stock: String(p.stock), hue: p.hue, emoji: p.emoji, image: p.image, aiGenerated: p.aiGenerated }} />
    </div>
  );
}
