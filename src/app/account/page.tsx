import Link from "next/link";
import type { Metadata } from "next";
import { accountName, getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { AccountSettings } from "@/components/account-settings";
import { Card, PageHeader, btn } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t("nav.accountSettings", (await getSession()).lang) };
}

export default async function AccountPage() {
  const s = await getSession();
  const hi = s.lang === "hi";
  const name = hi && s.role === "admin" ? t("role.marketplaceAdmin", s.lang) : accountName(s.role, s.sellerId);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("nav.accountSettings", s.lang)} sub={t("checkout.account.sub", s.lang)} />
      <Card className="p-5">
        <h2 className="font-semibold">{t("checkout.account.profile", s.lang)}</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">{t("checkout.account.name", s.lang)}</dt><dd className="font-medium">{name}</dd></div>
          <div><dt className="text-muted">{t("checkout.account.actingAs", s.lang)}</dt><dd className="font-medium capitalize">{hi ? t(`role.name.${s.role}`, s.lang) : s.role}</dd></div>
        </dl>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">{t("checkout.account.preferences", s.lang)}</h2>
        <AccountSettings lang={s.lang} />
      </Card>
      {s.role === "customer" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div><h2 className="font-semibold">{t("orders", s.lang)}</h2><p className="text-sm text-muted">{t("checkout.account.ordersHint", s.lang)}</p></div>
          <Link href="/orders" className={btn("outline")}>{t("checkout.account.viewOrders", s.lang)}</Link>
        </Card>
      )}
    </div>
  );
}
