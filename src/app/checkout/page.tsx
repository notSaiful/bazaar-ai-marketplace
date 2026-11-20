import { CheckoutForm } from "@/components/checkout";
import { PageHeader } from "@/components/ui";
export const metadata = { title: "Checkout" };
export default function CheckoutPage() {
  return <div><PageHeader title="Checkout" sub="Step 1 of 2 · delivery details" /><CheckoutForm /></div>;
}
