import Link from "next/link";
import { ShieldAlert, CheckCircle2 } from "lucide-react";
import { analytics, anomalies, db, reconciliation } from "@/lib/store";
import { formatINR, formatINRExact } from "@/lib/money";
import { shortDate } from "@/lib/utils";
import { resetDemoAction } from "@/app/actions";
import { AreaChart, Donut, HBars } from "@/components/charts";
import { Badge, Card, EmptyState, PageHeader, Stat, btn } from "@/components/ui";
import { SellerActions, ProductActions } from "@/components/admin-actions";
import { Copilot } from "@/components/copilot";
import { Flash } from "@/components/flash";

export const metadata = { title: "Admin dashboard" };
export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const a = analytics();
  const d = db();
  const rec = reconciliation();
  const pending = d.sellers.filter((s) => s.status === "pending");
  const flagged = anomalies();
  const half = Math.floor(a.days.length / 2);
  const cur = a.days.slice(half).reduce((x, y) => x + y.gmv, 0), prev = a.days.slice(0, half).reduce((x, y) => x + y.gmv, 0);
  const trend = prev ? Math.round(((cur - prev) / prev) * 100) : 0;
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" sub="Every number below is derived from the ledger." action={<form action={resetDemoAction}><button className={btn("outline", "sm")}>Reset demo data</button></form>} />
      <Flash sp={sp} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="GMV" value={formatINR(a.gmv)} hint={<span className={trend >= 0 ? "text-ok" : "text-bad"}>{trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs prior 7 days</span>} />
        <Stat label="Commission earned" value={formatINR(a.commission)} hint={`${((a.commission / Math.max(1, a.gmv)) * 100).toFixed(1)}% effective, net of reversals`} />
        <Stat label="Refunded" value={formatINR(a.refunded)} tone={a.refunded ? "warn" : undefined} hint={`net GMV ${formatINR(a.netGmv)}`} />
        <Stat label="Orders · AOV" value={`${a.orders} · ${formatINR(a.aov)}`} hint="seller orders, paid" />
      </div>
      <Link href="/admin/ledger" className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm ${rec.diff === 0 ? "bg-ok/10 text-ok" : "bg-bad/10 text-bad"}`}><CheckCircle2 className="size-4" /> Ledger reconciliation: debits − credits = <b>{formatINRExact(rec.diff)}</b> across {rec.events} events ({rec.unbalancedEvents} unbalanced)</Link>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2"><h2 className="mb-2 font-semibold">GMV, last 14 days</h2><AreaChart data={a.days.map((x) => ({ label: shortDate(x.day), value: x.gmv }))} label="Daily GMV" /></Card>
        <Card className="p-5"><h2 className="mb-3 font-semibold">Category mix</h2><Donut data={a.categories.map((c) => ({ label: c.category, value: c.value }))} /></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5"><h2 className="mb-3 font-semibold">Top sellers by GMV</h2><HBars data={a.bySeller.map((s) => ({ label: s.name, value: s.gmv, sub: `${s.orders} orders` }))} /></Card>
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Approvals queue</h2>
          {!pending.length && !flagged.length ? <EmptyState emoji="✅" title="Nothing waiting" /> : (
            <ul className="space-y-3 text-sm">
              {pending.map((s) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-2"><span><b>{s.name}</b> <Badge tone="warn">seller pending</Badge><div className="text-xs text-muted">{s.city} · bank ••••{s.bankLast4}</div></span><SellerActions id={s.id} status={s.status} back="/admin" /></li>)}
              {flagged.filter((f) => f.kind === "listing").map((f) => <li key={f.id} className="space-y-1"><div><b>{f.target}</b> <Badge tone="bad">listing flagged</Badge></div><div className="text-xs text-muted">{f.reason}</div><ProductActions id={f.productId!} back="/admin" /></li>)}
            </ul>
          )}
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><ShieldAlert className="size-4 text-bad" /> Fraud & review anomalies</h2>
          {!flagged.length ? <p className="text-sm text-muted">No anomalies.</p> : <ul className="space-y-2 text-sm">{flagged.map((f) => <li key={f.id} className="rounded-xl bg-surface2 p-3"><div className="flex items-center justify-between"><b>{f.target}</b><Badge tone="bad">{f.kind}</Badge></div><div className="mt-1 text-xs text-muted">Why flagged: {f.reason}</div></li>)}</ul>}
        </Card>
        <Copilot />
      </div>
    </div>
  );
}
