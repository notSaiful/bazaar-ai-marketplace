import { BadgeCheck } from "lucide-react";
import type { Product } from "@/lib/types";
import { publicReviews } from "@/lib/store";
import { Stars } from "./stars";
import { ReviewForm } from "./review-form";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

/**
 * Product reviews: rating summary, star breakdown, list and the write-a-review form.
 * Review text is untrusted customer input: React renders it as text, and held reviews never show here.
 */
export function ReviewsSection({ p, canReview, mine, defaultName }: { p: Product; canReview: boolean; mine?: { held?: boolean }; defaultName: string }) {
  const list = publicReviews(p);
  const total = p.ratingCount ?? list.length;
  // The breakdown uses written reviews (seed ratings have no per-star detail).
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: list.filter((r) => r.stars === n).length }));
  const max = Math.max(1, ...dist.map((x) => x.c));
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 space-y-8 border-t border-line pt-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="reviews-title" className="text-2xl font-semibold tracking-tight">Reviews</h2>
        <p className="text-sm text-muted">{list.length} written · {total} {total === 1 ? "rating" : "ratings"}</p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-line p-5">
            <div className="flex items-end gap-3">
              <span className="text-5xl font-semibold leading-none tabular-nums">{p.rating.toFixed(1)}</span>
              <div className="pb-1">
                <Stars value={p.rating} />
                <p className="mt-1 text-xs text-muted">Based on {total} {total === 1 ? "rating" : "ratings"}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-1.5" aria-label="Written reviews by star rating">
              {dist.map(({ n, c }) => (
                <li key={n} className="flex items-center gap-3 text-sm">
                  <span className="w-10 shrink-0 tabular-nums text-muted">{n} ★</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface2"><span className="block h-full rounded-full bg-fg" style={{ width: `${(c / max) * 100}%` }} /></span>
                  <span className="w-6 shrink-0 text-right tabular-nums text-muted">{c}</span>
                </li>
              ))}
            </ul>
          </div>
          {canReview && !mine && <ReviewForm productId={p.id} defaultName={defaultName} />}
          {canReview && mine && (
            <p role="status" className="rounded-xl border border-line p-5 text-sm text-muted">
              {mine.held ? "Thanks! Your review is waiting for a quick check by our team before it appears." : "Thanks for reviewing this product."}
            </p>
          )}
          {!canReview && <p className="rounded-xl border border-line p-5 text-sm text-muted">Switch to Shopping to write a review.</p>}
        </div>
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">No written reviews yet. Be the first to share what you think.</p>
        ) : (
          <ol className="divide-y divide-line">
            {list.map((r, i) => (
              <li key={r.id ?? i} className="py-5 first:pt-0">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface2 text-xs font-semibold" aria-hidden>{initials(r.author)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium">{r.author}</span>
                      {r.verified && <span className="inline-flex items-center gap-1 text-xs text-ok"><BadgeCheck className="size-3.5" aria-hidden />Verified purchase</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars value={r.stars} size="size-3.5" />
                      {r.at && <time dateTime={r.at} className="text-xs text-muted">{dateFmt.format(new Date(r.at))}</time>}
                    </div>
                    <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed">{r.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
