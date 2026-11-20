import Link from "next/link";
import { accountName, getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { AccountSettings } from "@/components/account-settings";
import { Card, PageHeader, btn } from "@/components/ui";

export const metadata = { title: "Account settings" };

export default async function AccountPage() {
  const s = await getSession();
  const name = accountName(s.role, s.sellerId);
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Account settings" sub="Demo account. Sign-in and profile editing are not enabled." />
      <Card className="p-5">
        <h2 className="font-semibold">Profile</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-muted">Name</dt><dd className="font-medium">{name}</dd></div>
          <div><dt className="text-muted">Acting as</dt><dd className="font-medium capitalize">{s.role}</dd></div>
        </dl>
      </Card>
      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Preferences</h2>
        <AccountSettings lang={s.lang} />
      </Card>
      {s.role === "customer" && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
          <div><h2 className="font-semibold">{t("orders", s.lang)}</h2><p className="text-sm text-muted">Track deliveries and request refunds.</p></div>
          <Link href="/orders" className={btn("outline")}>View orders</Link>
        </Card>
      )}
    </div>
  );
}
