import { NextResponse } from "next/server";
import { z } from "zod";
import { priceCart } from "@/lib/store";

export const dynamic = "force-dynamic";
const Body = z.object({ lines: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).max(50) });

/** Public endpoint: return a minimal DTO only (never seller bank/tax/commission fields). */
export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  const c = priceCart(p.data.lines);
  return NextResponse.json({
    total: c.total,
    count: c.count,
    issues: c.issues,
    groups: c.groups.map((g) => ({
      seller: { id: g.seller.id, name: g.seller.name, city: g.seller.city, slug: g.seller.slug },
      eta: g.eta,
      etaAt: g.etaAt,
      subtotal: g.subtotal,
      lines: g.lines.map((l) => ({ qty: l.qty, lineTotal: l.lineTotal, issue: l.issue, product: { id: l.product.id, title: l.product.title, titleHi: l.product.titleHi, price: l.product.price, hue: l.product.hue, emoji: l.product.emoji, image: l.product.image, stock: l.product.stock } })),
    })),
  });
}
