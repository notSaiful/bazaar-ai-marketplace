import { NextResponse } from "next/server";
import { callTool } from "@/lib/agent-tools";
import { rateLimit } from "@/lib/store";

export const dynamic = "force-dynamic";
export async function POST(req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!rateLimit(`rest:${req.headers.get("x-forwarded-for") ?? "local"}`, 60)) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  const { name } = await params;
  const r = callTool(name, await req.json().catch(() => ({})), new URL(req.url).origin);
  return NextResponse.json(r.ok ? r.data : { error: r.error }, { status: r.ok ? 200 : 400, headers: { "Access-Control-Allow-Origin": "*" } });
}
