"use client";
import { useEffect, useRef, useState } from "react";
import { Check, Link2, MessageCircle, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "./lang";

/**
 * Share a product or ad. Phones get the native share sheet (WhatsApp, Instagram, …); browsers without
 * it get a small menu with WhatsApp and Copy link. `path` is site-relative, e.g. "/product/p_09".
 */
export function ShareButton({ path, title, className, variant = "outline" }: { path: string; title: string; className?: string; variant?: "outline" | "overlay" }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  const url = () => new URL(path, window.location.origin).toString();
  const text = t("share.text", { title });

  async function share() {
    const data = { title, text, url: url() };
    if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
      try { await navigator.share(data); } catch { /* cancelled */ }
      return;
    }
    setOpen((o) => !o);
  }
  async function copy() {
    try { await navigator.clipboard.writeText(url()); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* blocked */ }
  }

  const base = variant === "overlay"
    ? "grid size-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
    : "inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium transition hover:bg-surface2";
  return (
    <div ref={box} className={cn("relative", className)}>
      <button type="button" onClick={share} aria-haspopup="menu" aria-expanded={open} aria-label={variant === "overlay" ? t("share.button") : undefined} className={base}>
        <Share2 className={variant === "overlay" ? "size-5" : "size-4"} aria-hidden />
        {variant === "outline" && t("share.button")}
      </button>
      {open && (
        <div role="menu" className={cn("pop absolute z-50 w-52 rounded-xl border border-line bg-surface p-1.5 text-fg shadow-xl", variant === "overlay" ? "bottom-0 right-14" : "bottom-full right-0 mb-2")}>
          <a role="menuitem" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${typeof window === "undefined" ? path : url()}`)}`} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface2">
            <MessageCircle className="size-4" aria-hidden /> {t("share.whatsapp")}
          </a>
          <button role="menuitem" type="button" onClick={copy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-surface2">
            {copied ? <Check className="size-4 text-ok" aria-hidden /> : <Link2 className="size-4" aria-hidden />} {copied ? t("share.copied") : t("share.copy")}
          </button>
        </div>
      )}
      <span className="sr-only" aria-live="polite">{copied ? t("share.copied") : ""}</span>
    </div>
  );
}
