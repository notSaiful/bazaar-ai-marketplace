import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const u = new URL(req.url);
  const c = await cookies();
  const opts = { path: "/", sameSite: "lax" as const, maxAge: 60 * 60 * 24 * 30 };
  const role = u.searchParams.get("role");
  const sid = u.searchParams.get("sid");
  const lang = u.searchParams.get("lang");
  if (role && ["customer", "seller", "admin"].includes(role)) c.set("role", role, opts);
  if (sid) c.set("sid", sid, opts);
  if (lang === "en" || lang === "hi") c.set("lang", lang, opts);
  return NextResponse.json({ ok: true });
}
