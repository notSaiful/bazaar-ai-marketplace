import { NextResponse } from "next/server";
import { search } from "@/lib/search";

export const dynamic = "force-dynamic";
export function GET(req: Request) {
  const u = new URL(req.url);
  const r = search(u.searchParams.get("q") ?? "", { limit: Number(u.searchParams.get("limit") ?? 6) });
  return NextResponse.json({
    ms: r.ms,
    total: r.total,
    parsed: { intents: r.parsed.intents, maxPrice: r.parsed.maxPrice, tokens: r.parsed.tokens },
    results: r.hits.map((h) => ({ id: h.product.id, title: h.product.title, titleHi: h.product.titleHi, price: h.product.price, category: h.product.category, emoji: h.product.emoji, hue: h.product.hue, image: h.product.image, why: h.why })),
  });
}
