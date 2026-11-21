import { getSession } from "@/lib/session";
import { getSeller } from "@/lib/store";
import { PortalNav } from "@/components/portal-nav";
import { SwitchRole } from "@/components/gate";
import { EmptyState } from "@/components/ui";
import { SellerNotifier } from "@/components/seller-notifier";

const NAV = [
  { href: "/seller", label: "Home" },
  { href: "/seller/products", label: "Products" },
  { href: "/seller/orders", label: "Orders" },
  { href: "/seller/earnings", label: "Earnings" },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (s.role !== "seller") return <EmptyState emoji="🏪" title="Selling on Bazaar" hint="Switch to the seller view to add products and manage orders." action={<SwitchRole role="seller" label="Switch to selling" />} />;
  const seller = getSeller(s.sellerId)!;
  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4"><div><div className="text-sm text-muted">{seller.city}</div><h1 className="text-xl font-semibold">{seller.name}</h1></div><a href="/seller/onboarding" className="text-sm text-muted hover:text-fg">Register a new shop</a></div>
      <PortalNav items={NAV} />
      {seller.status === "pending" && <p className="rounded-xl bg-warn/10 px-4 py-3 text-sm text-warn">Waiting for approval. You can save drafts now; publishing unlocks once an admin approves your shop.</p>}
      {seller.status === "suspended" && <p className="rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">Your shop is suspended and hidden from customers.</p>}
      {children}
      <SellerNotifier />
    </div>
  );
}
