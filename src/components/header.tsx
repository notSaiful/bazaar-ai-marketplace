import Link from "next/link";
import { Store } from "lucide-react";
import { getSession } from "@/lib/session";
import { db } from "@/lib/store";
import { t } from "@/lib/i18n";
import { CartButton } from "./cart";
import { RoleSwitcher } from "./role-switcher";
import { SearchBox } from "./search-box";
import { ThemeToggle } from "./theme-toggle";

export async function Header() {
  const s = await getSession();
  const sellers = db().sellers.map((x) => ({ id: x.id, name: x.name }));
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight" aria-label="Bazaar AI home">
          <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-fg"><Store className="size-5" /></span>
          <span className="hidden sm:inline">Bazaar <span className="text-accent">AI</span></span>
        </Link>
        {s.role === "customer" && <div className="order-last w-full md:order-none md:max-w-xl md:flex-1"><SearchBox placeholder={t("search_ph", s.lang)} /></div>}
        {s.role !== "customer" && (
          <nav className="flex flex-1 gap-1 text-sm font-medium text-muted" aria-label="Primary">
            <Link className="rounded-lg px-3 py-2 hover:bg-surface2" href="/">Storefront</Link>
            <Link className="rounded-lg px-3 py-2 hover:bg-surface2" href={s.role === "seller" ? "/seller" : "/admin"}>{s.role === "seller" ? "Seller portal" : "Admin"}</Link>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          <RoleSwitcher role={s.role} sellerId={s.sellerId} sellers={sellers} lang={s.lang} />
          <ThemeToggle />
          {s.role === "customer" && <CartButton />}
        </div>
      </div>
      {s.role === "customer" && (
        <nav aria-label="Account" className="mx-auto hidden max-w-7xl gap-1 px-4 pb-1.5 text-sm text-muted md:flex">
          <Link href="/search" className="rounded-lg px-2 py-1 hover:bg-surface2 hover:text-fg">{t("shop", s.lang)}</Link>
          <Link href="/orders" className="rounded-lg px-2 py-1 hover:bg-surface2 hover:text-fg">{t("orders", s.lang)}</Link>
          <Link href="/.well-known/ucp" className="rounded-lg px-2 py-1 hover:bg-surface2 hover:text-fg">Agent-ready (UCP)</Link>
        </nav>
      )}
    </header>
  );
}
