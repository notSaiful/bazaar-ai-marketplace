import { cookies } from "next/headers";
import type { Role } from "./types";
import { getSeller } from "./store";

export interface Session {
  role: Role;
  sellerId: string;
  customerId: string;
  lang: "en" | "hi";
}

export async function getSession(): Promise<Session> {
  const c = await cookies();
  const role = (c.get("role")?.value as Role) || "customer";
  const sid = c.get("sid")?.value || "s_rangrez";
  return {
    role: ["customer", "seller", "admin"].includes(role) ? role : "customer",
    sellerId: getSeller(sid) ? sid : "s_rangrez",
    customerId: "cust_demo",
    lang: c.get("lang")?.value === "hi" ? "hi" : "en",
  };
}

/** Display name for the current demo identity. */
export function accountName(role: Role, sellerId: string) {
  if (role === "seller") return getSeller(sellerId)?.name ?? "Seller";
  if (role === "admin") return "Marketplace admin";
  return "Aarav Sharma";
}

export async function requireRole(role: Role) {
  const s = await getSession();
  if (s.role !== role) throw new Error(`This action needs the ${role} role. Switch role from the header.`);
  return s;
}
