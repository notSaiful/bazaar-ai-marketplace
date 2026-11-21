"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "./lang";

/** Switches the lang cookie between English and Hindi and re-renders the page on the server. */
export function LangToggle({ lang, compact = false }: { lang: string; compact?: boolean }) {
  const router = useRouter();
  const t = useT();
  const [pending, start] = useTransition();
  const other = lang === "hi" ? "en" : "hi";
  const flip = () => start(async () => { await fetch("/api/role?lang=" + other, { method: "POST" }); router.refresh(); });
  if (!compact) return <button className="hover:text-fg" onClick={flip} aria-busy={pending} lang={other}>{t("lang.switchTo")}</button>;
  return (
    <button
      onClick={flip}
      aria-busy={pending}
      aria-label={t("lang.switchLabel")}
      title={t("lang.switchLabel")}
      className={cn("flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-sm font-medium transition hover:bg-surface2", pending && "opacity-60")}
    >
      <Languages className="size-4" aria-hidden />
      <span lang={other}>{lang === "hi" ? "EN" : "हिं"}</span>
    </button>
  );
}
