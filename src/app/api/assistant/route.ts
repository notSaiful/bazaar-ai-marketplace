import { NextResponse } from "next/server";
import { z } from "zod";
import { assistantRespondAI } from "@/lib/assistant-ai";
import { getSession } from "@/lib/session";
import { rateLimit } from "@/lib/store";

export const dynamic = "force-dynamic";
export const maxDuration = 30;
const Body = z.object({ message: z.string().max(500), cart: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).max(50).default([]) });

export async function POST(req: Request) {
  if (!rateLimit(`assistant:${req.headers.get("x-forwarded-for") ?? "local"}`, 30)) return NextResponse.json({ reply: "You're sending messages very fast. Please wait a moment.", cards: [], suggestedCart: [], trace: [] }, { status: 429 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ reply: "I didn't catch that.", cards: [], suggestedCart: [], trace: [] }, { status: 400 });
  const { lang } = await getSession();
  // Claude when ANTHROPIC_API_KEY is set; otherwise (or on any failure) the deterministic assistant.
  return NextResponse.json(await assistantRespondAI(p.data.message, p.data.cart, lang));
}
