"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { AddToCart } from "./cart";

/**
 * Phones only: once the main "Add to cart" button scrolls out of view, keep the price and the button
 * pinned just above the tab bar. `targetId` is the id of the main buy box on the page.
 */
export function StickyBuyBar({ targetId, id, stock, price, title }: { targetId: string; id: string; stock: number; price: string; title: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);
  return (
    <div
      data-sticky-buy
      aria-hidden={!show}
      inert={!show}
      className={cn(
        "fixed inset-x-0 bottom-[calc(3.6rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-bg/95 px-4 py-2.5 backdrop-blur-xl transition-transform duration-300 motion-reduce:transition-none md:hidden",
        show ? "translate-y-0" : "pointer-events-none translate-y-[200%]",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-muted">{title}</p>
          <p className="text-base font-semibold tabular-nums">{price}</p>
        </div>
        <AddToCart id={id} stock={stock} className="h-11 shrink-0 px-5" />
      </div>
    </div>
  );
}
