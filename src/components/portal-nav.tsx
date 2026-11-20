"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PortalNav({ items }: { items: { href: string; label: string; icon: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Section" className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map((i) => {
        const active = i.href === path || (i.href.split("/").length > 2 && path.startsWith(i.href));
        return <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition", active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface2 hover:text-fg")}><span aria-hidden>{i.icon}</span>{i.label}</Link>;
      })}
    </nav>
  );
}
