import Link from "next/link";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";
import { formatINR } from "@/lib/money";
import { shortDate, shortId } from "@/lib/utils";
import { Card, EmptyState, PageHeader, StatusPill, btn } from "@/components/ui";

export const metadata = { title: "My orders" };
export default async function Orders() {
  const s = await getSession();
  const d = db();
  const groups = d.groups.filter((g) => g.customerId === s.customerId && g.status === "paid").sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <PageHeader title="My orders" sub="One payment, one order per seller." />
      {!groups.length ? <EmptyState emoji="📦" title="No orders yet" action={<Link href="/search" className={btn("primary")}>Start shopping</Link>} /> : (
        <div className="space-y-3">
          {groups.map((g) => {
            const os = d.orders.filter((o) => o.groupId === g.id);
            return (
              <Link key={g.id} href={`/orders/${g.id}`}>
                <Card className="p-4 transition hover:border-accent">
                  <div className="flex flex-wrap items-center justify-between gap-2"><div className="font-semibold">Order #{shortId(g.id)} <span className="font-normal text-muted">· {shortDate(g.createdAt)} · {os.length} seller{os.length > 1 ? "s" : ""}</span></div><div className="font-semibold tabular-nums">{formatINR(g.total)}</div></div>
                  <div className="mt-2 flex flex-wrap gap-2">{os.map((o) => <StatusPill key={o.id} status={o.status} />)}</div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
