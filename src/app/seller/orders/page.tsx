import Link from "next/link";
import { db, NEXT } from "@/lib/store";
import { getSession } from "@/lib/session";
import { shortDate, shortId, cn } from "@/lib/utils";
import { advanceOrderAction } from "@/app/actions";
import { EmptyState, SplitBreakdown, StatusPill, btn } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "Orders" };
const TABS: [string, string, string[]][] = [["todo", "To do", ["placed", "accepted", "packed"]], ["shipped", "Shipped", ["shipped"]], ["done", "Done", ["delivered", "refunded"]]];
const LABEL: Record<string, string> = { placed: "Accept", accepted: "Mark packed", packed: "Mark shipped", shipped: "Mark delivered" };

export default async function SellerOrders({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const d = db();
  const tab = sp.tab ?? "todo";
  const statuses = TABS.find((t) => t[0] === tab)?.[2] ?? TABS[0][2];
  const orders = d.orders.filter((o) => o.sellerId === s.sellerId && statuses.includes(o.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="space-y-6">
      <Flash sp={sp} />
      <div className="flex gap-2">{TABS.map(([k, l]) => <Link key={k} href={`/seller/orders?tab=${k}`} className={cn("rounded-full border px-4 py-1.5 text-sm", tab === k ? "border-accent text-accent" : "border-line text-muted hover:text-fg")}>{l}</Link>)}</div>
      {!orders.length ? <EmptyState emoji="📭" title="Nothing here" /> : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const g = d.groups.find((x) => x.id === o.groupId)!;
            const next = NEXT[o.status]?.[0];
            return (
              <li key={o.id} className="space-y-3 rounded-2xl border border-line p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="font-medium">{o.items.map((i) => `${i.qty}× ${i.title}`).join(", ")}</div><div className="text-sm text-muted">#{shortId(o.id)} · {shortDate(o.createdAt)} · {g.customerName}, {g.city}</div></div>
                  {next ? <form action={advanceOrderAction}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="to" value={next} /><button className={btn("primary")}>{LABEL[o.status]}</button></form> : <StatusPill status={o.status} />}
                </div>
                <SplitBreakdown inline gross={o.gross} commission={o.commission} payout={o.payout} bps={o.items[0]?.commissionBps} refunded={o.refunded} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
