import { NextResponse } from "next/server";
import { z } from "zod";
import { emitMockEvent } from "@/lib/webhook";

export const dynamic = "force-dynamic";
const Body = z.object({ groupId: z.string(), outcome: z.enum(["success", "failure"]) });

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const paymentId = `pay_mock_${Math.random().toString(36).slice(2, 12)}`;
  const r = emitMockEvent(p.data.outcome === "success" ? "payment.captured" : "payment.failed", p.data.groupId, paymentId);
  return NextResponse.json({ ...r.body, paymentId }, { status: r.status });
}
