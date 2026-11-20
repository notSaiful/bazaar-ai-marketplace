import { getSession } from "@/lib/session";
import { PortalNav } from "@/components/portal-nav";
import { SwitchRole } from "@/components/gate";
import { EmptyState } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "📈" },
  { href: "/admin/sellers", label: "Sellers", icon: "🏪" },
  { href: "/admin/products", label: "Moderation", icon: "🛡️" },
  { href: "/admin/orders", label: "Orders", icon: "🧾" },
  { href: "/admin/commission", label: "Commission", icon: "％" },
  { href: "/admin/payouts", label: "Payouts", icon: "💸" },
  { href: "/admin/ledger", label: "Ledger", icon: "📒" },
];
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (s.role !== "admin") return <EmptyState emoji="🛡️" title="Admin dashboard" hint="Switch to the admin role to approve sellers, moderate listings, manage commission and view the ledger (demo role switcher)." action={<SwitchRole role="admin" label="Continue as admin" />} />;
  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <aside><PortalNav items={NAV} /></aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
