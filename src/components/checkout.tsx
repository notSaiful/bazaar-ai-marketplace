"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { CartLines, useCart, usePricedCart } from "./cart";
import { btn, inputCls, Skeleton } from "./ui";
import { useT } from "./lang";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

export function CartPageClient() {
  const data = usePricedCart();
  const t = useT();
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <CartLines />
      {data && data.groups.length > 0 && (
        <div className="flex items-center justify-between border-t border-line pt-6">
          <div><div className="text-sm text-muted">{t("checkout.total")}</div><div className="text-2xl font-semibold tabular-nums">{formatINR(data.total)}</div></div>
          <Link href="/checkout" className={btn("primary", "lg")}>{t("checkout.checkout")}</Link>
        </div>
      )}
    </div>
  );
}

export function CheckoutForm() {
  const { lines } = useCart();
  const data = usePricedCart();
  const router = useRouter();
  const t = useT();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [pin, setPin] = useState("411045");
  const pinBad = pin.length === 6 && (pin.startsWith("19") || pin.startsWith("79"));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    const r = await fetch("/api/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, lines }) });
    const j = await r.json();
    if (!r.ok) { setErr(j.error ?? t("checkout.form.startFailed")); setBusy(false); return; }
    router.push(`/pay/${j.groupId}`);
  }

  if (!data) return <Skeleton className="mx-auto h-80 max-w-xl" />;
  if (!data.groups.length) return <p className="text-center text-muted">{t("checkout.form.cartEmpty")} <Link className="text-accent underline" href="/search">{t("checkout.browse")}</Link></p>;
  const field = "mb-1 block text-sm text-muted";
  const summary = t("checkout.form.summary", {
    items: t(data.count > 1 ? "checkout.form.items.many" : "checkout.form.items.one", { n: data.count }),
    from: t(data.groups.length > 1 ? "checkout.form.fromSellers.many" : "checkout.form.fromSellers.one", { n: data.groups.length }),
  });
  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="name" className={field}>{t("checkout.form.name")}</label><input id="name" name="name" required defaultValue="Aarav Sharma" autoComplete="name" className={inputCls} /></div>
        <div><label htmlFor="phone" className={field}>{t("checkout.form.mobile")}</label><input id="phone" name="phone" required defaultValue="9876543210" inputMode="tel" autoComplete="tel" className={inputCls} /></div>
      </div>
      <div><label htmlFor="address" className={field}>{t("checkout.form.address")}</label><input id="address" name="address" required defaultValue="14, Baner Road" autoComplete="street-address" className={inputCls} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label htmlFor="city" className={field}>{t("checkout.form.city")}</label><input id="city" name="city" required defaultValue="Pune" className={inputCls} /></div>
        <div><label htmlFor="pincode" className={field}>{t("checkout.form.pincode")}</label><input id="pincode" name="pincode" required inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value)} aria-describedby="pin-help" className={cn(inputCls, pinBad && "border-bad")} />
          {pinBad && <p id="pin-help" className="mt-1 text-xs text-bad">{t("checkout.form.pinBad")}</p>}</div>
      </div>
      {err && <p role="alert" className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad">{err}</p>}
      <div className="space-y-3 border-t border-line pt-6">
        <div className="flex justify-between text-sm text-muted"><span>{summary}</span><span className="text-lg font-semibold tabular-nums text-fg">{formatINR(data.total)}</span></div>
        <button disabled={busy || pinBad} className={cn(btn("primary", "lg"), "w-full")}>{busy && <Loader2 className="size-4 animate-spin" />} {t("checkout.form.continue")}</button>
      </div>
    </form>
  );
}
