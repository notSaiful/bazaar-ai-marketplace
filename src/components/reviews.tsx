import { BadgeCheck } from "lucide-react";
import type { Product } from "@/lib/types";
import { publicReviews } from "@/lib/store";
import { fmtDate, t, tn, type Lang } from "@/lib/i18n";
import { Stars } from "./stars";
import { ReviewForm } from "./review-form";

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("") || "?";

/**
 * Product reviews: rating summary, star breakdown, list and the write-a-review form.
 * Review text is untrusted customer input: React renders it as text, and held reviews never show here.
 */
export function ReviewsSection({ p, canReview, mine, defaultName, lang = "en" }: { p: Product; canReview: boolean; mine?: { held?: boolean }; defaultName: string; lang?: Lang }) {
  const list = publicReviews(p);
  const total = p.ratingCount ?? list.length;
  // The breakdown uses written reviews (seed ratings have no per-star detail).
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, c: list.filter((r) => r.stars === n).length }));
  const max = Math.max(1, ...dist.map((x) => x.c));
  return (
    <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-24 space-y-8 border-t border-line pt-10">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="reviews-title" className="text-2xl font-semibold tracking-tight">{t("shop.reviews.title", lang)}</h2>
        <p className="text-sm text-muted">{t("shop.reviews.written", lang, { n: list.length })} · {tn(total, "shop.rating.one", "shop.rating.many", lang)}</p>
      </div>
      <div className="grid gap-10 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <div className="rounded-xl border border-line p-5">
            <div className="flex items-end gap-3">
              <span className="text-5xl font-semibold leading-none tabular-nums">{p.rating.toFixed(1)}</span>
              <div className="pb-1">
                <Stars value={p.rating} lang={lang} />
                <p className="mt-1 text-xs text-muted">{tn(total, "shop.reviews.basedOne", "shop.reviews.basedMany", lang)}</p>
              </div>
            </div>
            <ul className="mt-5 space-y-1.5" aria-label={t("shop.reviews.byStar", lang)}>
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
              {mine.held ? t("shop.reviews.held", lang) : t("shop.reviews.thanks", lang)}
            </p>
          )}
          {!canReview && <p className="rounded-xl border border-line p-5 text-sm text-muted">{t("shop.reviews.switch", lang)}</p>}
        </div>
        {list.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-8 text-center text-sm text-muted">{t("shop.reviews.none", lang)}</p>
        ) : (
          <ol className="divide-y divide-line">
            {list.map((r, i) => (
              <li key={r.id ?? i} className="py-5 first:pt-0">
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface2 text-xs font-semibold" aria-hidden>{initials(r.author)}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-medium">{r.author}</span>
                      {r.verified && <span className="inline-flex items-center gap-1 text-xs text-ok"><BadgeCheck className="size-3.5" aria-hidden />{t("shop.reviews.verified", lang)}</span>}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Stars value={r.stars} size="size-3.5" lang={lang} />
                      {r.at && <time dateTime={r.at} className="text-xs text-muted">{fmtDate(r.at, lang)}</time>}
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
