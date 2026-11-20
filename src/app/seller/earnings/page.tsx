import { CheckCircle2 } from "lucide-react";
import { db, sellerEarnings } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR, formatINRExact, bpsToPct } from "@/lib/money";
import { shortDate, shortId } from "@/lib/utils";
import { Badge, Card, EmptyState, PageHeader, Stat, StatusPill } from "@/components/ui";

export const metadata = { title: "Earnings" };
export default async function Earnings() {
  const s = await getSession();
  const d = db();
  const e = sellerEarnings(s.sellerId);
  const orders = d.orders.filter((o) => o.sellerId === s.sellerId && !["pending_payment", "cancelled"].includes(o.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const statement = orders.reduce((a, o) => a + (o.status === "refunded" ? 0 : o.payout), 0) - e.paidOut;
  const ok = statement === e.ledgerBalance;
  const payouts = d.payouts.filter((p) => p.sellerId === s.sellerId);
  return (
    <div className="space-y-6">
      <PageHeader title="Earnings & payouts" sub="Gross, platform fee and your payout for every order line." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Ready for payout" value={formatINR(e.available)} tone="ok" hint="delivered orders" />
        <Stat label="In escrow" value={formatINR(e.inEscrow)} hint="released after delivery" />
        <Stat label="Paid out" value={formatINR(e.paidOut)} hint={`${payouts.length} payouts (simulated)`} />
        <Stat label="Ledger balance" value={formatINRExact(e.ledgerBalance)} hint="what the platform owes you" />
      </div>
      <p className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${ok ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad"}`}><CheckCircle2 className="size-4" /> Statement total {formatINRExact(statement)} {ok ? "equals" : "DOES NOT equal"} your ledger balance {formatINRExact(e.ledgerBalance)}.</p>
      {!orders.length ? <EmptyState title="No earnings yet" /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase text-muted"><tr><th className="p-3">Order</th><th className="p-3">Item</th><th className="p-3 text-right">Gross</th><th className="p-3 text-right">Platform fee</th><th className="p-3 text-right">Your payout</th><th className="p-3">Status</th></tr></thead>
            <tbody className="divide-y divide-line">
              {orders.flatMap((o) => o.items.map((i, k) => (
                <tr key={o.id + i.productId} className={o.status === "refunded" ? "opacity-60" : ""}>
                  <td className="p-3">{k === 0 ? <>#{shortId(o.id)}<div className="text-xs text-muted">{shortDate(o.createdAt)}</div></> : ""}</td>
                  <td className="p-3">{i.qty}× {i.title}</td>
                  <td className="p-3 text-right tabular-nums">{formatINRExact(i.lineTotal)}</td>
                  <td className="p-3 text-right tabular-nums text-muted">−{formatINRExact(i.commission)} <span className="text-xs">({bpsToPct(i.commissionBps)})</span></td>
                  <td className="p-3 text-right font-medium tabular-nums">{formatINRExact(i.lineTotal - i.commission)}</td>
                  <td className="p-3">{k === 0 && <div className="flex flex-wrap gap-1"><StatusPill status={o.status} />{o.settled && <Badge tone="ok">paid out</Badge>}</div>}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
