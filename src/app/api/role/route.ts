import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSeller } from "@/lib/store";

/**
 * Demo role switcher. Cookies are HttpOnly. Set DEMO_MODE=off to disable switching to seller/admin
 * (use real auth instead). Demo state is per visitor, so "admin" can only affect the visitor's own session.
 */
export async function POST(req: Request) {
  const u = new URL(req.url);
  const c = await cookies();
  const opts = { path: "/", sameSite: "lax" as const, httpOnly: true, secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30 };
  const role = u.searchParams.get("role");
  const sid = u.searchParams.get("sid");
  const lang = u.searchParams.get("lang");
  const demoOff = process.env.DEMO_MODE === "off";
  if (role && ["customer", "seller", "admin"].includes(role)) {
    if (demoOff && role !== "customer") return NextResponse.json({ error: "Demo role switching is disabled" }, { status: 403 });
    c.set("role", role, opts);
  }
  if (sid) {
    if (demoOff || !getSeller(sid)) return NextResponse.json({ error: "Unknown shop" }, { status: 400 });
    c.set("sid", sid, opts);
  }
  if (lang === "en" || lang === "hi") c.set("lang", lang, opts);
  return NextResponse.json({ ok: true });
}
