"use client";
import { useEffect, useState } from "react";

/** Live India time, like a shop's "open now" clock. Renders nothing until mounted to avoid hydration mismatch. */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <span className="inline-block h-10" aria-hidden />;
  const tz = { timeZone: "Asia/Kolkata" } as const;
  return (
    <span className="block text-right">
      <span className="block text-sm font-medium tabular-nums">{now.toLocaleTimeString("en-IN", { ...tz, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })} IST</span>
      <span className="block text-xs text-muted">{now.toLocaleDateString("en-IN", { ...tz, weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
    </span>
  );
}
