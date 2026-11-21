"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { inputCls } from "./ui";

type Theme = "system" | "light" | "dark";

export function AccountSettings({ lang }: { lang: "en" | "hi" }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      setTheme(t === "dark" || t === "light" ? t : "system");
    } catch {}
  }, []);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    const dark = t === "dark" || (t === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    try { if (t === "system") localStorage.removeItem("theme"); else localStorage.setItem("theme", t); } catch {}
  };

  const setLang = (l: string) =>
    start(async () => {
      await fetch(`/api/role?lang=${l}`, { method: "POST" });
      router.refresh();
    });

  const field = "mb-1 block text-sm text-muted";
  return (
    <div className="grid gap-4 sm:grid-cols-2" aria-busy={pending}>
      <div>
        <label htmlFor="pref-lang" className={field}>Language</label>
        <select id="pref-lang" value={lang} disabled={pending} onChange={(e) => setLang(e.target.value)} className={inputCls}>
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
      </div>
      <div>
        <label htmlFor="pref-theme" className={field}>Theme</label>
        <select id="pref-theme" value={theme} onChange={(e) => applyTheme(e.target.value as Theme)} className={inputCls}>
          <option value="system">Match system</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </div>
  );
}
