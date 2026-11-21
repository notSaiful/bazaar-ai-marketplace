"use client";
import { createContext, useCallback, useContext, type ReactNode } from "react";
import { fill, fmtDate, fmtDateTime, type Lang } from "@/lib/i18n-core";

/**
 * Language for client components. The server passes only the active language's phrases (and no seller
 * phrases to shoppers), so the full dictionary never ships in the browser bundle (PRD NFR-02).
 */
const LangCtx = createContext<{ lang: Lang; msgs: Record<string, string> }>({ lang: "en", msgs: {} });

export function LangProvider({ lang, msgs, children }: { lang: Lang; msgs: Record<string, string>; children: ReactNode }) {
  return <LangCtx.Provider value={{ lang, msgs }}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx).lang;

/** const t = useT(); t("nav.cart") or t("nav.productsLive", { n: 3 }) */
export function useT() {
  const { msgs } = useContext(LangCtx);
  return useCallback((key: string, vars?: Record<string, string | number>) => fill(msgs[key] ?? key, vars), [msgs]);
}

export function useDates() {
  const lang = useLang();
  return { date: (d: string | number | Date) => fmtDate(d, lang), dateTime: (d: string | number | Date) => fmtDateTime(d, lang) };
}
