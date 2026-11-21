import { ProductGridSkeleton } from "./product-card";
import { Skeleton } from "./ui";

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
  return (
    <div className="space-y-12 sm:space-y-16" role="status" aria-label="Loading">
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
  return (
    <div className="space-y-8" role="status" aria-label="Loading">
      <div className="space-y-2"><Skeleton className="h-8 w-56" /><Skeleton className="h-4 w-32" /></div>
      {chips && <ChipsSkeleton />}
      {chips && <Skeleton className="h-9 w-28 rounded-lg" />}
      <ProductGridSkeleton n={8} />
    </div>
  );
}

export function ProductSkeleton() {
  return (
    <div className="grid gap-10 md:grid-cols-2" role="status" aria-label="Loading product">
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
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <Skeleton className="h-9 w-56" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
