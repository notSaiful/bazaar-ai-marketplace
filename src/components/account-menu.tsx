"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Package, Settings, UserRound } from "lucide-react";
import { useLang, useT } from "./lang";

export function AccountMenu({ name, role, ordersLabel }: { name: string; role: string; ordersLabel: string }) {
  const t = useT();
  const hi = useLang() === "hi";
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const item = "flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-surface2";
  return (
    <div ref={ref} className="relative">
      <button
        aria-label={t("account.label")}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-lg border border-line bg-surface transition hover:bg-surface2"
      >
        <UserRound className="size-5" />
      </button>
      {open && (
        <div role="menu" className="pop lift absolute right-0 top-11 z-40 w-56 rounded-xl border border-line bg-surface p-1.5">
          <div className="px-3 py-2">
            <div className="truncate text-sm font-medium">{hi && role === "admin" ? t("role.marketplaceAdmin") : name}</div>
            <div className="text-xs capitalize text-muted">{hi ? t(`role.name.${role}`) : role}</div>
          </div>
          <div className="my-1 border-t border-line" />
          <Link role="menuitem" href="/account" className={item}><Settings className="size-4" /> {t("nav.accountSettings")}</Link>
          {role === "customer" && <Link role="menuitem" href="/orders" className={item}><Package className="size-4" /> {ordersLabel}</Link>}
        </div>
      )}
    </div>
  );
}
