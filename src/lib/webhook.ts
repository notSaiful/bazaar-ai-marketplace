import { capturePayment, failPayment } from "./store";
import { hmac, verifySignature, WEBHOOK_SECRET } from "./razorpay";

export interface WebhookLogEntry { at: string; event: string; paymentId?: string; result: string }
const G = globalThis as unknown as { __whlog?: WebhookLogEntry[]; __lastWebhook?: { body: string; sig: string } };
export const webhookLog = () => (G.__whlog ??= []);

/** Signed, idempotent webhook handler (Razorpay-compatible payload shape). */
export function handleRazorpayWebhook(body: string, signature: string | null) {
  const log = webhookLog();
  const at = new Date().toISOString();
  if (!verifySignature(body, signature)) {
    log.unshift({ at, event: "?", result: "rejected: invalid signature" });
    return { status: 401, body: { error: "invalid signature" } };
  }
  let evt: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string; notes?: { group_id?: string } } } } };
  try { evt = JSON.parse(body); } catch { return { status: 400, body: { error: "bad json" } }; }
  const pay = evt.payload?.payment?.entity;
  const groupId = pay?.notes?.group_id;
  if (!pay?.id || !groupId) return { status: 400, body: { error: "missing payment" } };
  if (evt.event === "payment.captured") {
    const r = capturePayment(groupId, pay.id);
    log.unshift({ at, event: evt.event, paymentId: pay.id, result: "duplicate" in r && r.duplicate ? "duplicate ignored (idempotent)" : "error" in r ? `error: ${r.error}` : "captured; ledger written" });
    return { status: 200, body: r };
  }
  if (evt.event === "payment.failed") {
    failPayment(groupId);
    log.unshift({ at, event: evt.event, paymentId: pay.id, result: "failed; stock released" });
    return { status: 200, body: { ok: true } };
  }
  log.unshift({ at, event: evt.event ?? "?", result: "ignored" });
  return { status: 200, body: { ignored: true } };
}

/** Used by the mock gateway: builds a correctly signed event and routes it through the real handler. */
export function emitMockEvent(event: "payment.captured" | "payment.failed", groupId: string, paymentId: string) {
  const body = JSON.stringify({ event, payload: { payment: { entity: { id: paymentId, order_id: `order_mock_${groupId}`, notes: { group_id: groupId } } } } });
  const sig = hmac(body, WEBHOOK_SECRET());
  G.__lastWebhook = { body, sig };
  return handleRazorpayWebhook(body, sig);
}
export const replayLastWebhook = () => (G.__lastWebhook ? handleRazorpayWebhook(G.__lastWebhook.body, G.__lastWebhook.sig) : null);
