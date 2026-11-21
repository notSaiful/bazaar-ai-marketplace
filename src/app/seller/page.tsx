import Link from "next/link";
import { db, sellerEarnings } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { t } from "@/lib/i18n";
import { setStockAction } from "@/app/actions";
import { Flash } from "@/components/flash";
import { btn, inputCls } from "@/components/ui";

export async function generateMetadata() {
  const s = await getSession();
  return { title: t("seller.home.title", s.lang) };
}
export default async function SellerHome({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const L = s.lang;
  const d = db();
  const orders = d.orders.filter((o) => o.sellerId === s.sellerId);
  const todo = orders.filter((o) => ["placed", "accepted", "packed"].includes(o.status)).length;
  const e = sellerEarnings(s.sellerId);
  const low = d.products.filter((p) => p.sellerId === s.sellerId && p.status === "live" && p.stock <= p.lowStockThreshold).sort((a, b) => a.stock - b.stock);
  const tile = "rounded-2xl border border-line p-6";
  return (
    <div className="space-y-10">
      <Flash sp={sp} />
      <Link href="/seller/products/new" className={`${btn("primary", "lg")} w-full sm:w-auto`}>{t("seller.home.addFromPhoto", L)}</Link>
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/seller/orders" className={tile}><div className="text-sm text-muted">{t("seller.home.ordersToShip", L)}</div><div className="mt-1 text-3xl font-semibold">{todo}</div></Link>
        <Link href="/seller/earnings" className={tile}><div className="text-sm text-muted">{t("seller.earn.ready", L)}</div><div className="mt-1 text-3xl font-semibold tabular-nums">{formatINR(e.available)}</div></Link>
        <Link href="/seller/earnings" className={tile}><div className="text-sm text-muted">{t("seller.home.totalSales", L)}</div><div className="mt-1 text-3xl font-semibold tabular-nums">{formatINR(e.gross)}</div></Link>
      </div>
      {low.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">{t("seller.home.runningLow", L)}</h2>
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {low.map((p) => {
              const title = L === "hi" && p.titleHi ? p.titleHi : p.title;
              return (
                <li key={p.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                  <span className="truncate">{title} <span className="text-warn">· {t("seller.home.left", L, { n: p.stock })}</span></span>
                  <form action={setStockAction} className="flex items-center gap-2"><input type="hidden" name="id" value={p.id} /><input type="hidden" name="_back" value="/seller" /><label className="sr-only" htmlFor={`s-${p.id}`}>{t("seller.home.newStockFor", L, { title })}</label><input id={`s-${p.id}`} name="stock" type="number" min={0} defaultValue={p.stock + 20} className={`${inputCls} h-11 w-20 md:h-9`} /><button className={btn("outline", "sm")}>{t("seller.home.restock", L)}</button></form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
