import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db, getSeller } from "@/lib/store";
import { razorpayConfigured } from "@/lib/razorpay";
import { PayPanel } from "@/components/pay-panel";
import { EmptyState, PageHeader, btn } from "@/components/ui";

export const metadata = { title: "Pay" };
export default async function PayPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ c?: string }> }) {
  const { id } = await params;
  const g = db().groups.find((x) => x.id === id);
  if (!g) {
    // Agent pay links carry a signed claim; adopt it into this visitor's session via the claim route.
    const c = (await searchParams).c;
    if (c) redirect(`/api/claim?c=${encodeURIComponent(c)}`);
    notFound();
  }
  if (g.status === "paid") redirect(`/orders/${id}`);
  if (g.status !== "pending_payment")
    return <EmptyState emoji="⏱️" title={g.status === "expired" ? "Payment window expired" : "Payment didn't go through"} hint="Your cart is saved. Start again from checkout." action={<Link href="/checkout" className={btn("primary")}>Back to checkout</Link>} />;
  const sellers = db().orders.filter((o) => o.groupId === id).map((o) => ({ name: getSeller(o.sellerId)?.name ?? "", amount: o.gross }));
  const rz = razorpayConfigured() && g.razorpayOrderId ? { keyId: process.env.RAZORPAY_KEY_ID!, orderId: g.razorpayOrderId } : undefined;
  return <div className="space-y-8"><PageHeader title="Payment" /><PayPanel groupId={id} total={g.total} sellers={sellers} razorpay={rz} /></div>;
}
