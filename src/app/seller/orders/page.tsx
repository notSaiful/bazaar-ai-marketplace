import Link from "next/link";
import { db, NEXT } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { shortDate, shortId, cn } from "@/lib/utils";
import { advanceOrderAction } from "@/app/actions";
import { Card, EmptyState, PageHeader, SplitBreakdown, StatusPill, btn } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "Orders" };
const FILTERS = ["all", "placed", "accepted", "packed", "shipped", "delivered", "refunded"];
export default async function SellerOrders({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const d = db();
  const f = sp.status ?? "all";
  const orders = d.orders.filter((o) => o.sellerId === s.sellerId && !["pending_payment", "cancelled"].includes(o.status) && (f === "all" || o.status === f)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader title="Orders" sub="Move each order through accepted → packed → shipped → delivered. Invalid jumps are rejected." />
      <Flash sp={sp} />
      <div className="mb-4 flex gap-2 overflow-x-auto">{FILTERS.map((x) => <Link key={x} href={x === "all" ? "/seller/orders" : `/seller/orders?status=${x}`} className={cn("rounded-full border px-3 py-1 text-sm capitalize", f === x ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface")}>{x}</Link>)}</div>
      {!orders.length ? <EmptyState emoji="📭" title="No orders in this view" /> : (
        <div className="space-y-3">
          {orders.map((o) => {
            const g = d.groups.find((x) => x.id === o.groupId)!;
            const next = NEXT[o.status]?.[0];
            return (
              <Card key={o.id} className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div><div className="font-semibold">#{shortId(o.id)} <span className="font-normal text-muted">· {shortDate(o.createdAt)} · {g.customerName}, {g.city}</span></div><div className="text-sm text-muted">{o.items.map((i) => `${i.qty}× ${i.title}`).join(", ")}</div></div>
                  <div className="flex items-center gap-2"><StatusPill status={o.status} />{next && <form action={advanceOrderAction}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="to" value={next} /><button className={btn("primary", "sm")}>Mark {next}</button></form>}</div>
                </div>
                <SplitBreakdown gross={o.gross} commission={o.commission} payout={o.payout} bps={o.items[0]?.commissionBps} refunded={o.refunded} compact />
                {o.status === "delivered" && <p className="text-xs text-muted">{o.settled ? "Paid out to your bank." : "Delivered: eligible for the next payout."}</p>}
                <p className="text-xs text-muted">Order total {formatINR(o.gross)}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
