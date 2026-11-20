import { db, getSeller } from "@/lib/store";
import { formatINR } from "@/lib/money";
import { shortDate, shortId } from "@/lib/utils";
import { refundAction } from "@/app/actions";
import { Card, PageHeader, SplitBreakdown, StatusPill, btn } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "All orders" };
export default async function AdminOrders({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const d = db();
  const orders = [...d.orders].filter((o) => o.status !== "pending_payment").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader title="All orders" sub={`${orders.length} seller orders. Refunds reverse commission and payout in the ledger.`} />
      <Flash sp={sp} />
      <div className="space-y-3">
        {orders.map((o) => {
          const g = d.groups.find((x) => x.id === o.groupId)!;
          const refundable = ["placed", "accepted", "packed", "shipped", "delivered"].includes(o.status);
          return (
            <Card key={o.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div><div className="font-semibold">#{shortId(o.id)} <span className="font-normal text-muted">· {shortDate(o.createdAt)} · {g.customerName} → {getSeller(o.sellerId)?.name} · {g.source}</span></div><div className="text-xs text-muted">{o.items.map((i) => `${i.qty}× ${i.title}`).join(", ")} · group #{shortId(g.id)} · {formatINR(g.total)} paid in total</div></div>
                <div className="flex items-center gap-2"><StatusPill status={o.status} />{refundable && <form action={refundAction}><input type="hidden" name="id" value={o.id} /><button className={btn("outline", "sm")}>Refund</button></form>}</div>
              </div>
              <SplitBreakdown gross={o.gross} commission={o.commission} payout={o.payout} bps={o.items[0]?.commissionBps} refunded={o.refunded} compact />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
