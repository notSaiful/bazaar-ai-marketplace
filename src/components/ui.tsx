import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { fill, type Lang } from "@/lib/i18n-core";
import { ui as DICT } from "@/lib/dict/ui";

const t = (key: string, lang: Lang, vars?: Record<string, string | number>) => fill(DICT[key]?.[lang] ?? DICT[key]?.en ?? key, vars);
import { formatINR, bpsToPct, type Paise } from "@/lib/money";
import type { OrderStatus } from "@/lib/types";

export function btn(variant: "primary" | "secondary" | "ghost" | "danger" | "outline" = "primary", size: "sm" | "md" | "lg" = "md") {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-tight transition duration-150 active:scale-[.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none",
    size === "sm" && "h-8 px-3 text-[13px]",
    size === "md" && "h-9 px-3.5 text-sm",
    size === "lg" && "h-11 px-5 text-sm",
    variant === "primary" && "gloss bg-accent text-accent-fg hover:opacity-90",
    variant === "secondary" && "bg-surface2 text-fg hover:bg-line",
    variant === "outline" && "border border-line bg-surface text-fg hover:bg-surface2",
    variant === "ghost" && "text-fg hover:bg-surface2",
    variant === "danger" && "gloss bg-bad text-white hover:brightness-110",
  );
}

export const inputCls = "h-9 w-full rounded-lg border border-line bg-surface px-3 text-sm text-fg placeholder:text-muted focus-visible:outline-2";

export function Card({ className, children, tabIndex }: { className?: string; children: ReactNode; tabIndex?: number }) {
  return <div tabIndex={tabIndex} className={cn("rounded-xl border border-line bg-surface", className)}>{children}</div>;
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "bad" | "accent"; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        tone === "neutral" && "bg-surface2 text-muted",
        tone === "ok" && "bg-ok/15 text-ok",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "bad" && "bg-bad/15 text-bad",
        tone === "accent" && "bg-accent-soft text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, "neutral" | "ok" | "warn" | "bad" | "accent"> = {
  pending_payment: "warn", placed: "accent", accepted: "accent", packed: "accent", shipped: "accent", delivered: "ok", cancelled: "neutral", refunded: "bad",
  active: "ok", pending: "warn", suspended: "bad", live: "ok", draft: "neutral", flagged: "bad", rejected: "bad", archived: "neutral",
};
/** Pass `lang` to show the status in Hindi. */
export function StatusPill({ status, lang = "en" }: { status: OrderStatus | string; lang?: Lang }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{DICT[`status.${status}`] ? t(`status.${status}`, lang) : status.replace("_", " ")}</Badge>;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden />;
}

export function EmptyState({ emoji = "🧺", title, hint, action }: { emoji?: string; title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <div className="text-5xl" aria-hidden>{emoji}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {hint && <p className="max-w-sm text-sm text-muted">{hint}</p>}
      {action}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: "ok" | "warn" | "bad" }) {
  return (
    <Card className="p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", tone === "warn" && "text-warn", tone === "bad" && "text-bad", tone === "ok" && "text-ok")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </Card>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="rise flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold leading-none tracking-tight sm:text-[40px]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Money({ p, className }: { p: Paise; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatINR(p)}</span>;
}

/** The visible commission split shown on every order. Pass `lang` to show it in Hindi. */
export function SplitBreakdown({ gross, commission, payout, bps, refunded, compact, inline, lang = "en" }: { gross: Paise; commission: Paise; payout: Paise; bps?: number; refunded?: Paise; compact?: boolean; inline?: boolean; lang?: Lang }) {
  const pct = gross ? (commission / gross) * 100 : 0;
  if (inline)
    return (
      <p className="text-sm text-muted tabular-nums">
        {t("checkout.split.totalInline", lang, { amount: formatINR(gross) })} · {t("checkout.split.feeInline", lang, { amount: formatINR(commission) })}{bps !== undefined && ` (${bpsToPct(bps)})`} · <span className="font-medium text-fg">{t("checkout.split.sellerGets", lang, { amount: formatINR(payout) })}</span>
        {!!refunded && <span className="text-bad"> · {t("checkout.split.refunded", lang)}</span>}
      </p>
    );
  return (
    <div className={cn("rounded-xl border border-line bg-surface2 p-3 text-sm", compact && "p-2 text-xs")}>
      <div className="mb-2 flex h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={t("checkout.split.aria", lang, { pct: pct.toFixed(0) })}>
        <div className="bg-accent" style={{ width: `${pct}%` }} />
        <div className="bg-ok" style={{ width: `${100 - pct}%` }} />
      </div>
      <dl className="grid grid-cols-3 gap-2">
        <div><dt className="text-muted">{t("checkout.split.orderTotal", lang)}</dt><dd className="font-semibold tabular-nums">{formatINR(gross)}</dd></div>
        <div><dt className="flex items-center gap-1 text-muted"><span className="size-2 rounded-full bg-accent" />{t("checkout.split.fee", lang)}{bps !== undefined && ` (${bpsToPct(bps)})`}</dt><dd className="font-semibold tabular-nums">{formatINR(commission)}</dd></div>
        <div><dt className="flex items-center gap-1 text-muted"><span className="size-2 rounded-full bg-ok" />{t("checkout.split.payout", lang)}</dt><dd className="font-semibold tabular-nums">{formatINR(payout)}</dd></div>
      </dl>
      {!!refunded && <p className="mt-2 text-bad">{t("checkout.split.refundedNote", lang, { amount: formatINR(refunded) })}</p>}
    </div>
  );
}

const PHOTO = /^\/products\/(p_\w+)\.jpg$/;

/**
 * Product image. Seeded photos have 160w/400w/800w WebP copies (npm run photos), served via srcset so a
 * 180px card never downloads the 800px original. `sizes` should describe the rendered width.
 */
export function ProductArt({ src, alt, className, eager, sizes = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" }: { src: string; alt: string; className?: string; eager?: boolean; sizes?: string }) {
  const m = PHOTO.exec(src);
  const set = m ? { src: `/products/${m[1]}-800.webp`, srcSet: `/products/${m[1]}-160.webp 160w, /products/${m[1]}-400.webp 400w, /products/${m[1]}-800.webp 800w`, sizes } : { src };
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...set} alt={alt} width={800} height={800} loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : undefined} decoding={eager ? "sync" : "async"} className={cn("aspect-square w-full object-cover", className)} />;
}

export function TabLink({ href, active, children }: { href: string; active?: boolean; children: ReactNode }) {
  return (
    <Link href={href} className={cn("whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition", active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface2 hover:text-fg")}>
      {children}
    </Link>
  );
}
