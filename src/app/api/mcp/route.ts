import { NextResponse } from "next/server";
import { callTool, TOOLS } from "@/lib/agent-tools";
import { rateLimit } from "@/lib/store";

export const dynamic = "force-dynamic";
const H = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "content-type, authorization", "Access-Control-Allow-Methods": "POST, OPTIONS" };
export const OPTIONS = () => new NextResponse(null, { status: 204, headers: H });
export const GET = () => NextResponse.json({ name: "bazaar-ai-mcp", transport: "http-jsonrpc", hint: "POST JSON-RPC 2.0 (initialize, tools/list, tools/call)" }, { headers: H });

type Rpc = { jsonrpc?: string; id?: string | number | null; method?: string; params?: { name?: string; arguments?: unknown } };

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`mcp:${ip}`, 60)) return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32000, message: "Rate limit exceeded" } }, { status: 429, headers: H });
  const body = (await req.json().catch(() => null)) as Rpc | null;
  if (!body || body.jsonrpc !== "2.0" || !body.method) return NextResponse.json({ jsonrpc: "2.0", id: null, error: { code: -32600, message: "Invalid Request" } }, { status: 400, headers: H });
  const id = body.id ?? null;
  const ok = (result: unknown) => NextResponse.json({ jsonrpc: "2.0", id, result }, { headers: H });
  switch (body.method) {
    case "initialize":
      return ok({ protocolVersion: "2025-03-26", capabilities: { tools: {} }, serverInfo: { name: "bazaar-ai", version: "0.1.0" }, instructions: "Search, build a multi-seller cart, then create_checkout to get a pay link for a human. Prices come from the server." });
    case "notifications/initialized":
      return new NextResponse(null, { status: 202, headers: H });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call": {
      const r = callTool(String(body.params?.name ?? ""), body.params?.arguments ?? {}, new URL(req.url).origin);
      return ok({ content: [{ type: "text", text: JSON.stringify(r.ok ? r.data : { error: r.error }) }], isError: !r.ok });
    }
    default:
      return NextResponse.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } }, { headers: H });
  }
}
