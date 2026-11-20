import { NextResponse } from "next/server";
import { z } from "zod";
import { priceCart } from "@/lib/store";

export const dynamic = "force-dynamic";
const Body = z.object({ lines: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).max(50) });

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  return NextResponse.json(priceCart(p.data.lines));
}
