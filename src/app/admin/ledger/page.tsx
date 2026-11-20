import { CheckCircle2, XCircle } from "lucide-react";
import { db, reconciliation } from "@/lib/store";
import { formatINRExact } from "@/lib/money";
import { webhookLog } from "@/lib/webhook";
import { replayWebhookAction } from "@/app/actions";
import { Card, PageHeader, btn } from "@/components/ui";
import { Flash } from "@/components/flash";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Ledger" };
export default async function Ledger({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const r = reconciliation();
  const d = db();
  const recent = [...d.ledger].reverse().slice(0, 30);
  const ok = r.diff === 0 && r.unbalancedEvents === 0;
  return (
    <div className="space-y-6">
      <PageHeader title="Ledger & reconciliation" sub="Double-entry, integer paise. Every event's debits equal its credits." />
      <Flash sp={sp} />
      <Card className={`flex flex-wrap items-center gap-4 p-5 ${ok ? "border-ok/40" : "border-bad/40"}`}>
        {ok ? <CheckCircle2 className="size-8 text-ok" /> : <XCircle className="size-8 text-bad" />}
        <div className="flex-1"><div className="text-sm text-muted">Total debits − total credits</div><div className="text-3xl font-bold tabular-nums">{formatINRExact(r.diff)}</div></div>
        <dl className="grid grid-cols-3 gap-6 text-sm"><div><dt className="text-muted">Debits</dt><dd className="font-semibold tabular-nums">{formatINRExact(r.debit)}</dd></div><div><dt className="text-muted">Credits</dt><dd className="font-semibold tabular-nums">{formatINRExact(r.credit)}</dd></div><div><dt className="text-muted">Events</dt><dd className="font-semibold">{r.events} ({r.unbalancedEvents} unbalanced)</dd></div></dl>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="overflow-x-auto p-5"><h2 className="mb-2 font-semibold">Account balances</h2>
          <table className="w-full text-sm"><thead className="text-left text-xs uppercase text-muted"><tr><th className="py-1">Account</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead><tbody className="divide-y divide-line">{r.accounts.map((a) => <tr key={a.account}><td className="py-1.5 font-mono text-xs">{a.account.replace("seller_payable:", "payable:")}</td><td className="text-right tabular-nums">{formatINRExact(a.debit)}</td><td className="text-right tabular-nums">{formatINRExact(a.credit)}</td></tr>)}</tbody></table>
        </Card>
        <Card className="p-5"><div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">Webhook log (idempotency)</h2><form action={replayWebhookAction}><button className={btn("outline", "sm")}>Replay last webhook</button></form></div>
          {!webhookLog().length ? <p className="text-sm text-muted">No webhooks yet. Complete a test payment, then replay it here to see that no duplicate is created.</p> : <ul className="space-y-1 text-xs">{webhookLog().slice(0, 8).map((w, i) => <li key={i} className="flex justify-between gap-2"><span className="font-mono">{w.event} {w.paymentId}</span><span className="text-muted">{w.result} · {timeAgo(w.at)}</span></li>)}</ul>}
        </Card>
      </div>
      <Card className="overflow-x-auto p-5"><h2 className="mb-2 font-semibold">Latest entries</h2>
        <table className="w-full min-w-[640px] text-xs"><thead className="text-left uppercase text-muted"><tr><th className="py-1">Event</th><th>Account</th><th className="text-right">Debit</th><th className="text-right">Credit</th><th className="pl-3">Memo</th></tr></thead><tbody className="divide-y divide-line">{recent.map((e) => <tr key={e.id}><td className="py-1.5 font-mono">{e.eventType}</td><td className="font-mono">{e.account.replace("seller_payable:", "payable:")}</td><td className="text-right tabular-nums">{e.debit ? formatINRExact(e.debit) : ""}</td><td className="text-right tabular-nums">{e.credit ? formatINRExact(e.credit) : ""}</td><td className="pl-3 text-muted">{e.memo}</td></tr>)}</tbody></table>
      </Card>
    </div>
  );
}
