"use client";
import { useEffect, useRef, useState } from "react";
import { BellRing } from "lucide-react";
import { useT } from "./lang";

/** Notification text is stored in English ("New order ABC123: 2 item(s)"); show it in the visitor's language. */
const NEW_ORDER = /^New order (\w+): (\d+) item\(s\)$/;

/** Polls for new-order notifications (Supabase Realtime in production). */
export function SellerNotifier() {
  const tr = useT();
  const label = (text: string) => { const m = NEW_ORDER.exec(text); return m ? tr("seller.toast.newOrder", { id: m[1], n: m[2] }) : text; };
  const seen = useRef<Set<string> | null>(null);
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([]);
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const j = await fetch("/api/seller/notifications", { cache: "no-store" }).then((r) => r.json()).catch(() => null);
      if (!alive || !j) return;
      const ids = new Set<string>(j.items.map((n: { id: string }) => n.id));
      if (seen.current) {
        const fresh = j.items.filter((n: { id: string }) => !seen.current!.has(n.id));
        if (fresh.length) {
          setToasts((t) => [...t, ...fresh]);
          setTimeout(() => setToasts((t) => t.filter((x) => !fresh.some((f: { id: string }) => f.id === x.id))), 6000);
        }
      }
      seen.current = ids;
    };
    tick();
    const t = setInterval(tick, 2500);
    return () => { alive = false; clearInterval(t); };
  }, []);
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className="pop flex items-center gap-2 rounded-xl bg-fg px-4 py-3 text-sm text-bg shadow-xl"><BellRing className="size-4 text-accent" /> {label(t.text)}</div>)}
    </div>
  );
}
