import { NextResponse } from "next/server";
import { claimCheckout } from "@/lib/agent-tools";
import { persistState } from "@/lib/persist";

export const dynamic = "force-dynamic";

/** A human opens an agent's pay link: bring that checkout into their own session, then go pay. */
export async function GET(req: Request) {
  const u = new URL(req.url);
  const r = claimCheckout(u.searchParams.get("c") ?? "");
  if ("error" in r) return NextResponse.redirect(new URL(`/?err=${encodeURIComponent(r.error)}`, u.origin));
  await persistState();
  return NextResponse.redirect(new URL(`/pay/${r.groupId}`, u.origin));
}
