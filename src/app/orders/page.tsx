import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { fmtDate, t } from "@/lib/i18n";
import { shortDate, shortId } from "@/lib/utils";
import { Card, EmptyState, PageHeader, StatusPill, btn } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t("nav.myOrders", (await getSession()).lang) };
}
export default async function Orders() {
  const s = await getSession();
  const d = db();
  const groups = d.groups.filter((g) => g.customerId === s.customerId && g.status === "paid").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader title={t("nav.myOrders", s.lang)} />
      {!groups.length ? <EmptyState emoji="📦" title={t("checkout.orders.empty", s.lang)} action={<Link href="/search" className={btn("primary")}>{t("checkout.orders.startShopping", s.lang)}</Link>} /> : (
        <div className="space-y-4">
          {groups.map((g) => {
            const os = d.orders.filter((o) => o.groupId === g.id);
            return (
              <Link key={g.id} href={`/orders/${g.id}`}>
                <Card className="p-4 transition hover:border-accent">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-semibold">{t("checkout.orders.orderNo", s.lang, { id: shortId(g.id) })} <span className="font-normal text-muted">· {s.lang === "hi" ? fmtDate(g.createdAt, "hi") : shortDate(g.createdAt)} · {t(os.length > 1 ? "checkout.orders.sellers.many" : "checkout.orders.sellers.one", s.lang, { n: os.length })}</span></div><div className="font-semibold tabular-nums">{formatINR(g.total)}</div></div>
                  <div className="mt-2 flex flex-wrap gap-2">{os.map((o) => <StatusPill key={o.id} status={o.status} lang={s.lang} />)}</div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
