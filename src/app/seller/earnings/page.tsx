import { db, sellerEarnings } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR, formatINRExact, bpsToPct } from "@/lib/money";
import { shortDate, shortId } from "@/lib/utils";
import { fmtDate, t } from "@/lib/i18n";
import { Badge, Card, EmptyState, Stat, StatusPill } from "@/components/ui";

export async function generateMetadata() {
  const s = await getSession();
  return { title: t("nav.earnings", s.lang) };
}
export default async function Earnings() {
  const s = await getSession();
  const L = s.lang;
  const d = db();
  const e = sellerEarnings(s.sellerId);
  const orders = d.orders.filter((o) => o.sellerId === s.sellerId && !["pending_payment", "cancelled"].includes(o.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const statement = orders.reduce((a, o) => a + (o.status === "refunded" ? 0 : o.payout), 0) - e.paidOut;
  const ok = statement === e.ledgerBalance;
  const date = (iso: string) => (L === "hi" ? fmtDate(iso, L) : shortDate(iso));
  const itemTitle = (productId: string, title: string) => (L === "hi" ? d.products.find((p) => p.id === productId)?.titleHi || title : title);
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label={t("seller.earn.ready", L)} value={formatINR(e.available)} tone="ok" />
        <Stat label={t("seller.earn.escrow", L)} value={formatINR(e.inEscrow)} />
        <Stat label={t("seller.earn.paidOut", L)} value={formatINR(e.paidOut)} />
      </div>
      <p className={`text-sm ${ok ? "text-muted" : "text-bad"}`}>{ok ? "✓" : "⚠"} {t("seller.earn.statement", L, { amount: formatINRExact(e.ledgerBalance) })}</p>
      {!orders.length ? <EmptyState title={t("seller.earn.empty", L)} /> : (
        <Card className="overflow-x-auto" tabIndex={0}>
          <table className="w-full min-w-[820px] text-sm">
            <thead className="border-b border-line text-left text-xs uppercase text-muted"><tr><th className="p-3">{t("seller.earn.col.order", L)}</th><th className="p-3">{t("seller.earn.col.item", L)}</th><th className="p-3 text-right">{t("seller.earn.col.gross", L)}</th><th className="p-3 text-right">{t("seller.earn.col.fee", L)}</th><th className="p-3 text-right">{t("seller.earn.col.payout", L)}</th><th className="p-3">{t("seller.earn.col.status", L)}</th></tr></thead>
            <tbody className="divide-y divide-line">
              {orders.flatMap((o) => o.items.map((i, k) => (
                <tr key={o.id + i.productId} className={o.status === "refunded" ? "line-through decoration-muted/50" : ""}>
                  <td className="p-3">{k === 0 ? <>#{shortId(o.id)}<div className="text-xs text-muted">{date(o.createdAt)}</div></> : ""}</td>
                  <td className="p-3">{i.qty}× {itemTitle(i.productId, i.title)}</td>
                  <td className="p-3 text-right tabular-nums">{formatINRExact(i.lineTotal)}</td>
                  <td className="p-3 text-right tabular-nums text-muted">−{formatINRExact(i.commission)} <span className="text-xs">({bpsToPct(i.commissionBps)})</span></td>
                  <td className="p-3 text-right font-medium tabular-nums">{formatINRExact(i.lineTotal - i.commission)}</td>
                  <td className="p-3">{k === 0 && <div className="flex flex-wrap gap-1"><StatusPill status={o.status} lang={L} />{o.settled && <Badge tone="ok">{t("seller.earn.paidOutBadge", L)}</Badge>}</div>}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
