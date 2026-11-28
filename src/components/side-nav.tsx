"use client";
import Link from "next/link";
import { LogoMark } from "./logo";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Bot, Boxes, Clapperboard, Home, Image as ImageIcon, Landmark, LayoutDashboard, Menu, Package, Search, Settings, ShieldAlert, Store, Users, Wallet, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, useT } from "./lang";

export interface SideNavData {
  role: "customer" | "seller" | "admin";
  account: { name: string; initials: string };
  labels: { orders: string; shop: string; categories: string; sellers: string };
  categories: { slug: string; name: string; emoji: string }[];
  makers: { id: string; name: string; emoji: string; hue: number }[];
  live: number;
}

type Item = { href: string; label: string; icon: typeof Home; exact?: boolean };

function NavLink({ href, label, icon: Icon, exact, onNav }: Item & { onNav?: () => void }) {
  const path = usePathname();
  const active = exact ? path === href : path === href || path.startsWith(href + "/");
  return (
    <Link
      href={href}
      onClick={onNav}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
        active ? "bg-surface2 font-medium text-fg" : "text-muted hover:bg-surface2 hover:text-fg",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="px-2.5 pb-1 text-xs font-medium text-muted">{title}</p>
      {children}
    </div>
  );
}

export function SideNavBody({ d, onNav }: { d: SideNavData; onNav?: () => void }) {
  const sp = useSearchParams();
  const path = usePathname();
  const cat = path === "/search" ? sp.get("category") : null;
  const t = useT();
  const lang = useLang();
  const main: Item[] =
    d.role === "seller"
      ? [
          { href: "/seller", label: t("nav.dashboard"), icon: LayoutDashboard, exact: true },
          { href: "/seller/products", label: t("nav.products"), icon: Boxes },
          { href: "/seller/orders", label: t("nav.orders"), icon: Package },
          { href: "/seller/earnings", label: t("nav.earnings"), icon: Wallet },
          { href: "/seller/ads", label: t("seller.nav.ads"), icon: Clapperboard },
          { href: "/", label: t("nav.storefront"), icon: Store, exact: true },
        ]
      : d.role === "admin"
        ? [
            { href: "/admin", label: t("seller.nav.overview"), icon: LayoutDashboard, exact: true },
            { href: "/admin/sellers", label: t("seller.nav.sellers"), icon: Users },
            { href: "/admin/products", label: t("nav.products"), icon: ShieldAlert },
            { href: "/admin/orders", label: t("nav.orders"), icon: Package },
            { href: "/admin/ledger", label: t("seller.nav.money"), icon: Landmark },
            { href: "/", label: t("nav.storefront"), icon: Store, exact: true },
          ]
        : [
            { href: "/", label: t("nav.home"), icon: Home, exact: true },
            { href: "/search", label: d.labels.shop, icon: Search, exact: true },
            { href: "/orders", label: d.labels.orders, icon: Package },
          ];

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-3 py-4">
      {/* Brand / status card */}
      <Link href="/" onClick={onNav} className="flex items-center gap-3 rounded-[10px] border border-line bg-surface p-3 transition hover:bg-surface2">
        <LogoMark className="size-10" />
        <span className="min-w-0">
          <span className="block text-sm font-semibold tracking-tight">Bazaar</span>
          <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="status-dot" aria-hidden /> {t("nav.productsLive", { n: d.live })}
          </span>
        </span>
      </Link>

      <Group title={t("nav.navigation")}>
        {main.map((i) => <NavLink key={i.href} {...i} onNav={onNav} />)}
      </Group>

      {d.role === "customer" && (
        <Group title={d.labels.categories}>
          {d.categories.map((c) => (
            <Link
              key={c.slug}
              href={`/search?category=${c.slug}`}
              onClick={onNav}
              aria-current={cat === c.slug ? "page" : undefined}
              className={cn("flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors", cat === c.slug ? "bg-surface2 font-medium text-fg" : "text-muted hover:bg-surface2 hover:text-fg")}
            >
              <span className="w-4 text-center text-[13px]" aria-hidden>{c.emoji}</span>
              <span className="truncate">{c.name}</span>
            </Link>
          ))}
        </Group>
      )}

      {d.role === "customer" && d.makers.length > 0 && (
        <Group title={d.labels.sellers}>
          {d.makers.slice(0, 6).map((m) => (
            <Link key={m.id} href={`/store/${m.id}`} onClick={onNav} className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-fg">
              <span className="grid size-5 place-items-center rounded-md text-[11px]" style={{ background: `hsl(${m.hue} 70% 90%)` }} aria-hidden>{m.emoji}</span>
              <span className="truncate">{m.name}</span>
            </Link>
          ))}
        </Group>
      )}

      <Group title={t("nav.resources")}>
        <NavLink href="/credits" label={t("nav.photoCredits")} icon={ImageIcon} onNav={onNav} />
        <a href="/.well-known/ucp" onClick={onNav} className="flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm text-muted transition-colors hover:bg-surface2 hover:text-fg">
          <Bot className="size-4" /> {t("nav.forAgents")}
        </a>
      </Group>

      {/* Account card */}
      <Link href="/account" onClick={onNav} className="group mt-auto flex items-center gap-3 rounded-[10px] border border-line p-2.5 transition hover:bg-surface2">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface2 text-xs font-semibold">{d.account.initials}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{d.account.name}</span>
          <span className="block text-xs capitalize text-muted">{lang === "hi" ? t(`role.name.${d.role}`) : d.role}</span>
        </span>
        <Settings className="size-4 text-muted transition group-hover:rotate-45 group-hover:text-fg" />
      </Link>
    </div>
  );
}

export function SideNav({ d }: { d: SideNavData }) {
  const t = useT();
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-line bg-bg lg:block" aria-label={t("nav.sidebar")}>
      <SideNavBody d={d} />
    </aside>
  );
}

export function MobileNav({ d }: { d: SideNavData }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);
  return (
    <>
      <button aria-label={t("nav.openMenu")} aria-expanded={open} onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-lg border border-line bg-surface hover:bg-surface2 lg:hidden">
        <Menu className="size-4" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t("nav.menu")}>
          <button aria-label={t("nav.closeMenu")} className="fade-in absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="slide-in-left absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-bg">
            <button aria-label={t("nav.closeMenu")} onClick={() => setOpen(false)} className="absolute right-3 top-5 grid size-8 place-items-center rounded-lg text-muted hover:bg-surface2 hover:text-fg"><X className="size-4" /></button>
            <SideNavBody d={d} onNav={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

