"use client";
import Link from "next/link";
import { useT } from "@/components/lang";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-md space-y-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{t("error.title")}</h1>
      <p className="text-muted">{t("error.body")}</p>
      <div className="flex justify-center gap-3">
        <button onClick={reset} className="rounded-xl bg-accent px-4 py-2 text-accent-fg">{t("action.tryAgain")}</button>
        <Link href="/" className="rounded-xl border border-line px-4 py-2">{t("nav.home")}</Link>
      </div>
    </div>
  );
}
