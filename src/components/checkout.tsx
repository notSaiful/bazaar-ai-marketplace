"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Lock } from "lucide-react";
import { CartLines, useCart, usePricedCart } from "./cart";
import { Card, btn, inputCls, Skeleton } from "./ui";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export function CartPageClient() {
  const data = usePricedCart();
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <CartLines />
      {data && data.groups.length > 0 && (
        <Card className="h-fit space-y-3 p-5">
          <h2 className="font-semibold">Order summary</h2>
          {data.groups.map((g) => <div key={g.seller.id} className="flex justify-between text-sm"><span className="text-muted">{g.seller.name}</span><span className="tabular-nums">{formatINR(g.subtotal)}</span></div>)}
          <div className="flex justify-between text-sm"><span className="text-muted">Delivery</span><span className="text-ok">Free</span></div>
          <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><span>Total</span><span className="tabular-nums">{formatINR(data.total)}</span></div>
          <Link href="/checkout" className={cn(btn("primary", "lg"), "w-full")}>Proceed to checkout</Link>
          <p className="text-xs text-muted">{data.groups.length} seller{data.groups.length > 1 ? "s" : ""}, one payment. Sellers ship separately.</p>
        </Card>
      )}
    </div>
  );
}

export function CheckoutForm() {
  const { lines } = useCart();
  const data = usePricedCart();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState("");
  const pinBad = pin.length === 6 && (pin.startsWith("19") || pin.startsWith("79"));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, lines }) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error ?? "Could not start checkout"); setBusy(false); return; }
    router.push(`/pay/${j.groupId}`);
  }

  if (!data) return <Skeleton className="h-96" />;
  if (!data.groups.length) return <p className="text-muted">Your cart is empty. <Link className="text-accent underline" href="/search">Browse products</Link></p>;
  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">Delivery details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="name" className="mb-1 block text-sm font-medium">Full name</label><input id="name" name="name" required defaultValue="Aarav Sharma" autoComplete="name" className={inputCls} /></div>
          <div><label htmlFor="phone" className="mb-1 block text-sm font-medium">Mobile</label><input id="phone" name="phone" required defaultValue="9876543210" inputMode="tel" autoComplete="tel" className={inputCls} /></div>
        </div>
        <div><label htmlFor="address" className="mb-1 block text-sm font-medium">Address</label><input id="address" name="address" required defaultValue="14, Baner Road" autoComplete="street-address" className={inputCls} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="city" className="mb-1 block text-sm font-medium">City</label><input id="city" name="city" required defaultValue="Pune" className={inputCls} /></div>
          <div><label htmlFor="pincode" className="mb-1 block text-sm font-medium">Pincode</label><input id="pincode" name="pincode" required inputMode="numeric" maxLength={6} defaultValue="411045" onChange={(e) => setPin(e.target.value)} aria-describedby="pin-help" className={cn(inputCls, pinBad && "border-bad")} />
            <p id="pin-help" className={cn("mt-1 text-xs", pinBad ? "text-bad" : "text-muted")}>{pinBad ? "We don't deliver to this pincode yet." : "We deliver to most pincodes (try 190001 to see a warning)."}</p></div>
        </div>
        {err && <p role="alert" className="rounded-lg bg-bad/15 px-3 py-2 text-sm text-bad">{err}</p>}
      </Card>
      <Card className="h-fit space-y-3 p-5">
        <h2 className="font-semibold">Order summary</h2>
        {data.groups.map((g) => (
          <div key={g.seller.id} className="rounded-xl bg-surface2 p-3 text-sm">
            <div className="flex justify-between font-medium"><span>{g.seller.name}</span><span className="tabular-nums">{formatINR(g.subtotal)}</span></div>
            <ul className="mt-1 text-xs text-muted">{g.lines.map((l) => <li key={l.product.id}>{l.qty}× {l.product.title}</li>)}</ul>
            <div className="mt-1 text-xs text-muted">Arrives by {g.eta}</div>
          </div>
        ))}
        <div className="flex justify-between border-t border-line pt-3 text-lg font-semibold"><span>You pay</span><span className="tabular-nums">{formatINR(data.total)}</span></div>
        <button disabled={busy || pinBad} className={cn(btn("primary", "lg"), "w-full")}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />} Continue to payment</button>
        <p className="text-xs text-muted">Stock is reserved for 10 minutes while you pay. If payment fails your cart is kept.</p>
      </Card>
    </form>
  );
}
