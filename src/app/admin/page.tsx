import Link from "next/link";
import { analytics, anomalies, db, reconciliation } from "@/lib/store";
import { formatINR, formatINRExact } from "@/lib/money";
import { shortDate } from "@/lib/utils";
import { ResetButton } from "@/components/reset-button";
import { AreaChart, HBars } from "@/components/charts";
import { SellerActions, ProductActions } from "@/components/admin-actions";
import { Copilot } from "@/components/copilot";
import { Flash } from "@/components/flash";

export const metadata = { title: "Admin" };
export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const a = analytics();
  const d = db();
  const rec = reconciliation();
  const pending = d.sellers.filter((s) => s.status === "pending");
  const flagged = anomalies().filter((f) => f.kind === "listing");
  const attention = pending.length + flagged.length;
  const tile = "rounded-2xl border border-line p-6";
  return (
    <div className="space-y-12">
      <Flash sp={sp} />
      <section className="space-y-4" aria-labelledby="att">
        <h2 id="att" className="text-xl font-semibold">{attention ? `Needs your attention (${attention})` : "All clear"}</h2>
        {attention === 0 && <p className="text-muted">No shops or listings are waiting for review.</p>}
        <ul className="space-y-3">
          {pending.map((s) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-5"><div><div className="font-medium">{s.name}</div><div className="text-sm text-muted">New shop in {s.city} wants to start selling</div></div><SellerActions id={s.id} status={s.status} back="/admin" /></li>)}
          {flagged.map((f) => <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-5"><div className="min-w-0"><div className="font-medium">{f.target}</div><div className="max-w-xl text-sm text-muted">Flagged: {f.reason}</div></div><ProductActions id={f.productId!} /></li>)}
        </ul>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className={tile}><div className="text-sm text-muted">Sales (GMV)</div><div className="mt-1 text-3xl font-semibold tabular-nums">{formatINR(a.gmv)}</div></div>
        <div className={tile}><div className="text-sm text-muted">Commission earned</div><div className="mt-1 text-3xl font-semibold tabular-nums">{formatINR(a.commission)}</div></div>
        <div className={tile}><div className="text-sm text-muted">Orders</div><div className="mt-1 text-3xl font-semibold">{a.orders}</div></div>
      </section>
      <section className="space-y-4"><h2 className="text-xl font-semibold">Sales, last 14 days</h2><AreaChart data={a.days.map((x) => ({ label: shortDate(x.day), value: x.gmv }))} label="Daily sales" /></section>
      <section className="space-y-4"><h2 className="text-xl font-semibold">Top sellers</h2><HBars data={a.bySeller.map((s) => ({ label: s.name, value: s.gmv }))} /></section>
      <details className="rounded-2xl border border-line p-5"><summary className="cursor-pointer font-medium">Ask a question about the numbers</summary><div className="mt-4"><Copilot /></div></details>
      <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <Link href="/admin/ledger">Books balance: difference {formatINRExact(rec.diff)}</Link>
        <span>Demo data is private to your browser</span>
        <ResetButton />
      </footer>
    </div>
  );
}
