import { db, getSeller } from "@/lib/store";
import { shortDate, shortId } from "@/lib/utils";
import { refundAction } from "@/app/actions";
import { SplitBreakdown, StatusPill, btn } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "Orders" };
export default async function AdminOrders({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const d = db();
  const orders = [...d.orders].filter((o) => o.status !== "pending_payment").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="space-y-6">
      <Flash sp={sp} />
      <div><h1 className="text-xl font-semibold">Orders</h1><p className="text-sm text-muted">A refund returns the money to the buyer and reverses the platform fee and the seller&apos;s payout.</p></div>
      <ul className="space-y-4">
        {orders.map((o) => {
          const g = d.groups.find((x) => x.id === o.groupId)!;
          const refundable = ["placed", "accepted", "packed", "shipped", "delivered"].includes(o.status);
          return (
            <li key={o.id} className="space-y-2 rounded-2xl border border-line p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><div className="font-medium">{o.items.map((i) => `${i.qty}× ${i.title}`).join(", ")}</div><div className="text-sm text-muted">#{shortId(o.id)} · {shortDate(o.createdAt)} · {g.customerName} → {getSeller(o.sellerId)?.name}</div></div>
                <div className="flex items-center gap-3"><StatusPill status={o.status} />{refundable && <form action={refundAction}><input type="hidden" name="id" value={o.id} /><button className={btn("outline", "sm")}>Refund</button></form>}</div>
              </div>
              <SplitBreakdown inline gross={o.gross} commission={o.commission} payout={o.payout} bps={o.items[0]?.commissionBps} refunded={o.refunded} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
