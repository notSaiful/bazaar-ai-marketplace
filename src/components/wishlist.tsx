"use client";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface Ctx { ids: string[]; has: (id: string) => boolean; toggle: (id: string) => void }
const WishCtx = createContext<Ctx>({ ids: [], has: () => false, toggle: () => {} });
export const useWishlist = () => useContext(WishCtx);

export function WishlistProvider({ initial, children }: { initial: string[]; children: ReactNode }) {
  const [ids, setIds] = useState(initial);
  const router = useRouter();
  const path = usePathname();
  const toggle = useCallback(
    (id: string) => {
      setIds((cur) => {
        const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur].slice(0, 100);
        document.cookie = `wl=${next.join(".")}; path=/; max-age=31536000; samesite=lax`;
        return next;
      });
      if (path === "/wishlist") router.refresh();
    },
    [path, router],
  );
  const value = useMemo(() => ({ ids, has: (id: string) => ids.includes(id), toggle }), [ids, toggle]);
  return <WishCtx.Provider value={value}>{children}</WishCtx.Provider>;
}

export function HeartButton({ id, title, className }: { id: string; title: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const on = has(id);
  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      aria-pressed={on}
      aria-label={on ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      className={cn("grid size-9 place-items-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition hover:scale-110 active:scale-95", className)}
    >
      <Heart className={cn("size-4 transition", on ? "fill-bad text-bad" : "text-fg")} />
    </button>
  );
}

export function WishlistCount({ className }: { className?: string }) {
  const { ids } = useWishlist();
  if (!ids.length) return null;
  return <span className={cn("absolute -right-1.5 -top-1.5 grid min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-fg", className)}>{ids.length}</span>;
}
