import { NextResponse } from "next/server";
import { getProduct } from "@/lib/store";

export const dynamic = "force-dynamic";
export function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "").split(",").filter(Boolean).slice(0, 50);
  return NextResponse.json(Object.fromEntries(ids.map((id) => [id, getProduct(id)?.stock ?? 0])), { headers: { "Cache-Control": "no-store" } });
}
