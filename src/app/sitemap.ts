import type { MetadataRoute } from "next";
import { PRODUCT_SEED, SELLER_SEED } from "@/lib/catalog";

export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vendora-marketplace-eight.vercel.app";
  return [
    { url: base },
    { url: `${base}/search` },
    ...SELLER_SEED.filter((s) => s.status === "active").map((s) => ({ url: `${base}/store/${s.id}` })),
    ...PRODUCT_SEED.filter((p) => p.status === "live").map((p) => ({ url: `${base}/product/${p.id}` })),
  ];
}
