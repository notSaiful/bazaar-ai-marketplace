"use client";
import dynamic from "next/dynamic";
import { useAfterLoad } from "@/lib/use-after-load";

/**
 * Layout pieces that are not needed for the first screen, loaded only after the page has loaded (see
 * useAfterLoad). The dynamic imports live here, in a client component, because code splitting does not
 * apply when a Server Component (the layout) imports them directly.
 */
const GuidedTour = dynamic(() => import("./guided-tour").then((m) => m.GuidedTour), { ssr: false });
const CompareTray = dynamic(() => import("./compare").then((m) => m.CompareTray), { ssr: false });
const LiveClock = dynamic(() => import("./live-clock").then((m) => m.LiveClock), { ssr: false, loading: () => <ClockSpace /> });

const ClockSpace = () => <span className="inline-block h-10" aria-hidden />;

/** Shoppers only: the first-visit tour and the compare tray. */
export function DeferredShopUI() {
  const ready = useAfterLoad();
  if (!ready) return null;
  return (
    <>
      <CompareTray />
      <GuidedTour />
    </>
  );
}

/** Footer clock (reserves its height so nothing shifts when it appears). */
export function DeferredClock() {
  return useAfterLoad() ? <LiveClock /> : <ClockSpace />;
}
