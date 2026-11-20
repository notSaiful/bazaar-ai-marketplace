"use client";
import { useRouter } from "next/navigation";

export function LangToggle({ lang }: { lang: string }) {
  const router = useRouter();
  return (
    <button className="hover:text-fg" onClick={async () => { await fetch(`/api/role?lang=${lang === "hi" ? "en" : "hi"}`, { method: "POST" }); router.refresh(); }}>
      {lang === "hi" ? "English" : "हिंदी"}
    </button>
  );
}
