import { NextResponse } from "next/server";
import { capturePayment } from "@/lib/store";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { persistState } from "@/lib/persist";

export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { groupId?: string; razorpay_order_id?: string; razorpay_payment_id?: string; razorpay_signature?: string };
  if (!b.groupId || !b.razorpay_order_id || !b.razorpay_payment_id || !b.razorpay_signature || !verifyCheckoutSignature(b.razorpay_order_id, b.razorpay_payment_id, b.razorpay_signature))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  const r = capturePayment(b.groupId, b.razorpay_payment_id);
  await persistState();
  return NextResponse.json(r);
}
