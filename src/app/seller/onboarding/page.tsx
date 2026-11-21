import { registerSellerAction } from "@/app/actions";
import { getSeller } from "@/lib/store";
import { getSession } from "@/lib/session";
import { bpsToPct } from "@/lib/money";
import { t } from "@/lib/i18n";
import { Badge, Card, PageHeader, btn, inputCls } from "@/components/ui";
import { Flash } from "@/components/flash";

export async function generateMetadata() {
  const s = await getSession();
  return { title: t("seller.onb.meta", s.lang) };
}
export default async function Onboarding({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const L = s.lang;
  const me = getSeller(s.sellerId)!;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title={t("seller.onb.title", L)} sub={t("seller.onb.sub", L)} />
      <Flash sp={sp} />
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3"><span className="text-2xl">{me.emoji}</span><div><div className="font-semibold">{me.name}</div><div className="text-sm text-muted">{me.tagline} · {me.city} · {t("seller.onb.bank", L, { last4: me.bankLast4 ?? "----" })}</div></div><Badge tone={me.status === "active" ? "ok" : me.status === "pending" ? "warn" : "bad"}>{t(`status.${me.status}`, L)}</Badge><Badge>{t("seller.onb.fee", L, { pct: bpsToPct(me.commissionBps) })}</Badge></div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-1 font-semibold">{t("seller.onb.registerTitle", L)}</h2>
        <p className="mb-4 text-sm text-muted">{t("seller.onb.registerHint", L)}</p>
        <form action={registerSellerAction} className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="name" className="mb-1 block text-sm font-medium">{t("seller.onb.name", L)}</label><input id="name" name="name" required minLength={3} placeholder={t("seller.onb.namePh", L)} className={inputCls} /></div>
          <div><label htmlFor="city" className="mb-1 block text-sm font-medium">{t("seller.onb.city", L)}</label><input id="city" name="city" required placeholder={t("seller.onb.cityPh", L)} className={inputCls} /></div>
          <div className="sm:col-span-2"><label htmlFor="tagline" className="mb-1 block text-sm font-medium">{t("seller.onb.tagline", L)}</label><input id="tagline" name="tagline" placeholder={t("seller.onb.taglinePh", L)} className={inputCls} /></div>
          <div><label htmlFor="bank" className="mb-1 block text-sm font-medium">{t("seller.onb.bankLabel", L)}</label><input id="bank" name="bank" required pattern="\d{4}" inputMode="numeric" maxLength={4} placeholder="1234" className={inputCls} /></div>
          <div><label htmlFor="gstin" className="mb-1 block text-sm font-medium">{t("seller.onb.gstin", L)}</label><input id="gstin" name="gstin" className={inputCls} /></div>
          <div className="sm:col-span-2"><button className={btn("primary")}>{t("seller.onb.submit", L)}</button></div>
        </form>
      </Card>
    </div>
  );
}
