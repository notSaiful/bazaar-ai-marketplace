import { getSession } from "@/lib/session";
import { getSeller } from "@/lib/store";
import { ProductForm } from "@/components/product-form";
import { Flash } from "@/components/flash";

export const metadata = { title: "Add product" };
export default async function NewProduct({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const seller = getSeller(s.sellerId)!;
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Add a product</h1>
      <Flash sp={sp} />
      <ProductForm studio canPublish={seller.status === "active"} />
    </div>
  );
}
