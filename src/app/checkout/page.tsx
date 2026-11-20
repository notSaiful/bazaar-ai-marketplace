import { CheckoutForm } from "@/components/checkout";
import { PageHeader } from "@/components/ui";
export const metadata = { title: "Checkout" };
export default function CheckoutPage() {
  return <div className="space-y-8"><PageHeader title="Delivery details" /><CheckoutForm /></div>;
}
