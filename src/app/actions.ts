"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import * as store from "@/lib/store";
import { getSession, requireRole } from "@/lib/session";
import { replayLastWebhook } from "@/lib/webhook";
import { rupees } from "@/lib/money";
import type { OrderStatus, ProductStatus, SellerStatus } from "@/lib/types";

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
function back(path: string, kind: "msg" | "err", text: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${kind}=${encodeURIComponent(text)}`);
}

/* ---------- seller ---------- */
export async function registerSellerAction(f: FormData) {
  const name = s(f, "name"), city = s(f, "city"), bank = s(f, "bank");
  if (name.length < 3 || city.length < 2 || !/^\d{4}$/.test(bank)) back("/seller/onboarding", "err", "Enter store name, city and the last 4 digits of your bank account.");
  const seller = store.registerSeller({ name, tagline: s(f, "tagline"), city, bankLast4: bank, gstin: s(f, "gstin") || undefined });
  const c = await cookies();
  c.set("role", "seller", { path: "/" });
  c.set("sid", seller.id, { path: "/" });
  revalidatePath("/", "layout");
  back("/seller", "msg", "Store submitted! It's pending admin approval. You can draft products now; publishing unlocks after approval.");
}

function parseAttrs(txt: string) {
  const out: Record<string, string> = {};
  for (const line of txt.split("\n")) { const i = line.indexOf(":"); if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim(); }
  return out;
}

export async function saveProductAction(f: FormData) {
  const sess = await requireRole("seller");
  const id = s(f, "id") || undefined;
  const target = id ? `/seller/products/${id}` : "/seller/products/new";
  const price = rupees(Number(s(f, "price")));
  const r = store.saveProduct(sess.sellerId, {
    id,
    title: s(f, "title"), titleHi: s(f, "titleHi"), description: s(f, "description"), descriptionHi: s(f, "descriptionHi"),
    category: s(f, "category") || "home",
    tags: s(f, "tags").split(/[,\s]+/).filter(Boolean).slice(0, 20),
    attributes: parseAttrs(String(f.get("attributes") ?? "")),
    price: Number.isFinite(price) ? price : 0,
    mrp: rupees(Number(s(f, "mrp")) || 0),
    stock: Math.floor(Number(s(f, "stock") || 0)),
    hue: Number(s(f, "hue") || 20),
    emoji: s(f, "emoji") || "📦",
    image: (s(f, "image").startsWith("data:image/") && s(f, "image").length < 400_000) ? s(f, "image") : undefined,
    publish: s(f, "publish") === "1",
    aiGenerated: s(f, "aiGenerated") === "1",
  });
  if ("error" in r) back(target, "err", r.error!);
  revalidatePath("/", "layout");
  back("/seller/products", "msg", r.flagged ? "Saved, but flagged for admin review before it goes live." : s(f, "publish") === "1" ? "Published! It's live on the storefront." : "Draft saved.");
}

export async function setStockAction(f: FormData) {
  const sess = await requireRole("seller");
  const r = store.setStock(sess.sellerId, s(f, "id"), Math.floor(Number(s(f, "stock"))));
  const to = s(f, "_back") || "/seller/products";
  revalidatePath("/", "layout");
  if ("error" in r) back(to, "err", r.error!);
  back(to, "msg", "Stock updated. The storefront badge follows within seconds.");
}

export async function archiveProductAction(f: FormData) {
  const sess = await requireRole("seller");
  const r = store.archiveProduct(sess.sellerId, s(f, "id"));
  revalidatePath("/", "layout");
  if ("error" in r) back("/seller/products", "err", r.error!);
  back("/seller/products", "msg", "Product archived.");
}

export async function advanceOrderAction(f: FormData) {
  const sess = await requireRole("seller");
  const r = store.advanceOrder(s(f, "id"), s(f, "to") as OrderStatus, sess.sellerId);
  revalidatePath("/", "layout");
  if ("error" in r) back("/seller/orders", "err", r.error!);
  back("/seller/orders", "msg", `Order marked ${s(f, "to")}. The buyer sees it immediately.`);
}

/* ---------- admin ---------- */
export async function setSellerStatusAction(f: FormData) {
  await requireRole("admin");
  const r = store.setSellerStatus(s(f, "id"), s(f, "status") as SellerStatus, "admin");
  revalidatePath("/", "layout");
  const to = s(f, "_back") || "/admin/sellers";
  if ("error" in r) back(to, "err", r.error!);
  back(to, "msg", `Seller is now ${s(f, "status")}. Storefront visibility updated.`);
}
export async function setCommissionAction(f: FormData) {
  await requireRole("admin");
  const r = store.setCommission(s(f, "id"), Math.round(Number(s(f, "pct")) * 100), "admin");
  if ("error" in r) back("/admin/commission", "err", r.error!);
  back("/admin/commission", "msg", "New rate saved. It applies to future orders only; past orders keep their snapshotted rate.");
}
export async function setProductStatusAction(f: FormData) {
  await requireRole("admin");
  const r = store.setProductStatus(s(f, "id"), s(f, "status") as ProductStatus, s(f, "note"), "admin");
  revalidatePath("/", "layout");
  const to = s(f, "_back") || "/admin/products";
  if ("error" in r) back(to, "err", r.error!);
  back(to, "msg", `Product ${s(f, "status")}.`);
}
export async function refundAction(f: FormData) {
  await requireRole("admin");
  const r = store.refundOrder(s(f, "id"), "admin");
  revalidatePath("/", "layout");
  if ("error" in r) back("/admin/orders", "err", r.error!);
  back("/admin/orders", "msg", "Refunded. Commission and seller payout were reversed in the ledger.");
}
export async function payoutAction(f: FormData) {
  await requireRole("admin");
  const r = store.runPayout(s(f, "id"), "admin");
  if ("error" in r) back("/admin/payouts", "err", r.error!);
  back("/admin/payouts", "msg", "Payout simulated (labelled as a simulated Route transfer) and posted to the ledger.");
}
export async function replayWebhookAction() {
  await requireRole("admin");
  const r = replayLastWebhook();
  if (!r) back("/admin/ledger", "err", "No webhook has been received yet. Complete a test payment first.");
  back("/admin/ledger", "msg", `Replayed the last signed webhook: ${JSON.stringify(r!.body)}. No duplicate order or ledger entry was created.`);
}
export async function resetDemoAction() {
  const sess = await getSession();
  if (sess.role !== "admin") back("/", "err", "Admin only");
  store.resetDemo();
  revalidatePath("/", "layout");
  back("/admin", "msg", "Demo data reset to the seeded state.");
}
