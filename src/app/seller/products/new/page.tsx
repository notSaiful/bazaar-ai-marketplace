import { getSession } from "@/lib/session";
import { getSeller } from "@/lib/store";
import { t } from "@/lib/i18n";
import { ProductForm } from "@/components/product-form";
import { Flash } from "@/components/flash";

export async function generateMetadata() {
  const s = await getSession();
  return { title: t("seller.products.addMeta", s.lang) };
}
export default async function NewProduct({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const seller = getSeller(s.sellerId)!;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h2 className="text-xl font-semibold">{t("seller.products.addTitle", s.lang)}</h2>
      <Flash sp={sp} />
      <ProductForm studio canPublish={seller.status === "active"} />
    </div>
  );
}
