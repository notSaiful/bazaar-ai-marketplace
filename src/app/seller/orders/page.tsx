import Link from "next/link";
import { db, NEXT } from "@/lib/store";
import { getSession } from "@/lib/session";
import { shortDate, shortId, cn } from "@/lib/utils";
import { fmtDate, t } from "@/lib/i18n";
import { advanceOrderAction } from "@/app/actions";
import { EmptyState, SplitBreakdown, StatusPill, btn } from "@/components/ui";
import { Flash } from "@/components/flash";

export async function generateMetadata() {
  const s = await getSession();
  return { title: t("nav.orders", s.lang) };
}
const TABS: [string, string, string[]][] = [["todo", "seller.orders.tab.todo", ["placed", "accepted", "packed"]], ["shipped", "seller.orders.tab.shipped", ["shipped"]], ["done", "seller.orders.tab.done", ["delivered", "refunded"]]];
const LABEL: Record<string, string> = { placed: "seller.orders.accept", accepted: "seller.orders.markPacked", packed: "seller.orders.markShipped", shipped: "seller.orders.markDelivered" };

export default async function SellerOrders({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const L = s.lang;
  const d = db();
  const tab = sp.tab ?? "todo";
  const statuses = TABS.find((x) => x[0] === tab)?.[2] ?? TABS[0][2];
  const orders = d.orders.filter((o) => o.sellerId === s.sellerId && statuses.includes(o.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const date = (iso: string) => (L === "hi" ? fmtDate(iso, L) : shortDate(iso));
  const itemTitle = (productId: string, title: string) => (L === "hi" ? d.products.find((p) => p.id === productId)?.titleHi || title : title);
  return (
    <div className="space-y-6">
      <Flash sp={sp} />
      <div className="flex gap-2">{TABS.map(([k, l]) => <Link key={k} href={`/seller/orders?tab=${k}`} className={cn("rounded-full border px-4 py-1.5 text-sm", tab === k ? "border-accent text-accent" : "border-line text-muted hover:text-fg")}>{t(l, L)}</Link>)}</div>
      {!orders.length ? <EmptyState emoji="📭" title={t("seller.orders.empty", L)} /> : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const g = d.groups.find((x) => x.id === o.groupId)!;
            const next = NEXT[o.status]?.[0];
            const bps = o.items[0]?.commissionBps;
            return (
              <li key={o.id} className="space-y-3 rounded-2xl border border-line p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><div className="font-medium">{o.items.map((i) => `${i.qty}× ${itemTitle(i.productId, i.title)}`).join(", ")}</div><div className="text-sm text-muted">#{shortId(o.id)} · {date(o.createdAt)} · {g.customerName}, {g.city}</div></div>
                  {next ? <form action={advanceOrderAction}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="to" value={next} /><button className={btn("primary")}>{t(LABEL[o.status], L)}</button></form> : <StatusPill status={o.status} lang={L} />}
                </div>
                <SplitBreakdown gross={o.gross} commission={o.commission} payout={o.payout} bps={bps} refunded={o.refunded} inline lang={L} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
