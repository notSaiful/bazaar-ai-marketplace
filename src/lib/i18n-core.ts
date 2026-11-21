/**
 * Dictionary-free i18n helpers, safe to import from client components without pulling every phrase
 * into the browser bundle. Server code uses src/lib/i18n.ts (full dictionary + t()).
 */
export type Lang = "en" | "hi";
export type Entry = { en: string; hi: string };
export type Dict = Record<string, Entry>;

/** Replace {name} placeholders. */
export function fill(s: string, vars?: Record<string, string | number>) {
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

const DATE: Record<Lang, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }),
  hi: new Intl.DateTimeFormat("hi-IN-u-nu-latn", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }),
};
const DATETIME: Record<Lang, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }),
  hi: new Intl.DateTimeFormat("hi-IN-u-nu-latn", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }),
};
/** Dates in IST with Hindi month names when lang is "hi" (digits stay Latin, as most Hindi UIs do). */
export const fmtDate = (iso: string | number | Date, lang: Lang) => DATE[lang].format(new Date(iso));
export const fmtDateTime = (iso: string | number | Date, lang: Lang) => DATETIME[lang].format(new Date(iso));
