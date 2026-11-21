import { NextResponse } from "next/server";
import { z } from "zod";
import { emitMockEvent } from "@/lib/webhook";
import { persistState } from "@/lib/persist";

export const dynamic = "force-dynamic";
const Body = z.object({ groupId: z.string(), outcome: z.enum(["success", "failure"]) });

export async function POST(req: Request) {
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const paymentId = `pay_mock_${p.data.groupId.slice(4)}`; // deterministic: a retry is idempotent
  const r = emitMockEvent(p.data.outcome === "success" ? "payment.captured" : "payment.failed", p.data.groupId, paymentId);
  await persistState();
  return NextResponse.json({ ...r.body, paymentId }, { status: r.status });
}
