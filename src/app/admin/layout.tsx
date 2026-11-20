import { getSession } from "@/lib/session";
import { PortalNav } from "@/components/portal-nav";
import { SwitchRole } from "@/components/gate";
import { EmptyState } from "@/components/ui";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/sellers", label: "Sellers" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/ledger", label: "Money" },
];
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (s.role !== "admin") return <EmptyState emoji="🛡️" title="Admin" hint="Switch to the admin view to approve sellers, review orders and check the money." action={<SwitchRole role="admin" label="Switch to admin" />} />;
  return <div className="space-y-8"><PortalNav items={NAV} /><div className="min-w-0">{children}</div></div>;
}
