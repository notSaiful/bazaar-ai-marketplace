import { getSession } from "@/lib/session";
import { getSeller } from "@/lib/store";
import { aiMode } from "@/lib/ai";
import { ProductForm } from "@/components/product-form";
import { Badge, PageHeader } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "Add product from photo" };
export default async function NewProduct({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const seller = getSeller(s.sellerId)!;
  return (
    <div>
      <PageHeader title="Add a product from a photo" sub="Upload a photo → review the AI draft → publish. Target: under 90 seconds." action={<Badge tone="accent">AI: {aiMode()}</Badge>} />
      <Flash sp={sp} />
      <ProductForm studio canPublish={seller.status === "active"} />
    </div>
  );
}
