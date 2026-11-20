import { CartPageClient } from "@/components/checkout";
import { PageHeader } from "@/components/ui";
export const metadata = { title: "Cart" };
export default function CartPage() {
  return <div><PageHeader title="Your cart" sub="Grouped by seller. One payment covers everything." /><CartPageClient /></div>;
}
