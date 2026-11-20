import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { db, getSeller } from "@/lib/store";
import { formatINR } from "@/lib/money";
import { shortDate, shortId, cn } from "@/lib/utils";
import { Card, PageHeader, SplitBreakdown, StatusPill } from "@/components/ui";
import { OrderPoller } from "@/components/order-poller";
import type { OrderStatus } from "@/lib/types";

const STEPS: OrderStatus[] = ["placed", "accepted", "packed", "shipped", "delivered"];
export const metadata = { title: "Order" };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { id } = await params;
  const { paid } = await searchParams;
  const d = db();
  const g = d.groups.find((x) => x.id === id);
  if (!g) notFound();
  const orders = d.orders.filter((o) => o.groupId === id);
  return (
    <div className="space-y-8">
      <OrderPoller />
      {paid && (
        <div className="pop flex items-center gap-3 rounded-2xl border border-ok/40 bg-ok/10 p-4"><PartyPopper className="size-6 text-ok" /><div><div className="font-semibold">Paid {formatINR(g.total)}</div><div className="text-sm text-muted">{orders.length} order{orders.length > 1 ? "s" : ""}, one per seller.</div></div></div>
      )}
      <PageHeader title={`Order #${shortId(g.id)}`} sub={`${shortDate(g.createdAt)} · ${g.address}, ${g.city} ${g.pincode}`} />
      {g.status !== "paid" && <p className="rounded-xl bg-warn/15 p-3 text-sm text-warn">This order group is {g.status.replace("_", " ")}.</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map((o) => {
          const seller = getSeller(o.sellerId);
          const idx = STEPS.indexOf(o.status);
          return (
            <Card key={o.id} className="space-y-4 p-6">
              <div className="flex items-center justify-between"><div><div className="font-semibold">{seller?.name}</div><div className="text-xs text-muted">from {seller?.city}</div></div><StatusPill status={o.status} /></div>
              <ul className="space-y-1 text-sm">{o.items.map((i) => <li key={i.productId} className="flex justify-between"><span>{i.qty}× <Link href={`/product/${i.productId}`} className="hover:underline">{i.title}</Link></span><span className="tabular-nums">{formatINR(i.lineTotal)}</span></li>)}</ul>
              {["refunded", "cancelled"].includes(o.status) ? (
                <p className="text-sm text-bad">{o.tracking[o.tracking.length - 1]?.note}</p>
              ) : (
                <ol className="flex items-center justify-between" aria-label="Fulfilment progress">
                  {STEPS.map((st, i) => (
                    <li key={st} className="flex flex-1 flex-col items-center gap-1 text-center text-[11px]">
                      {i <= idx ? <CheckCircle2 className="size-5 text-ok" /> : <Circle className="size-5 text-line" />}
                      <span className={cn("capitalize", i <= idx ? "font-medium" : "text-muted")}>{st}</span>
                    </li>
                  ))}
                </ol>
              )}
              <details className="text-xs text-muted"><summary className="cursor-pointer">Tracking history</summary><ul className="mt-1 space-y-0.5">{o.tracking.map((t, i) => <li key={i}>{new Date(t.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {t.status.replace("_", " ")}{t.note ? ` · ${t.note}` : ""}</li>)}</ul></details>
              <SplitBreakdown inline gross={o.gross} commission={o.commission} payout={o.payout} bps={o.items[0]?.commissionBps} refunded={o.refunded} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
