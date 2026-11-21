import { NextResponse } from "next/server";
import { z } from "zod";
import { createCheckout, db } from "@/lib/store";
import { createRazorpayOrder } from "@/lib/razorpay";
import { getSession } from "@/lib/session";
import { persistState } from "@/lib/persist";

export const dynamic = "force-dynamic";
const Body = z.object({
  name: z.string().min(2).max(80),
  phone: z.string().regex(/^[0-9+ -]{8,15}$/),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(60),
  pincode: z.string(),
  lines: z.array(z.object({ productId: z.string(), qty: z.number().int().min(1).max(99) })).min(1).max(50),
});

export async function POST(req: Request) {
  const s = await getSession();
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Please fill in all fields correctly." }, { status: 400 });
  const r = createCheckout({ customerId: s.customerId, customerName: p.data.name, phone: p.data.phone, address: p.data.address, city: p.data.city, pincode: p.data.pincode, lines: p.data.lines });
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: 409 });
  const rz = await createRazorpayOrder(r.group.total, r.group.id);
  if (rz) db().groups.find((g) => g.id === r.group.id)!.razorpayOrderId = rz.id;
  await persistState();
  return NextResponse.json({ groupId: r.group.id, total: r.group.total, sellers: r.orders.length });
}
