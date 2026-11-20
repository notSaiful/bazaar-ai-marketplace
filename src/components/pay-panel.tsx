"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useCart } from "./cart";
import { btn } from "./ui";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open: () => void } } }

export function PayPanel({ groupId, total, sellers, razorpay }: { groupId: string; total: number; sellers: { name: string; amount: number }[]; razorpay?: { keyId: string; orderId: string } }) {
  const router = useRouter();
  const { clear } = useCart();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const done = () => { clear(); router.push(`/orders/${groupId}?paid=1`); };

  async function payReal() {
    if (!razorpay) return;
    await new Promise<void>((res) => {
      if (window.Razorpay) return res();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => res();
      document.body.appendChild(s);
    });
    new window.Razorpay!({
      key: razorpay.keyId, order_id: razorpay.orderId, amount: total, currency: "INR", name: "Bazaar",
      handler: async (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const v = await fetch("/api/payments/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ groupId, ...r }) });
        if (v.ok) done(); else setFailed(true);
      },
      modal: { ondismiss: () => setBusy(false) },
    }).open();
  }

  async function pay(outcome: "success" | "failure") {
    setBusy(true);
    setFailed(false);
    if (razorpay && outcome === "success") return payReal();
    await new Promise((r) => setTimeout(r, 800)); // feels like a gateway round-trip
    const r = await fetch("/api/payments/mock", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ groupId, outcome }) });
    const j = await r.json();
    setBusy(false);
    if (outcome === "success" && r.ok && !j.error) done(); else setFailed(true);
  }
  return (
    <div className="mx-auto max-w-md space-y-6 text-center">
      <div><div className="text-sm text-muted">You pay</div><div className="text-5xl font-semibold tabular-nums">{formatINR(total)}</div></div>
      <ul className="space-y-1 text-sm text-muted">{sellers.map((s) => <li key={s.name} className="flex justify-between"><span>{s.name}</span><span className="tabular-nums">{formatINR(s.amount)}</span></li>)}</ul>
      {failed && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">Payment failed. Your cart is safe, so you can try again.</p>}
      <button disabled={busy} onClick={() => pay("success")} className={cn(btn("primary", "lg"), "w-full")}>{busy && <Loader2 className="size-4 animate-spin" />} Pay {formatINR(total)}</button>
      <p className="text-xs text-muted">{razorpay ? "Razorpay test mode: UPI or card." : "Test payment, no real money moves."}{!razorpay && <> <button disabled={busy} onClick={() => pay("failure")} className="underline hover:text-fg">Simulate a failure</button></>}</p>
    </div>
  );
}
