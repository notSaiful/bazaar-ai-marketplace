import Link from "next/link";
import { accountName, getSession } from "@/lib/session";
import { db } from "@/lib/store";
import { t } from "@/lib/i18n";
import { CartButton } from "./cart";
import { RoleSwitcher } from "./role-switcher";
import { HeaderSearch } from "./header-search";
import { ThemeToggle } from "./theme-toggle";
import { AccountMenu } from "./account-menu";

export async function Header() {
  const s = await getSession();
  const sellers = db().sellers.map((x) => ({ id: x.id, name: x.name }));
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-xl font-semibold tracking-tight" aria-label="Bazaar AI home">Bazaar<span className="text-pop">.</span></Link>
        {s.role === "customer" ? (
          <HeaderSearch placeholder={t("search_ph", s.lang)} />
        ) : (
          <nav className="flex flex-1 gap-4 text-sm text-muted" aria-label="Primary">
            <Link className="hover:text-fg" href="/">Store</Link>
            <Link className="hover:text-fg" href={s.role === "seller" ? "/seller" : "/admin"}>{s.role === "seller" ? "My shop" : "Admin"}</Link>
          </nav>
        )}
        <div className="ml-auto flex items-center gap-2">
          {s.role === "customer" && <Link href="/orders" className="hidden px-2 text-sm text-muted hover:text-fg sm:block">{t("orders", s.lang)}</Link>}
          <RoleSwitcher role={s.role} sellerId={s.sellerId} sellers={sellers} lang={s.lang} />
          <ThemeToggle />
          <AccountMenu name={accountName(s.role, s.sellerId)} role={s.role} ordersLabel={t("orders", s.lang)} />
          {s.role === "customer" && <CartButton />}
        </div>
      </div>
    </header>
  );
}
