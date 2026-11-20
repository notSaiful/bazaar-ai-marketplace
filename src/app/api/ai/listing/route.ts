import { NextResponse } from "next/server";
import { z } from "zod";
import { generateListing } from "@/lib/ai";
import { getSession } from "@/lib/session";
import { rateLimit } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
const Body = z.object({ imageDataUrl: z.string().max(1_500_000).optional(), filename: z.string().max(200).optional(), hint: z.string().max(200).optional() });

export async function POST(req: Request) {
  const s = await getSession();
  if (s.role !== "seller") return NextResponse.json({ error: "Seller role required" }, { status: 403 });
  if (!rateLimit(`listing:${s.sellerId}`, 20)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  // Demo realism: a short delay so the "analysing photo" state is visible even in mock mode.
  if (!process.env.ANTHROPIC_API_KEY) await new Promise((r) => setTimeout(r, 1100));
  return NextResponse.json(await generateListing(p.data));
}
