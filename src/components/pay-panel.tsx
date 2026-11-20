"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, QrCode, ShieldCheck, TestTube } from "lucide-react";
import { useCart } from "./cart";
import { Badge, Card, btn } from "./ui";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export function PayPanel({ groupId, total, sellers, expiresAt }: { groupId: string; total: number; sellers: { name: string; amount: number }[]; expiresAt: string }) {
  const router = useRouter();
  const { clear } = useCart();
  const [method, setMethod] = useState<"upi" | "card">("upi");
  const [busy, setBusy] = useState<null | "success" | "failure">(null);
  const [failed, setFailed] = useState(false);

  async function pay(outcome: "success" | "failure") {
    setBusy(outcome);
    setFailed(false);
    await new Promise((r) => setTimeout(r, 900)); // feels like a real gateway round-trip
    const r = await fetch("/api/payments/mock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ groupId, outcome }) });
    const j = await r.json();
    setBusy(null);
    if (outcome === "success" && r.ok && !j.error) { clear(); router.push(`/orders/${groupId}?paid=1`); }
    else setFailed(true);
  }
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between bg-[#0b2a4a] px-5 py-4 text-white">
          <div><div className="text-xs opacity-70">Razorpay Checkout · Test mode</div><div className="text-lg font-semibold">Bazaar AI</div></div>
          <div className="text-right"><div className="text-xs opacity-70">Amount</div><div className="text-xl font-bold tabular-nums">{formatINR(total)}</div></div>
        </div>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Payment method">
            {([["upi", "UPI", QrCode], ["card", "Card", CreditCard]] as const).map(([k, l, I]) => (
              <button key={k} role="tab" aria-selected={method === k} onClick={() => setMethod(k)} className={cn("flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium", method === k ? "border-accent bg-accent-soft text-accent" : "border-line")}><I className="size-4" />{l}</button>
            ))}
          </div>
          {method === "upi" ? <div><label htmlFor="upi" className="mb-1 block text-sm font-medium">UPI ID</label><input id="upi" defaultValue="success@razorpay" className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm" /></div> : (
            <div className="space-y-3"><div><label htmlFor="cn" className="mb-1 block text-sm font-medium">Test card</label><input id="cn" defaultValue="4111 1111 1111 1111" className="h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm" /></div><div className="grid grid-cols-2 gap-3"><input aria-label="Expiry" defaultValue="12/30" className="h-10 rounded-xl border border-line bg-surface px-3 text-sm" /><input aria-label="CVV" defaultValue="123" className="h-10 rounded-xl border border-line bg-surface px-3 text-sm" /></div></div>
          )}
          {failed && <p role="alert" className="rounded-lg bg-bad/15 px-3 py-2 text-sm text-bad">Payment failed. Your cart is safe and reserved stock was released. You can try again from checkout.</p>}
          <button disabled={!!busy} onClick={() => pay("success")} className={cn(btn("primary", "lg"), "w-full")}>{busy === "success" ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />} Pay {formatINR(total)}</button>
          <button disabled={!!busy} onClick={() => pay("failure")} className={cn(btn("ghost", "sm"), "w-full text-muted")}>{busy === "failure" ? <Loader2 className="size-4 animate-spin" /> : <TestTube className="size-4" />} Simulate a failed payment</button>
        </div>
      </Card>
      <Card className="p-4 text-sm">
        <div className="mb-2 flex items-center justify-between font-medium">How this payment is split <Badge tone="accent">simulated Route</Badge></div>
        {sellers.map((s) => <div key={s.name} className="flex justify-between text-muted"><span>{s.name}</span><span className="tabular-nums">{formatINR(s.amount)}</span></div>)}
        <p className="mt-2 text-xs text-muted">One payment, one order per seller. Reservation expires {new Date(expiresAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}. No real money moves in test mode.</p>
      </Card>
    </div>
  );
}
