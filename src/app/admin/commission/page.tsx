import { db } from "@/lib/store";
import { bpsToPct } from "@/lib/money";
import { setCommissionAction } from "@/app/actions";
import { Card, PageHeader, btn, inputCls } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "Commission" };
export default async function Commission({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const d = db();
  return (
    <div className="space-y-6">
      <PageHeader title="Commission settings" sub="Rate is stored per seller and snapshotted on every order line. A change affects future orders only." />
      <Flash sp={sp} />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase text-muted"><tr><th className="p-3">Seller</th><th className="p-3">Current rate</th><th className="p-3">Set new rate (%)</th></tr></thead>
          <tbody className="divide-y divide-line">
            {d.sellers.map((s) => (
              <tr key={s.id}>
                <td className="p-3 font-medium">{s.emoji} {s.name}</td>
                <td className="p-3 tabular-nums">{bpsToPct(s.commissionBps)}</td>
                <td className="p-3"><form action={setCommissionAction} className="flex items-center gap-2"><input type="hidden" name="id" value={s.id} /><label className="sr-only" htmlFor={`c-${s.id}`}>Rate for {s.name}</label><input id={`c-${s.id}`} name="pct" type="number" step="0.5" min={0} max={50} defaultValue={s.commissionBps / 100} className={`${inputCls} h-9 w-24`} /><button className={btn("outline", "sm")}>Save</button></form></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card className="p-5 text-sm text-muted"><b className="text-fg">Rounding rule:</b> commission = round-half-up(line total × rate) per line, in integer paise. Example: ₹1,299 at 10% = ₹129.90. Gateway fees are not deducted (open question Q-08).</Card>
    </div>
  );
}
