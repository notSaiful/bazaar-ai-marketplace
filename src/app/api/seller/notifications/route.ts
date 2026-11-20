import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";
export async function GET() {
  const s = await getSession();
  if (s.role !== "seller") return NextResponse.json({ items: [] });
  return NextResponse.json({ items: db().notifications.filter((n) => n.sellerId === s.sellerId).slice(-5) });
}
