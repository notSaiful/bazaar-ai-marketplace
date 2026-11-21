"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useT } from "./lang";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const t = useT();
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  return (
    <button
      aria-label={t("theme.toggle")}
      className="grid size-9 place-items-center rounded-lg border border-line bg-surface transition hover:bg-surface2"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
      }}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}
