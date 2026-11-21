"use client";
import { useT } from "./lang";
import { Skeleton } from "./ui";

/** Mirrors ProductCard (square photo, title, seller line, price row) so nothing jumps when real cards arrive. */
export function ProductGridSkeleton({ n = 8 }: { n?: number }) {
  const t = useT();
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4" role="status" aria-label={t("loading.products")}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3" aria-hidden>
          <div className="skeleton aspect-square rounded-xl" />
          <div className="space-y-2 px-1">
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-3 w-1/2" />
            <div className="flex items-center justify-between pt-1"><div className="skeleton h-5 w-16" /><div className="skeleton h-8 w-14 rounded-lg" /></div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Round category icons placeholder, same size as CategoryChips. */
export function ChipsSkeleton({ center = false }: { center?: boolean }) {
  return (
    <div className={`flex gap-3 overflow-hidden sm:gap-5 ${center ? "justify-center" : ""}`} aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex w-[72px] shrink-0 flex-col items-center gap-2">
          <Skeleton className="size-14 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

export function HomeSkeleton() {
  const t = useT();
  return (
    <div className="space-y-12 sm:space-y-16" role="status" aria-label={t("loading.generic")}>
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 pt-2">
        <Skeleton className="h-7 w-72 rounded-lg" />
        <Skeleton className="h-12 w-full max-w-xl" />
        <Skeleton className="h-5 w-80 max-w-full" />
        <Skeleton className="mt-3 h-12 w-full max-w-2xl rounded-lg" />
      </div>
      <ChipsSkeleton center />
      <div>
        <Skeleton className="mb-4 h-5 w-24" />
        <ProductGridSkeleton n={8} />
      </div>
    </div>
  );
}

export function ListingSkeleton({ chips = true }: { chips?: boolean }) {
  const t = useT();
  return (
    <div className="space-y-8" role="status" aria-label={t("loading.generic")}>
      <div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-32" /></div>
      {chips && <ChipsSkeleton />}
      {chips && <Skeleton className="h-9 w-28 rounded-lg" />}
      <ProductGridSkeleton n={8} />
    </div>
  );
}

export function ProductSkeleton() {
  const t = useT();
  return (
    <div className="grid gap-10 md:grid-cols-2" role="status" aria-label={t("loading.product")}>
      <Skeleton className="aspect-square rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-9 w-4/5" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2 pt-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-11/12" /><Skeleton className="h-4 w-3/4" /></div>
        <Skeleton className="h-11 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function PanelSkeleton() {
  const t = useT();
  return (
    <div className="space-y-6" role="status" aria-label={t("loading.generic")}>
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
