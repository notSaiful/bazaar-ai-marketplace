"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ProductArt } from "./ui";

/**
 * ProductArt for below-the-fold sections. Native loading="lazy" starts fetching ~1250px early, which
 * steals bandwidth from the first screen on slow phones; this mounts the <img> only when it is about
 * to scroll into view. A <noscript> copy keeps the image for crawlers and no-JS visitors.
 */
export function DeferredArt({ src, alt, sizes, className, margin = "300px" }: { src: string; alt: string; sizes?: string; className?: string; margin?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { setShow(true); io.disconnect(); }
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return (
    <span ref={box} className="block h-full w-full">
      {show ? (
        <ProductArt src={src} alt={alt} sizes={sizes} className={cn("fade-in", className)} />
      ) : (
        <>
          <span aria-hidden className={cn("block aspect-square w-full bg-surface2", className)} />
          <noscript><ProductArt src={src} alt={alt} sizes={sizes} className={className} /></noscript>
        </>
      )}
    </span>
  );
}
