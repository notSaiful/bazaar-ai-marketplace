import { notFound, redirect } from "next/navigation";
import { db, getSeller } from "@/lib/store";
import { PayPanel } from "@/components/pay-panel";
import { EmptyState, PageHeader, btn } from "@/components/ui";
import Link from "next/link";

export const metadata = { title: "Payment" };
export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const g = db().groups.find((x) => x.id === id);
  if (!g) notFound();
  if (g.status === "paid") redirect(`/orders/${id}`);
  if (g.status !== "pending_payment")
    return <EmptyState emoji="⏱️" title={g.status === "expired" ? "Payment window expired" : "Payment didn't go through"} hint="Your cart is still saved and the reserved stock was released. Start again from checkout." action={<Link href="/checkout" className={btn("primary")}>Back to checkout</Link>} />;
  const sellers = db().orders.filter((o) => o.groupId === id).map((o) => ({ name: getSeller(o.sellerId)?.name ?? "", amount: o.gross }));
  return <div><PageHeader title="Complete payment" sub="Step 2 of 2" /><PayPanel groupId={id} total={g.total} sellers={sellers} expiresAt={g.expiresAt} /></div>;
}
