import { notFound } from "next/navigation";
import { getProduct, getSeller } from "@/lib/store";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { localizeMsg } from "@/lib/dict/seller";
import { ProductForm } from "@/components/product-form";
import { PageHeader, StatusPill } from "@/components/ui";
import { Flash } from "@/components/flash";

export async function generateMetadata() {
  const s = await getSession();
  return { title: t("seller.products.edit", s.lang) };
}
export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const s = await getSession();
  const p = getProduct(id);
  if (!p || p.sellerId !== s.sellerId) notFound();
  const seller = getSeller(s.sellerId)!;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("seller.products.edit", s.lang)} action={<StatusPill status={p.status} lang={s.lang} />} />
      <Flash sp={sp} />
      {p.flagReason && <p className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{t("seller.products.flagged", s.lang, { reason: localizeMsg(p.flagReason, s.lang) })}</p>}
      <ProductForm canPublish={seller.status === "active"} initial={{ id: p.id, title: p.title, titleHi: p.titleHi, description: p.description, descriptionHi: p.descriptionHi, category: p.category, tags: p.tags.join(", "), attributes: Object.entries(p.attributes).map(([k, v]) => `${k}: ${v}`).join("\n"), price: String(p.price / 100), mrp: String(p.mrp / 100), stock: String(p.stock), hue: p.hue, emoji: p.emoji, image: p.image, aiGenerated: p.aiGenerated }} />
    </div>
  );
}
