import { registerSellerAction } from "@/app/actions";
import { getSeller } from "@/lib/store";
import { getSession } from "@/lib/session";
import { bpsToPct } from "@/lib/money";
import { Badge, Card, PageHeader, btn, inputCls } from "@/components/ui";
import { Flash } from "@/components/flash";

export const metadata = { title: "Seller onboarding" };
export default async function Onboarding({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const sp = await searchParams;
  const s = await getSession();
  const me = getSeller(s.sellerId)!;
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title="Store profile & onboarding" sub="New stores stay pending until an admin approves them." />
      <Flash sp={sp} />
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-3"><span className="text-2xl">{me.emoji}</span><div><div className="font-semibold">{me.name}</div><div className="text-sm text-muted">{me.tagline} · {me.city} · bank ••••{me.bankLast4 ?? "----"}</div></div><Badge tone={me.status === "active" ? "ok" : me.status === "pending" ? "warn" : "bad"}>{me.status}</Badge><Badge>Platform fee {bpsToPct(me.commissionBps)}</Badge></div>
      </Card>
      <Card className="p-5">
        <h2 className="mb-1 font-semibold">Register a new store</h2>
        <p className="mb-4 text-sm text-muted">Creates a pending store and switches you into it. Then approve it from the Admin role to see the full flow.</p>
        <form action={registerSellerAction} className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="name" className="mb-1 block text-sm font-medium">Store name</label><input id="name" name="name" required minLength={3} placeholder="Kumhar Clay Works" className={inputCls} /></div>
          <div><label htmlFor="city" className="mb-1 block text-sm font-medium">City</label><input id="city" name="city" required placeholder="Khurja" className={inputCls} /></div>
          <div className="sm:col-span-2"><label htmlFor="tagline" className="mb-1 block text-sm font-medium">Tagline (optional)</label><input id="tagline" name="tagline" placeholder="Hand-thrown pottery" className={inputCls} /></div>
          <div><label htmlFor="bank" className="mb-1 block text-sm font-medium">Bank account, last 4 digits</label><input id="bank" name="bank" required pattern="\d{4}" inputMode="numeric" maxLength={4} placeholder="1234" className={inputCls} /></div>
          <div><label htmlFor="gstin" className="mb-1 block text-sm font-medium">GSTIN (optional)</label><input id="gstin" name="gstin" className={inputCls} /></div>
          <div className="sm:col-span-2"><button className={btn("primary")}>Submit for approval</button></div>
        </form>
      </Card>
    </div>
  );
}
