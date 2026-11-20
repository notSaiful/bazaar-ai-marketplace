import { db } from "@/lib/store";
import { setCommissionAction } from "@/app/actions";
import { StatusPill, btn, inputCls } from "@/components/ui";
import { SellerActions } from "@/components/admin-actions";
import { Flash } from "@/components/flash";

export const metadata = { title: "Sellers" };
export default async function Sellers({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const d = db();
  const sellers = [...d.sellers].sort((a, b) => (a.status === "pending" ? -1 : 0) - (b.status === "pending" ? -1 : 0));
  return (
    <div className="space-y-6">
      <Flash sp={sp} />
      <div><h1 className="text-xl font-semibold">Sellers</h1><p className="text-sm text-muted">The commission rate only applies to future orders.</p></div>
      <ul className="divide-y divide-line rounded-2xl border border-line">
        {sellers.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="min-w-0"><div className="font-medium">{s.name} <StatusPill status={s.status} /></div><div className="text-sm text-muted">{s.city} · {d.products.filter((p) => p.sellerId === s.id && p.status === "live").length} live products</div></div>
            <div className="flex flex-wrap items-center gap-4">
              <form action={setCommissionAction} className="flex items-center gap-2"><input type="hidden" name="id" value={s.id} /><label className="text-sm text-muted" htmlFor={`c-${s.id}`}>Fee %</label><input id={`c-${s.id}`} name="pct" type="number" step="0.5" min={0} max={50} defaultValue={s.commissionBps / 100} className={`${inputCls} h-9 w-20`} /><button className={btn("ghost", "sm")}>Save</button></form>
              <SellerActions id={s.id} status={s.status} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
