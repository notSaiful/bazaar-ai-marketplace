import Link from "next/link";
import { Suspense } from "react";
import { accountName, getSession } from "@/lib/session";
import { db } from "@/lib/store";
import { t } from "@/lib/i18n";
import { sideNavData } from "@/lib/nav";
import { CartButton } from "./cart";
import { RoleSwitcher } from "./role-switcher";
import { HeaderSearch } from "./header-search";
import { ThemeToggle } from "./theme-toggle";
import { AccountMenu } from "./account-menu";
import { MobileNav } from "./side-nav";

export async function Header() {
  const s = await getSession();
  const sellers = db().sellers.map((x) => ({ id: x.id, name: x.name }));
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
        <Suspense><MobileNav d={sideNavData(s)} /></Suspense>
        <Link href="/" className="text-base font-semibold tracking-tight lg:hidden" aria-label="Bazaar AI home">Bazaar</Link>
        {s.role === "customer" ? (
          <HeaderSearch placeholder={t("search_ph", s.lang)} />
        ) : (
          <p className="hidden text-sm text-muted sm:block">{s.role === "seller" ? "Seller workspace" : "Marketplace admin"}</p>
        )}
        <div className="ml-auto flex items-center gap-2">
          <RoleSwitcher role={s.role} sellerId={s.sellerId} sellers={sellers} lang={s.lang} />
          <ThemeToggle />
          <AccountMenu name={accountName(s.role, s.sellerId)} role={s.role} ordersLabel={t("orders", s.lang)} />
          {s.role === "customer" && <CartButton />}
        </div>
      </div>
    </header>
  );
}
