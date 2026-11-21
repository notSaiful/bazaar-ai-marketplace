"use client";
import Link from "next/link";
import { useT } from "@/components/lang";

// Next 16: retry() re-fetches and re-renders the segment (reset() only re-renders, so it can't recover from a server error).
export default function Error({ retry }: { error: unknown; retry: () => void }) {
  const t = useT();
  return (
    <div className="mx-auto max-w-md space-y-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{t("error.title")}</h1>
      <p className="text-muted">{t("error.body")}</p>
      <div className="flex justify-center gap-3">
        <button onClick={() => retry()} className="rounded-xl bg-accent px-4 py-2 text-accent-fg">{t("action.tryAgain")}</button>
        <Link href="/" className="rounded-xl border border-line px-4 py-2">{t("nav.home")}</Link>
      </div>
    </div>
  );
}
