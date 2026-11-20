import { db } from "@/lib/store";
import { bpsToPct } from "@/lib/money";
import { Badge, Card, PageHeader, StatusPill } from "@/components/ui";
import { SellerActions } from "@/components/admin-actions";
import { Flash } from "@/components/flash";
import { shortDate } from "@/lib/utils";

export const metadata = { title: "Sellers" };
export default async function Sellers({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const d = db();
  return (
    <div>
      <PageHeader title="Sellers" sub="Approve, suspend or reinstate. Suspended sellers disappear from the storefront immediately." />
      <Flash sp={sp} />
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-xs uppercase text-muted"><tr><th className="p-3">Store</th><th className="p-3">Status</th><th className="p-3">Products</th><th className="p-3">Fee</th><th className="p-3">Joined</th><th className="p-3" /></tr></thead>
          <tbody className="divide-y divide-line">
            {d.sellers.map((s) => (
              <tr key={s.id}>
                <td className="p-3"><div className="font-medium">{s.emoji} {s.name}</div><div className="text-xs text-muted">{s.city} · GSTIN {s.gstin ?? "n/a"} · bank ••••{s.bankLast4}</div></td>
                <td className="p-3"><StatusPill status={s.status} /></td>
                <td className="p-3">{d.products.filter((p) => p.sellerId === s.id && p.status === "live").length} live</td>
                <td className="p-3"><Badge>{bpsToPct(s.commissionBps)}</Badge></td>
                <td className="p-3 text-muted">{shortDate(s.joinedAt)}</td>
                <td className="p-3"><SellerActions id={s.id} status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
