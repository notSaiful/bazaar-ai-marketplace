/**
 * Razorpay Checkout + Route design. With RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET set, orders are
 * created via the Orders API and payments verified by HMAC signature. Without keys the app
 * uses a realistic mock checkout (/pay/[id]) that drives the same capture + ledger code path.
 */
import crypto from "node:crypto";

export const razorpayConfigured = () => !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;
export const WEBHOOK_SECRET = () => process.env.RAZORPAY_WEBHOOK_SECRET || "demo_webhook_secret";

export async function createRazorpayOrder(amountPaise: number, receipt: string) {
  if (!razorpayConfigured()) return null;
  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes: { receipt } }),
  });
  if (!res.ok) return null;
  return (await res.json()) as { id: string };
}

export function hmac(body: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

export function verifySignature(body: string, signature: string | null, secret = WEBHOOK_SECRET()) {
  if (!signature) return false;
  const expected = Buffer.from(hmac(body, secret));
  const got = Buffer.from(signature);
  return expected.length === got.length && crypto.timingSafeEqual(expected, got);
}

/** Checkout-handler signature: HMAC(order_id|payment_id) with the key secret. */
export function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string) {
  if (!process.env.RAZORPAY_KEY_SECRET) return false;
  return verifySignature(`${orderId}|${paymentId}`, signature, process.env.RAZORPAY_KEY_SECRET);
}
