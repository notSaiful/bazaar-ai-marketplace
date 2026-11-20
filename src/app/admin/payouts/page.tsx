import { db, getSeller, sellerEarnings } from "@/lib/store";
import { formatINR, formatINRExact } from "@/lib/money";
import { shortDate } from "@/lib/utils";
import { payoutAction } from "@/app/actions";
import { Badge, Card, PageHeader, btn } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "Payouts" };
export default async function Payouts({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const d = db();
  return (
    <div className="space-y-6">
      <PageHeader title="Payouts" sub="Funds are released to sellers only after delivery." action={<Badge tone="accent">Route transfers simulated in test mode</Badge>} />
      <Flash sp={sp} />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase text-muted"><tr><th className="p-3">Seller</th><th className="p-3 text-right">Ready</th><th className="p-3 text-right">In escrow</th><th className="p-3 text-right">Paid out</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-line">
            {d.sellers.filter((s) => s.status !== "pending").map((s) => {
              const e = sellerEarnings(s.id);
              return <tr key={s.id}><td className="p-3 font-medium">{s.emoji} {s.name}</td><td className="p-3 text-right tabular-nums">{formatINR(e.available)}</td><td className="p-3 text-right tabular-nums text-muted">{formatINR(e.inEscrow)}</td><td className="p-3 text-right tabular-nums">{formatINR(e.paidOut)}</td><td className="p-3 text-right"><form action={payoutAction}><input type="hidden" name="id" value={s.id} /><button disabled={e.available <= 0} className={btn("primary", "sm")}>Run payout</button></form></td></tr>;
            })}
          </tbody>
        </table>
      </Card>
      <Card className="p-5"><h2 className="mb-2 font-semibold">Payout history</h2>
        {!d.payouts.length ? <p className="text-sm text-muted">No payouts yet.</p> : <ul className="space-y-1 text-sm">{[...d.payouts].reverse().map((p) => <li key={p.id} className="flex justify-between"><span>{getSeller(p.sellerId)?.name} · {shortDate(p.createdAt)} · <Badge>simulated Route transfer</Badge></span><span className="tabular-nums">{formatINRExact(p.amount)}</span></li>)}</ul>}
      </Card>
    </div>
  );
}
