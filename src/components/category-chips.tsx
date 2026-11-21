import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { CATEGORIES } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

/** Round category icons from the PRD storefront mockup. Scrolls sideways on phones. */
export function CategoryChips({ active, hrefFor, lang = "en" }: { active: string; hrefFor: (slug: string) => string; lang?: "en" | "hi" }) {
  const items = [{ slug: "", name: t("shop.all", lang), emoji: "" }, ...CATEGORIES.map((c) => ({ slug: c.slug as string, name: lang === "hi" ? c.nameHi : c.name, emoji: c.emoji as string }))];
  return (
    <nav aria-label={t("nav.categories", lang)} className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:gap-5 sm:px-0">
      {items.map((c) => {
        const on = c.slug === active;
        return (
          <Link key={c.slug || "all"} href={hrefFor(c.slug)} aria-current={on ? "page" : undefined} className="group flex w-[72px] shrink-0 snap-start flex-col items-center gap-2 text-center">
            <span
              className={cn(
                "grid size-14 place-items-center rounded-full border text-2xl transition duration-300 group-hover:-translate-y-0.5",
                on ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface2 group-hover:border-fg/30",
              )}
              aria-hidden
            >
              {c.emoji || <LayoutGrid className="size-5" />}
            </span>
            <span className={cn("line-clamp-2 text-xs leading-tight", on ? "font-semibold text-fg" : "text-muted group-hover:text-fg")}>{c.name}</span>
          </Link>
        );
      })}
    </nav>
  );
}
