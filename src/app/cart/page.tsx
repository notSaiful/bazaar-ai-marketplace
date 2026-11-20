import { CartPageClient } from "@/components/checkout";
import { PageHeader } from "@/components/ui";
export const metadata = { title: "Cart" };
export default function CartPage() {
  return <div className="space-y-8"><PageHeader title="Cart" /><CartPageClient /></div>;
}
