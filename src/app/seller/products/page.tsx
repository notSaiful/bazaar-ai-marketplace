import Link from "next/link";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { artUrl } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { localizeMsg } from "@/lib/dict/seller";
import { setStockAction } from "@/app/actions";
import { EmptyState, ProductArt, StatusPill, btn, inputCls } from "@/components/ui";
import { Flash } from "@/components/flash";

export async function generateMetadata() {
  const s = await getSession();
  return { title: t("nav.products", s.lang) };
}
export default async function SellerProducts({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const L = s.lang;
  const mine = db().products.filter((p) => p.sellerId === s.sellerId && p.status !== "archived");
  return (
    <div className="space-y-6">
      <Flash sp={sp} />
      <div className="flex items-center justify-between"><h2 className="text-xl font-semibold">{t("nav.products", L)}</h2><Link href="/seller/products/new" className={btn("primary")}>{t("seller.products.addFromPhoto", L)}</Link></div>
      {!mine.length ? <EmptyState emoji="📸" title={t("seller.products.empty", L)} hint={t("seller.products.emptyHint", L)} action={<Link href="/seller/products/new" className={btn("primary")}>{t("seller.products.addFirst", L)}</Link>} /> : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {mine.map((p) => {
            const title = L === "hi" && p.titleHi ? p.titleHi : p.title;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="size-14 shrink-0 overflow-hidden rounded-xl"><ProductArt src={artUrl(p)} alt="" sizes="64px" /></div>
                <div className="min-w-0 flex-1"><Link href={`/seller/products/${p.id}`} className="font-medium hover:underline">{title}</Link><div className="text-sm text-muted tabular-nums">{formatINR(p.price)}{p.status !== "live" && <> · <StatusPill status={p.status} lang={L} /></>}</div>{p.flagReason && <div className="text-xs text-bad">{localizeMsg(p.flagReason, L)}</div>}</div>
                <form action={setStockAction} className="flex items-center gap-2"><input type="hidden" name="id" value={p.id} /><label className="sr-only" htmlFor={`st-${p.id}`}>{t("seller.products.stockFor", L, { title })}</label><input id={`st-${p.id}`} name="stock" type="number" min={0} defaultValue={p.stock} className={`${inputCls} h-11 w-20 md:h-9`} /><button className={btn("ghost", "sm")}>{t("action.save", L)}</button></form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
