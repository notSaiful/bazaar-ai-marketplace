import Link from "next/link";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { archiveProductAction, setStockAction } from "@/app/actions";
import { Badge, Card, EmptyState, PageHeader, ProductArt, StatusPill, btn, inputCls } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "Products" };
export default async function SellerProducts({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const mine = db().products.filter((p) => p.sellerId === s.sellerId && p.status !== "archived");
  return (
    <div>
      <PageHeader title="Products & inventory" sub={`${mine.length} listings`} action={<Link href="/seller/products/new" className={btn("primary")}>📸 Add from photo</Link>} />
      <Flash sp={sp} />
      {!mine.length ? <EmptyState emoji="📸" title="No products yet" hint="Snap a photo and we'll draft the listing in English and Hindi." action={<Link href="/seller/products/new" className={btn("primary")}>Create your first listing</Link>} /> : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase text-muted"><tr><th className="p-3">Product</th><th className="p-3">Price</th><th className="p-3">Status</th><th className="p-3">Stock</th><th className="p-3" /></tr></thead>
            <tbody className="divide-y divide-line">
              {mine.map((p) => (
                <tr key={p.id}>
                  <td className="p-3"><div className="flex items-center gap-3"><div className="size-11 shrink-0 overflow-hidden rounded-lg"><ProductArt src={artUrl(p)} alt="" /></div><div><Link href={`/seller/products/${p.id}`} className="font-medium hover:underline">{p.title}</Link>{p.flagReason && <div className="max-w-xs text-xs text-bad">{p.flagReason}</div>}</div></div></td>
                  <td className="p-3 tabular-nums">{formatINR(p.price)}</td>
                  <td className="p-3"><StatusPill status={p.status} /> {p.aiGenerated && <Badge tone="accent">AI</Badge>}</td>
                  <td className="p-3"><form action={setStockAction} className="flex items-center gap-1"><input type="hidden" name="id" value={p.id} /><label className="sr-only" htmlFor={`st-${p.id}`}>Stock for {p.title}</label><input id={`st-${p.id}`} name="stock" type="number" min={0} defaultValue={p.stock} className={`${inputCls} h-8 w-20`} /><button className={btn("outline", "sm")}>Save</button>{p.stock <= p.lowStockThreshold && p.status === "live" && <Badge tone="warn">low</Badge>}</form></td>
                  <td className="p-3 text-right"><form action={archiveProductAction}><input type="hidden" name="id" value={p.id} /><button className={btn("ghost", "sm")}>Archive</button></form></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
