import { getSession } from "@/lib/session";
import { getSeller } from "@/lib/store";
import { t } from "@/lib/i18n";
import { PortalNav } from "@/components/portal-nav";
import { SwitchRole } from "@/components/gate";
import { EmptyState } from "@/components/ui";
import { SellerNotifier } from "@/components/seller-notifier";

const NAV = [
  { href: "/seller", key: "nav.home" },
  { href: "/seller/products", key: "nav.products" },
  { href: "/seller/orders", key: "nav.orders" },
  { href: "/seller/earnings", key: "nav.earnings" },
  { href: "/seller/ads", key: "seller.nav.ads" },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  const L = s.lang;
  if (s.role !== "seller") return <EmptyState emoji="🏪" title={t("seller.gate.title", L)} hint={t("seller.gate.hint", L)} action={<SwitchRole role="seller" label={t("seller.gate.switch", L)} />} />;
  const seller = getSeller(s.sellerId)!;
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4"><div><div className="text-sm text-muted">{seller.city}</div><h1 className="text-xl font-semibold">{seller.name}</h1></div><a href="/seller/onboarding" className="text-sm text-muted hover:text-fg">{t("seller.registerNewShop", L)}</a></div>
      <PortalNav items={NAV.map((n) => ({ href: n.href, label: t(n.key, L) }))} />
      {seller.status === "pending" && <p className="rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">{t("seller.banner.pending", L)}</p>}
      {seller.status === "suspended" && <p className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{t("seller.banner.suspended", L)}</p>}
      {children}
      <SellerNotifier />
    </div>
  );
}
