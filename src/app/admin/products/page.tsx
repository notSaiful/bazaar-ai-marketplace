import Link from "next/link";
import { db, getSeller } from "@/lib/store";
import { formatINR } from "@/lib/money";
import { Card, EmptyState, PageHeader, StatusPill } from "@/components/ui";
import { ProductActions } from "@/components/admin-actions";
import { Flash } from "@/components/flash";

export const metadata = { title: "Product moderation" };
export default async function Moderation({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const d = db();
  const queue = d.products.filter((p) => p.status === "flagged");
  const recent = d.products.filter((p) => p.moderationNote).slice(0, 8);
  return (
    <div className="space-y-6">
      <PageHeader title="Product moderation" sub="Flagged listings arrive with a reason. Approve or reject with a note." />
      <Flash sp={sp} />
      {!queue.length ? <EmptyState emoji="✅" title="Moderation queue is empty" /> : (
        <div className="space-y-3">{queue.map((p) => (
          <Card key={p.id} className="space-y-2 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><Link href={`/product/${p.id}`} className="font-semibold hover:underline">{p.title}</Link><div className="text-sm text-muted">{getSeller(p.sellerId)?.name} · {formatINR(p.price)} (MRP {formatINR(p.mrp)})</div></div><StatusPill status={p.status} /></div>
            <p className="rounded-lg bg-bad/10 p-2 text-sm text-bad">Why flagged: {p.flagReason}</p>
            <p className="text-xs text-muted">Description (treated as untrusted text): “{p.description}”</p>
            <ProductActions id={p.id} />
          </Card>))}</div>
      )}
      {recent.length > 0 && <Card className="p-5"><h2 className="mb-2 font-semibold">Recent decisions</h2><ul className="space-y-1 text-sm">{recent.map((p) => <li key={p.id} className="flex items-center gap-2"><StatusPill status={p.status} /> {p.title} <span className="text-muted">· {p.moderationNote}</span></li>)}</ul></Card>}
    </div>
  );
}
