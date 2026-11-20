import { NextResponse } from "next/server";
import { handleRazorpayWebhook } from "@/lib/webhook";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const body = await req.text();
  const r = handleRazorpayWebhook(body, req.headers.get("x-razorpay-signature"));
  return NextResponse.json(r.body, { status: r.status });
}
