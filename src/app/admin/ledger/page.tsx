import { db, getSeller, reconciliation, sellerEarnings } from "@/lib/store";
import { formatINR, formatINRExact } from "@/lib/money";
import { webhookLog } from "@/lib/webhook";
import { payoutAction, replayWebhookAction } from "@/app/actions";
import { btn } from "@/components/ui";
import { Flash } from "@/components/flash";
import { shortDate, timeAgo } from "@/lib/utils";

export const metadata = { title: "Money" };
export default async function Ledger({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const r = reconciliation();
  const d = db();
  const ok = r.diff === 0 && r.unbalancedEvents === 0;
  const recent = [...d.ledger].reverse().slice(0, 20);
  const sellers = d.sellers.filter((s) => s.status !== "pending").map((s) => ({ s, e: sellerEarnings(s.id) }));
  return (
    <div className="space-y-12">
      <Flash sp={sp} />
      <section className="space-y-2">
        <div className="text-sm text-muted">Debits minus credits</div>
        <div className={`text-5xl font-semibold tabular-nums ${ok ? "text-ok" : "text-bad"}`}>{formatINRExact(r.diff)}</div>
        <p className="text-sm text-muted">{ok ? "The books balance" : "The books do NOT balance"} across {r.events} recorded events.</p>
      </section>
      <section className="space-y-4">
        <div><h2 className="text-xl font-semibold">Payouts</h2><p className="text-sm text-muted">Sellers are paid after delivery. Transfers are simulated in test mode.</p></div>
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {sellers.map(({ s, e }) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
              <div><div className="font-medium">{s.name}</div><div className="text-sm text-muted tabular-nums">{formatINR(e.available)} ready · {formatINR(e.inEscrow)} waiting for delivery · {formatINR(e.paidOut)} paid</div></div>
              <form action={payoutAction}><input type="hidden" name="id" value={s.id} /><button disabled={e.available <= 0} className={btn("primary", "sm")}>Pay out {formatINR(e.available)}</button></form>
            </li>
          ))}
        </ul>
        {d.payouts.length > 0 && <p className="text-sm text-muted">Last payout: {getSeller([...d.payouts].reverse()[0].sellerId)?.name}, {shortDate([...d.payouts].reverse()[0].createdAt)}.</p>}
      </section>
      <details className="rounded-2xl border border-line p-5">
        <summary className="cursor-pointer font-medium">Technical detail: ledger entries and webhooks</summary>
        <div className="mt-5 space-y-8">
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-muted"><tr><th className="py-1">Account</th><th className="text-right">Debit</th><th className="text-right">Credit</th></tr></thead><tbody className="divide-y divide-line">{r.accounts.map((a) => <tr key={a.account}><td className="py-1.5 font-mono text-xs">{a.account.replace("seller_payable:", "payable:")}</td><td className="text-right tabular-nums">{formatINRExact(a.debit)}</td><td className="text-right tabular-nums">{formatINRExact(a.credit)}</td></tr>)}</tbody></table></div>
          <div className="space-y-2"><div className="flex items-center justify-between"><h3 className="font-medium">Payment webhooks</h3><form action={replayWebhookAction}><button className={btn("outline", "sm")}>Replay last webhook</button></form></div>
            {!webhookLog().length ? <p className="text-sm text-muted">None yet. Complete a test payment, then replay it here: no duplicate order is created.</p> : <ul className="space-y-1 text-xs">{webhookLog().slice(0, 6).map((w, i) => <li key={i} className="flex justify-between gap-2"><span className="font-mono">{w.event} {w.paymentId}</span><span className="text-muted">{w.result} · {timeAgo(w.at)}</span></li>)}</ul>}</div>
          <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-xs"><tbody className="divide-y divide-line">{recent.map((e) => <tr key={e.id}><td className="py-1.5 font-mono">{e.eventType}</td><td className="font-mono">{e.account.replace("seller_payable:", "payable:")}</td><td className="text-right tabular-nums">{e.debit ? formatINRExact(e.debit) : ""}</td><td className="text-right tabular-nums">{e.credit ? formatINRExact(e.credit) : ""}</td></tr>)}</tbody></table></div>
        </div>
      </details>
    </div>
  );
}
