import { cn } from "@/lib/utils";

/**
 * Bazaar mark: a diya (lamp) in a rounded tile. Uses the theme's accent colours, so it inverts in dark
 * mode. Decorative by default (the wordmark next to it carries the name); pass `label` when it stands alone.
 * Brand files for docs and social profiles live in /public/brand.
 */
export function LogoMark({ className, label }: { className?: string; label?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", className)} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <rect width="64" height="64" rx="15" className="fill-accent" />
      <g className="fill-accent-fg">
        <path d="M32 10c4.5 6 7 9.6 7 13.2a7 7 0 0 1-14 0c0-3.6 2.5-7.2 7-13.2z" />
        <path d="M13 34h38c0 9.4-8.5 16-19 16S13 43.4 13 34z" />
        <path d="M49 35l9-4-5 8z" />
        <rect x="26" y="52" width="12" height="3" rx="1.5" />
      </g>
    </svg>
  );
}
