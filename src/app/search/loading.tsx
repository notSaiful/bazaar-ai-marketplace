import { ProductGridSkeleton } from "@/components/product-card";
import { Skeleton } from "@/components/ui";
export default function Loading() {
  return <div><Skeleton className="mb-6 h-10 w-64" /><ProductGridSkeleton n={8} /></div>;
}
