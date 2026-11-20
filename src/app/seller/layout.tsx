import { getSession } from "@/lib/session";
import { getSeller } from "@/lib/store";
import { PortalNav } from "@/components/portal-nav";
import { SwitchRole } from "@/components/gate";
import { EmptyState, Badge } from "@/components/ui";
import { SellerNotifier } from "@/components/seller-notifier";

const NAV = [
  { href: "/seller", label: "Overview", icon: "📊" },
  { href: "/seller/products", label: "Products", icon: "📦" },
  { href: "/seller/products/new", label: "Add from photo", icon: "📸" },
  { href: "/seller/orders", label: "Orders", icon: "🧾" },
  { href: "/seller/earnings", label: "Earnings", icon: "💰" },
  { href: "/seller/onboarding", label: "Store profile", icon: "🏪" },
];

export default async function SellerLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (s.role !== "seller") return <EmptyState emoji="🏪" title="Seller portal" hint="You're viewing the marketplace as a customer. Switch to the seller role to manage products, orders and earnings (demo role switcher, no sign-in needed)." action={<SwitchRole role="seller" label="Continue as seller" />} />;
  const seller = getSeller(s.sellerId)!;
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-3">
        <div className="rounded-2xl border border-line bg-surface p-3"><div className="font-semibold">{seller.emoji} {seller.name}</div><div className="mt-1 flex items-center gap-2 text-xs text-muted">{seller.city} <Badge tone={seller.status === "active" ? "ok" : seller.status === "pending" ? "warn" : "bad"}>{seller.status}</Badge></div></div>
        <PortalNav items={NAV} />
      </aside>
      <div className="min-w-0">
        {seller.status === "pending" && <p className="mb-4 rounded-xl bg-warn/15 px-4 py-3 text-sm text-warn">Your store is awaiting admin approval. You can create drafts, but publishing unlocks after approval. (Switch to Admin → Sellers to approve it.)</p>}
        {seller.status === "suspended" && <p className="mb-4 rounded-xl bg-bad/15 px-4 py-3 text-sm text-bad">Your store is suspended. Products are hidden from the storefront.</p>}
        {children}
      </div>
      <SellerNotifier />
    </div>
  );
}
