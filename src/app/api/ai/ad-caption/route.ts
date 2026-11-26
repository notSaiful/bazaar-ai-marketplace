import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/session";
import { getProduct, isVisible, rateLimit } from "@/lib/store";
import { generateAdCaption } from "@/lib/ad-caption";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
const Body = z.object({ productId: z.string().max(40) });

/** Seller asks for an AI caption for one of their own live products. */
export async function POST(req: Request) {
  const s = await getSession();
  const fail = (code: string, status: number) => NextResponse.json({ error: t(`seller.ads.err.${code}`, s.lang), code }, { status });
  if (s.role !== "seller") return fail("role", 403);
  if (!rateLimit(`ad-caption:${s.sellerId}`, 10)) return fail("rate", 429);
  const b = Body.safeParse(await req.json().catch(() => null));
  const p = b.success ? getProduct(b.data.productId) : undefined;
  if (!p || p.sellerId !== s.sellerId) return fail("product", 400);
  if (!isVisible(p)) return fail("product_hidden", 400);
  // The product photo, fetched from our own origin (works locally and behind the CDN).
  let image: { data: string; mediaType: "image/webp" } | undefined;
  if (p.image?.startsWith("/products/")) {
    try {
      const res = await fetch(new URL(p.image.replace(/\.jpg$/, "-800.webp"), req.url), { signal: AbortSignal.timeout(5000) });
      if (res.ok) image = { data: Buffer.from(await res.arrayBuffer()).toString("base64"), mediaType: "image/webp" };
    } catch {}
  }
  return NextResponse.json(await generateAdCaption(p, image));
}
