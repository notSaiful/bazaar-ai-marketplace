import { NextResponse } from "next/server";
import { copilotAnswer } from "@/lib/copilot";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const s = await getSession();
  if (s.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
  const b = (await req.json().catch(() => ({}))) as { q?: string };
  return NextResponse.json(copilotAnswer(String(b.q ?? "").slice(0, 300)));
}
