import type { Metadata } from "next";
import { getSession } from "@/lib/session";
import { getProduct, getSeller, isVisible, db, sellerAds } from "@/lib/store";
import { fmtDate, t } from "@/lib/i18n";
import { MAX_CAPTION, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS, MIN_VIDEO_SECONDS } from "@/lib/video";
import { removeAdAction } from "@/app/actions";
import { AdUploadForm } from "@/components/ad-upload-form";
import { StatusPill, btn } from "@/components/ui";
import { Flash } from "@/components/flash";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t("seller.ads.title", (await getSession()).lang) };
}

export default async function SellerAdsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const L = s.lang;
  const seller = getSeller(s.sellerId)!;
  const products = db().products.filter((p) => p.sellerId === seller.id && isVisible(p)).map((p) => ({ id: p.id, title: L === "hi" ? p.titleHi : p.title }));
  const ads = sellerAds(seller.id);
  const reason = (r?: string) => (!r ? "" : /link|web address/i.test(r) ? t("seller.ads.reason.link", L) : t("seller.ads.reason.injection", L));
  return (
    <div className="space-y-8">
      <Flash sp={sp} />
      <div>
        <h2 className="text-lg font-semibold">{t("seller.ads.title", L)}</h2>
        <p className="text-sm text-muted">{t("seller.ads.sub", L)}</p>
      </div>
      {seller.status !== "active" ? (
        <p className="rounded-xl border border-line p-5 text-sm text-muted">{t("seller.ads.notActive", L)}</p>
      ) : products.length === 0 ? (
        <p className="rounded-xl border border-line p-5 text-sm text-muted">{t("seller.ads.noProducts", L)}</p>
      ) : (
        <AdUploadForm products={products} limits={{ maxBytes: MAX_VIDEO_BYTES, minSec: MIN_VIDEO_SECONDS, maxSec: MAX_VIDEO_SECONDS, maxCaption: MAX_CAPTION }} />
      )}
      <section aria-labelledby="my-ads" className="space-y-3">
        <h3 id="my-ads" className="text-base font-semibold">{t("seller.ads.mine", L)}</h3>
        {ads.length === 0 ? (
          <p className="text-sm text-muted">{t("seller.ads.none", L)}</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {ads.map((a) => {
              const p = getProduct(a.productId);
              return (
                <li key={a.id} className="flex gap-3 rounded-xl border border-line p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.poster ?? `/products/${a.productId}-160.webp`} alt="" width={54} height={96} loading="lazy" className="h-24 w-[54px] shrink-0 rounded-lg bg-surface2 object-cover" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill status={a.status} lang={L} />
                      <span className="text-xs tabular-nums text-muted">{t("seller.ads.length", L, { n: a.durationSec })} · {fmtDate(a.createdAt, L)}</span>
                    </div>
                    <p className="line-clamp-2 text-sm">{L === "hi" && a.captionHi ? a.captionHi : a.caption}</p>
                    {p && <p className="truncate text-xs text-muted">{L === "hi" ? p.titleHi : p.title}</p>}
                    {a.status === "held" && <p className="text-xs text-warn">{reason(a.heldReason)}</p>}
                  </div>
                  <form action={removeAdAction} className="self-start">
                    <input type="hidden" name="id" value={a.id} />
                    <button className={btn("ghost", "sm")}>{t("seller.ads.remove", L)}</button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
