"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, ShoppingBag, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "./cart";
import { WishlistCount } from "./wishlist";

/** Phone-only tab bar from the PRD storefront mockup. */
export function BottomNav() {
  const path = usePathname();
  const { count, setOpen } = useCart();
  const tab = "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] transition-colors";
  const on = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));
  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Categories", icon: LayoutGrid },
    { href: "/wishlist", label: "Wishlist", icon: Heart },
  ];
  return (
    <nav aria-label="Tabs" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
      <div className="flex">
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} aria-current={on(href) ? "page" : undefined} className={cn(tab, on(href) ? "font-semibold text-fg" : "text-muted")}>
            <span className="relative"><Icon className="size-5" />{href === "/wishlist" && <WishlistCount className="-right-2.5 -top-2 min-w-4 text-[10px]" />}</span>
            {label}
          </Link>
        ))}
        <button onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`} className={cn(tab, "text-muted")}>
          <span className="relative">
            <ShoppingBag className="size-5" />
            {count > 0 && <span className="absolute -right-2.5 -top-2 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">{count}</span>}
          </span>
          Cart
        </button>
        <Link href="/account" aria-current={on("/account") ? "page" : undefined} className={cn(tab, on("/account") ? "font-semibold text-fg" : "text-muted")}>
          <UserRound className="size-5" />
          Account
        </Link>
      </div>
    </nav>
  );
}
