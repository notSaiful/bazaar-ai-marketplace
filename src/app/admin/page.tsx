import Link from "next/link";
import { analytics, anomalies, db, getProduct, reconciliation } from "@/lib/store";
import { moderateAdAction, moderateReviewAction } from "@/app/actions";
import { btn } from "@/components/ui";
import { formatINR, formatINRExact } from "@/lib/money";
import { shortDate } from "@/lib/utils";
import { ResetButton } from "@/components/reset-button";
import { AreaChart, HBars } from "@/components/charts";
import { SellerActions, ProductActions } from "@/components/admin-actions";
import { Copilot } from "@/components/copilot";
import { Flash } from "@/components/flash";

export const metadata = { title: "Admin" };
export default async function Admin({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const a = analytics();
  const d = db();
  const rec = reconciliation();
  const pending = d.sellers.filter((s) => s.status === "pending");
  const flagged = anomalies().filter((f) => f.kind === "listing");
  const heldReviews = anomalies().filter((f) => f.kind === "review" && f.held);
  const heldAds = anomalies().filter((f) => f.kind === "ad" && f.held);
  const attention = pending.length + flagged.length + heldReviews.length + heldAds.length;
  const tile = "rounded-2xl border border-line p-6";
  return (
    <div className="space-y-12">
      <Flash sp={sp} />
      <section className="space-y-4" aria-labelledby="att">
        <h2 id="att" className="text-xl font-semibold">{attention ? `Needs your attention (${attention})` : "All clear"}</h2>
        {attention === 0 && <p className="text-muted">No shops, listings, reviews or ads are waiting for review.</p>}
        <ul className="space-y-3">
          {pending.map((s) => <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-5"><div><div className="font-medium">{s.name}</div><div className="text-sm text-muted">New shop in {s.city} wants to start selling</div></div><SellerActions id={s.id} status={s.status} back="/admin" /></li>)}
          {flagged.map((f) => <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-5"><div className="min-w-0"><div className="font-medium">{f.target}</div><div className="max-w-xl text-sm text-muted">Flagged: {f.reason}</div></div><ProductActions id={f.productId!} /></li>)}
          {heldReviews.map((f) => {
            const r = getProduct(f.productId!)?.reviews.find((x) => x.id === f.reviewId);
            if (!r) return null;
            return (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-5">
                <div className="min-w-0">
                  <div className="font-medium">Review held on {f.target}</div>
                  <div className="max-w-xl text-sm text-muted">{r.stars}★ by {r.author}: <q className="break-words">{r.text}</q></div>
                  <div className="text-xs text-warn">{r.heldReason}</div>
                </div>
                <form action={moderateReviewAction} className="flex gap-2">
                  <input type="hidden" name="productId" value={f.productId} />
                  <input type="hidden" name="reviewId" value={f.reviewId} />
                  <button name="decision" value="publish" className={btn("outline", "sm")}>Publish</button>
                  <button name="decision" value="remove" className={btn("primary", "sm")}>Remove</button>
                </form>
              </li>
            );
          })}
          {heldAds.map((f) => {
            const ad = d.ads.find((x) => x.id === f.adId);
            if (!ad) return null;
            return (
              <li key={f.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line p-5">
                <div className="flex min-w-0 gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ad.poster ?? `/products/${ad.productId}-160.webp`} alt="" width={45} height={80} className="h-20 w-[45px] shrink-0 rounded-lg bg-surface2 object-cover" />
                  <div className="min-w-0">
                    <div className="font-medium">Video ad held for {f.target}</div>
                    <div className="max-w-xl text-sm text-muted">{ad.durationSec}s · caption: <q className="break-words">{ad.caption}</q></div>
                    <div className="text-xs text-warn">{f.reason}</div>
                    <a href={ad.video} target="_blank" rel="noopener noreferrer" className="text-xs underline">Watch video</a>
                  </div>
                </div>
                <form action={moderateAdAction} className="flex gap-2">
                  <input type="hidden" name="id" value={ad.id} />
                  <button name="decision" value="publish" className={btn("outline", "sm")}>Publish</button>
                  <button name="decision" value="remove" className={btn("primary", "sm")}>Remove</button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="grid gap-4 sm:grid-cols-3">
        <div className={tile}><div className="text-sm text-muted">Sales (GMV)</div><div className="mt-1 text-3xl font-semibold tabular-nums">{formatINR(a.gmv)}</div></div>
        <div className={tile}><div className="text-sm text-muted">Commission earned</div><div className="mt-1 text-3xl font-semibold tabular-nums">{formatINR(a.commission)}</div></div>
        <div className={tile}><div className="text-sm text-muted">Orders</div><div className="mt-1 text-3xl font-semibold">{a.orders}</div></div>
      </section>
      <section className="space-y-4"><h2 className="text-xl font-semibold">Sales, last 14 days</h2><AreaChart data={a.days.map((x) => ({ label: shortDate(x.day), value: x.gmv }))} label="Daily sales" /></section>
      <section className="space-y-4"><h2 className="text-xl font-semibold">Top sellers</h2><HBars data={a.bySeller.map((s) => ({ label: s.name, value: s.gmv }))} /></section>
      <details className="rounded-2xl border border-line p-5"><summary className="cursor-pointer font-medium">Ask a question about the numbers</summary><div className="mt-4"><Copilot /></div></details>
      <footer className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
        <Link href="/admin/ledger">Books balance: difference {formatINRExact(rec.diff)}</Link>
        <span>Demo data is private to your browser</span>
        <ResetButton />
      </footer>
    </div>
  );
}
