import Link from "next/link";
import { LogoMark } from "./logo";
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
import { WishlistCount } from "./wishlist";
import { Clapperboard, Heart } from "lucide-react";
import { LangToggle } from "./lang-toggle";

export async function Header() {
  const s = await getSession();
  const shop = s.role === "customer";
  const sellers = db().sellers.map((x) => ({ id: x.id, name: x.name }));
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
      <div className="flex min-h-16 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
        {!shop && <Suspense><MobileNav d={sideNavData(s)} /></Suspense>}
        <Link href="/" className={`flex items-center gap-2 text-base font-semibold tracking-tight ${shop ? "" : "lg:hidden"}`}>
          {shop && <LogoMark className="size-8" />}Bazaar
        </Link>
        {shop ? (
          <HeaderSearch placeholder={t("search_ph", s.lang)} />
        ) : (
          <p className="hidden text-sm text-muted sm:block">{t(s.role === "seller" ? "role.sellerWorkspace" : "role.marketplaceAdmin", s.lang)}</p>
        )}
        <div className="ml-auto flex items-center gap-2">
          <RoleSwitcher role={s.role} sellerId={s.sellerId} sellers={sellers} lang={s.lang} />
          <LangToggle lang={s.lang} compact />
          <ThemeToggle />
          <div className={shop ? "hidden md:block" : undefined}>
            <AccountMenu name={accountName(s.role, s.sellerId)} role={s.role} ordersLabel={t("nav.myOrders", s.lang)} />
          </div>
          {shop && (
            <Link href="/samples" data-tour="samples" className="hidden h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-sm font-medium transition hover:bg-surface2 md:flex">
              <Clapperboard className="size-4" aria-hidden />{t("samples.tab", s.lang)}
            </Link>
          )}
          {shop && (
            <Link href="/wishlist" aria-label={t("nav.wishlist", s.lang)} className="relative hidden size-9 place-items-center rounded-lg border border-line bg-surface transition hover:bg-surface2 md:grid">
              <Heart className="size-4" /><WishlistCount />
            </Link>
          )}
          {shop && <div className="hidden md:block"><CartButton /></div>}
        </div>
      </div>
    </header>
  );
}
