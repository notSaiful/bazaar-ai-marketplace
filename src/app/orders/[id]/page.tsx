import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, PartyPopper } from "lucide-react";
import { db, getProduct, getSeller } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtDateTime, t } from "@/lib/i18n";
import { shortDate, shortId, cn } from "@/lib/utils";
import { Card, PageHeader, SplitBreakdown, StatusPill } from "@/components/ui";
import { OrderPoller } from "@/components/order-poller";
import type { OrderStatus } from "@/lib/types";

const STEPS: OrderStatus[] = ["placed", "accepted", "packed", "shipped", "delivered"];
export async function generateMetadata(): Promise<Metadata> {
  return { title: t("checkout.order.meta", (await getSession()).lang) };
}

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { id } = await params;
  const { paid } = await searchParams;
  const { lang } = await getSession();
  const hi = lang === "hi";
  const d = db();
  const g = d.groups.find((x) => x.id === id);
  if (!g) notFound();
  const orders = d.orders.filter((o) => o.groupId === id);
  /** Status words: English keeps the raw status text; Hindi uses the shared status dictionary. */
  const statusText = (x: string) => (hi ? t(x === "expired" ? "checkout.order.status.expired" : `status.${x}`, lang) : x.replace("_", " "));
  return (
    <div className="space-y-8">
      <OrderPoller />
      {paid && (
        <div className="pop flex items-center gap-3 rounded-2xl border border-ok/40 bg-ok/10 p-4"><PartyPopper className="size-6 text-ok" /><div><div className="font-semibold">{t("checkout.order.paid", lang, { amount: formatINR(g.total) })}</div><div className="text-sm text-muted">{t(orders.length > 1 ? "checkout.order.perSeller.many" : "checkout.order.perSeller.one", lang, { n: orders.length })}</div></div></div>
      )}
      <PageHeader title={t("checkout.orders.orderNo", lang, { id: shortId(g.id) })} sub={`${hi ? fmtDate(g.createdAt, lang) : shortDate(g.createdAt)} · ${g.address}, ${g.city} ${g.pincode}`} />
      {g.status !== "paid" && <p className="rounded-xl bg-warn/15 p-3 text-sm text-warn">{t("checkout.order.groupStatus", lang, { status: statusText(g.status) })}</p>}
      <p className="text-sm"><Link href="/orders" className="text-accent hover:underline">{t("checkout.order.viewAll", lang)}</Link></p>
      <div className="grid gap-4 lg:grid-cols-2">
        {orders.map((o) => {
          const seller = getSeller(o.sellerId);
          const idx = STEPS.indexOf(o.status);
          return (
            <Card key={o.id} className="space-y-4 p-6">
              <div className="flex items-center justify-between"><div><div className="font-semibold">{seller?.name}</div><div className="text-xs text-muted">{t("checkout.order.fromCity", lang, { city: seller?.city ?? "" })}</div></div><StatusPill status={o.status} lang={lang} /></div>
              <ul className="space-y-1 text-sm">{o.items.map((i) => <li key={i.productId} className="flex justify-between"><span>{i.qty}× <Link href={`/product/${i.productId}`} className="hover:underline">{(hi && getProduct(i.productId)?.titleHi) || i.title}</Link></span><span className="tabular-nums">{formatINR(i.lineTotal)}</span></li>)}</ul>
              {["refunded", "cancelled"].includes(o.status) ? (
                <p className="text-sm text-bad">{o.tracking[o.tracking.length - 1]?.note}</p>
              ) : (
                <ol className="flex items-center justify-between" aria-label={t("checkout.order.progress", lang)}>
                  {STEPS.map((st, i) => (
                    <li key={st} className="flex flex-1 flex-col items-center gap-1 text-center text-[11px]">
                      {i <= idx ? <CheckCircle2 className="size-5 text-ok" /> : <Circle className="size-5 text-line" />}
                      <span className={cn("capitalize", i <= idx ? "font-medium" : "text-muted")}>{t(`status.${st}`, lang)}</span>
                    </li>
                  ))}
                </ol>
              )}
              <details className="text-xs text-muted"><summary className="cursor-pointer">{t("checkout.order.tracking", lang)}</summary><ul className="mt-1 space-y-0.5">{o.tracking.map((ev, i) => <li key={i}>{hi ? fmtDateTime(ev.at, lang) : new Date(ev.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {statusText(ev.status)}{ev.note ? ` · ${ev.note}` : ""}</li>)}</ul></details>
              <SplitBreakdown inline gross={o.gross} commission={o.commission} payout={o.payout} bps={o.items[0]?.commissionBps} refunded={o.refunded} lang={lang} />
            </Card>
          );
        })}
      </div>
    </div>
  );
}
