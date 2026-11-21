"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard, Heart, Home, LayoutGrid, ShoppingBag, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "./cart";
import { WishlistCount } from "./wishlist";
import { useT } from "./lang";

/** Phone-only tab bar from the PRD storefront mockup. */
export function BottomNav() {
  const path = usePathname();
  const { count, setOpen } = useCart();
  const t = useT();
  const dark = path === "/samples";
  const tab = "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors";
  const on = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  const links = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/search", label: t("nav.categories"), icon: LayoutGrid },
    { href: "/samples", label: t("samples.tab"), icon: Clapperboard },
    { href: "/wishlist", label: t("nav.wishlist"), icon: Heart },
  ];
  return (
    <nav aria-label={t("nav.tabs")} className={cn("fixed inset-x-0 bottom-0 z-40 border-t pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden", dark ? "dark-tabs border-white/10 bg-black/85 text-white" : "border-line bg-bg/95")}>
      <div className="flex">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={on(href) ? "page" : undefined} className={cn(tab, on(href) ? (dark ? "font-semibold text-white" : "font-semibold text-fg") : dark ? "text-white/60" : "text-muted")}>
            <span className="relative"><Icon className="size-5" />{href === "/wishlist" && <WishlistCount className="-right-2.5 -top-2 min-w-4 text-[10px]" />}</span>
            {label}
          </Link>
        ))}
        <button onClick={() => setOpen(true)} aria-label={t("shop.nav.openCart", { n: count })} className={cn(tab, dark ? "text-white/60" : "text-muted")}>
          <span className="relative">
            <ShoppingBag className="size-5" />
            {count > 0 && <span className="absolute -right-2.5 -top-2 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">{count}</span>}
          </span>
          {t("nav.cart")}
        </button>
        <Link href="/account" aria-current={on("/account") ? "page" : undefined} className={cn(tab, on("/account") ? (dark ? "font-semibold text-white" : "font-semibold text-fg") : dark ? "text-white/60" : "text-muted")}>
          <UserRound className="size-5" />
          {t("nav.account")}
        </Link>
      </div>
    </nav>
  );
}
