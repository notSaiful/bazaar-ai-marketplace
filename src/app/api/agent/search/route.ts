import { NextResponse } from "next/server";
import { callTool } from "@/lib/agent-tools";

export const dynamic = "force-dynamic";
export function GET(req: Request) {
  const u = new URL(req.url);
  const r = callTool("search_products", { query: u.searchParams.get("q") ?? "", limit: 8 }, u.origin);
  return NextResponse.json(r.ok ? r.data : { error: r.error }, { status: r.ok ? 200 : 400, headers: { "Access-Control-Allow-Origin": "*" } });
}
