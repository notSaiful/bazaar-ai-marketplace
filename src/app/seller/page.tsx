import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { db, sellerEarnings, sellerSeries } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { shortId, shortDate } from "@/lib/utils";
import { setStockAction } from "@/app/actions";
import { Card, EmptyState, PageHeader, Stat, StatusPill, btn, inputCls } from "@/components/ui";
import { AreaChart } from "@/components/charts";
import { Flash } from "@/components/flash";

export const metadata = { title: "Seller overview" };
export default async function SellerHome({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const d = db();
  const today = new Date().toISOString().slice(0, 10);
  const orders = d.orders.filter((o) => o.sellerId === s.sellerId && !["pending_payment", "cancelled"].includes(o.status));
  const todays = orders.filter((o) => o.createdAt.slice(0, 10) === today);
  const e = sellerEarnings(s.sellerId);
  const mine = d.products.filter((p) => p.sellerId === s.sellerId && p.status !== "archived");
  const low = mine.filter((p) => p.status === "live" && p.stock <= p.lowStockThreshold).sort((a, b) => a.stock - b.stock);
  const series = sellerSeries(s.sellerId).map((x) => ({ label: shortDate(x.day), value: x.value }));
  const open = orders.filter((o) => ["placed", "accepted", "packed"].includes(o.status));
  // AI suggestion: restock fast movers (deterministic heuristic, shown with reason; apply = one click)
  const sold = new Map<string, number>();
  orders.forEach((o) => o.items.forEach((i) => sold.set(i.productId, (sold.get(i.productId) ?? 0) + i.qty)));
  const tip = low.map((p) => ({ p, sold: sold.get(p.id) ?? 0 })).sort((a, b) => b.sold - a.sold)[0];
  return (
    <div className="space-y-6">
      <PageHeader title="Overview" sub="Your store at a glance" action={<Link href="/seller/products/new" className={btn("primary")}>📸 Add product from photo</Link>} />
      <Flash sp={sp} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Orders today" value={todays.length} hint={`${open.length} awaiting fulfilment`} />
        <Stat label="Revenue (all time)" value={formatINR(e.gross)} hint={`after fee: ${formatINR(e.gross - e.commission)}`} />
        <Stat label="Low stock" value={low.length} tone={low.length ? "warn" : undefined} hint="at or below threshold" />
        <Stat label="Pending payouts" value={formatINR(e.available + e.inEscrow)} hint={`${formatINR(e.available)} ready · ${formatINR(e.inEscrow)} in escrow`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2"><h2 className="mb-2 font-semibold">Sales, last 7 days</h2><AreaChart data={series} label="Weekly sales" /></Card>
        <Card className="p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-accent" /> AI suggestion</h2>
          {tip ? (
            <form action={setStockAction} className="space-y-3 text-sm">
              <input type="hidden" name="id" value={tip.p.id} /><input type="hidden" name="_back" value="/seller" /><input type="hidden" name="stock" value={tip.p.stock + 20} />
              <p><b>{tip.p.title}</b> has {tip.p.stock} left{tip.sold ? ` and sold ${tip.sold} recently` : ""}. Restocking +20 avoids a sell-out this week.</p>
              <p className="text-xs text-muted">Why: low stock + sales velocity. You can edit before applying.</p>
              <button className={btn("primary", "sm")}>Apply: set stock to {tip.p.stock + 20}</button>
            </form>
          ) : <p className="text-sm text-muted">No restock needed right now. 🎉</p>}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-warn" /> Low-stock alerts</h2>
          {!low.length ? <EmptyState emoji="✅" title="All stocked up" /> : (
            <ul className="space-y-2">{low.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 text-sm">
                <Link href={`/seller/products/${p.id}`} className="truncate hover:underline">{p.title}</Link>
                <form action={setStockAction} className="flex items-center gap-1"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="_back" value="/seller" />
                  <label className="sr-only" htmlFor={`s-${p.id}`}>New stock for {p.title}</label><input id={`s-${p.id}`} name="stock" type="number" min={0} defaultValue={p.stock + 20} className={`${inputCls} h-8 w-20`} /><button className={btn("outline", "sm")}>Restock</button></form>
              </li>))}</ul>
          )}
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Orders to fulfil</h2><Link href="/seller/orders" className="text-sm text-accent">All orders</Link></div>
          {!open.length ? <EmptyState emoji="📭" title="Nothing waiting" hint="New orders appear here with a live notification." /> : (
            <ul className="space-y-2 text-sm">{open.slice(0, 5).map((o) => <li key={o.id} className="flex items-center justify-between"><span>#{shortId(o.id)} · {o.items.length} line(s) · {formatINR(o.payout)} payout</span><StatusPill status={o.status} /></li>)}</ul>
          )}
        </Card>
      </div>
    </div>
  );
}
