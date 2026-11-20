import Link from "next/link";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { setStockAction } from "@/app/actions";
import { EmptyState, ProductArt, StatusPill, btn, inputCls } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "Products" };
export default async function SellerProducts({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const mine = db().products.filter((p) => p.sellerId === s.sellerId && p.status !== "archived");
  return (
    <div className="space-y-6">
      <Flash sp={sp} />
      <div className="flex items-center justify-between"><h1 className="text-xl font-semibold">Products</h1><Link href="/seller/products/new" className={btn("primary")}>Add from photo</Link></div>
      {!mine.length ? <EmptyState emoji="📸" title="No products yet" hint="Take a photo and we'll write the listing for you." action={<Link href="/seller/products/new" className={btn("primary")}>Add your first product</Link>} /> : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {mine.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="size-14 shrink-0 overflow-hidden rounded-xl"><ProductArt src={artUrl(p)} alt="" /></div>
              <div className="min-w-0 flex-1"><Link href={`/seller/products/${p.id}`} className="font-medium hover:underline">{p.title}</Link><div className="text-sm text-muted tabular-nums">{formatINR(p.price)}{p.status !== "live" && <> · <StatusPill status={p.status} /></>}</div>{p.flagReason && <div className="text-xs text-bad">{p.flagReason}</div>}</div>
              <form action={setStockAction} className="flex items-center gap-2"><input type="hidden" name="id" value={p.id} /><label className="sr-only" htmlFor={`st-${p.id}`}>Stock for {p.title}</label><input id={`st-${p.id}`} name="stock" type="number" min={0} defaultValue={p.stock} className={`${inputCls} h-9 w-20`} /><button className={btn("ghost", "sm")}>Save</button></form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
