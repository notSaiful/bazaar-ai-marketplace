"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PortalNav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Section" className="flex gap-6 overflow-x-auto border-b border-line">
      {items.map((i, idx) => {
        const active = idx === 0 ? path === i.href : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined} className={cn("-mb-px whitespace-nowrap border-b-2 py-3 text-sm transition", active ? "border-accent font-medium text-fg" : "border-transparent text-muted hover:text-fg")}>{i.label}</Link>;
      })}
    </nav>
  );
}
