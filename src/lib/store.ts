/**
 * Local data layer (used whenever Supabase env vars are absent).
 * Mirrors the Postgres schema in /supabase/migrations: sellers, products, order_groups,
 * orders(+items), ledger_entries, payouts, audit_log. Money is integer paise; every ledger
 * event is double-entry (debits == credits). State lives on globalThis so route handlers and
 * server actions share it. Swap this module for a Supabase repository without touching callers.
 */
import { AD_SEED, PRODUCT_SEED, SELLER_SEED } from "./catalog";
import { KEY_RE } from "./media-store";
import { MAX_CAPTION, MAX_VIDEO_BYTES, MAX_VIDEO_SECONDS, MIN_VIDEO_SECONDS, VIDEO_MIME } from "./video";
import { lineCommission, type Paise } from "./money";
import { hid, requestStore, decodeLog, type LogEntry } from "./state";
import type {
  Ad,
  Review,
  AuditEntry,
  CartLine,
  LedgerEntry,
  Order,
  OrderGroup,
  OrderStatus,
  Payout,
  Product,
  ProductStatus,
  Seller,
  SellerStatus,
} from "./types";

interface DB {
  sellers: Seller[];
  products: Product[];
  ads: Ad[];
  groups: OrderGroup[];
  orders: Order[];
  ledger: LedgerEntry[];
  payouts: Payout[];
  audit: AuditEntry[];
  notifications: { id: string; sellerId: string; text: string; at: string }[];
  processedPayments: Set<string>;
  seq: number;
  entrySeq: number;
}

/**
 * State model: every visitor's DB = deterministic seed + replay of their mutation log (see state.ts).
 * `holder()` resolves the current request's state (or a global one outside a request, e.g. evals).
 */
interface Holder {
  db: DB;
  log: LogEntry[];
  depth: number; // >0 while seeding/replaying/inside a logged call: nested calls are not logged
  clockAt: number | null; // virtual clock so replay is deterministic
  dirty: boolean;
}
const G = globalThis as unknown as { __bzSeed?: string; __bzGlobal?: Holder; __bzRate?: Map<string, number[]>; __bzAgent?: Record<string, { paidAt: string; total: number }> };
const REQ = new WeakMap<object, Holder>();
let override: Holder | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FN: Record<string, (...a: any[]) => unknown> = {};

const clock = () => (holder().clockAt ?? Date.now());
const nowISO = () => new Date(clock()).toISOString();
const uid = (d: DB, p: string) => `${p}_${(++d.seq).toString(36)}`;

function emptyDB(): DB {
  return { sellers: structuredClone(SELLER_SEED), products: structuredClone(PRODUCT_SEED), ads: structuredClone(AD_SEED), groups: [], orders: [], ledger: [], payouts: [], audit: [], notifications: [], processedPayments: new Set(), seq: 100, entrySeq: 0 };
}

function seededDB(): DB {
  if (!G.__bzSeed) {
    const h: Holder = { db: emptyDB(), log: [], depth: 1, clockAt: null, dirty: false };
    const prev = override;
    override = h;
    try { seedOrders(h.db); } finally { override = prev; }
    G.__bzSeed = JSON.stringify({ ...h.db, processedPayments: [...h.db.processedPayments] });
  }
  const o = JSON.parse(G.__bzSeed) as DB & { processedPayments: string[] };
  return { ...o, processedPayments: new Set(o.processedPayments) };
}

function buildHolder(log: LogEntry[]): Holder {
  const h: Holder = { db: seededDB(), log: [], depth: 1, clockAt: null, dirty: false };
  const prev = override;
  override = h; // replay entries resolve their state through this holder
  try {
    for (const [name, args, at] of log) {
      try {
        h.clockAt = at;
        const r = FN[name]?.(...args);
        if (r && typeof r === "object" && "error" in r) continue; // skip entries that no longer apply
        h.log.push([name, args, at]);
      } catch { /* skip a bad entry rather than losing the session */ }
    }
  } finally {
    h.clockAt = null;
    h.depth = 0;
    override = prev;
  }
  return h;
}

export function holder(): Holder {
  if (override) return override;
  const rs = requestStore();
  if (!rs) return (G.__bzGlobal ??= buildHolder([]));
  let h = REQ.get(rs);
  if (!h) {
    h = buildHolder(decodeLog((n) => rs.cookies.get(n)?.value));
    REQ.set(rs, h);
  }
  return h;
}

export function db(): DB {
  const d = holder().db;
  expireStale(d);
  return d;
}

/** Runs fn against a throwaway state rebuilt from `log` (tests / diagnostics). */
export function withLog<T>(log: LogEntry[], fn: () => T): T {
  const prev = override;
  override = buildHolder(log);
  try { return fn(); } finally { override = prev; }
}
export const exportLog = (): LogEntry[] => holder().log.map((e) => [e[0], e[1], e[2]] as LogEntry);
export const isDirty = () => holder().dirty;
export const markClean = () => { holder().dirty = false; };
export const stateSnapshot = () => { const d = holder().db; return JSON.stringify({ ...d, processedPayments: [...d.processedPayments] }); };

/** Clears this visitor's log: state returns to the pristine seed. */
export function resetDemo() {
  const h = holder();
  h.db = seededDB();
  h.log = [];
  h.dirty = true;
  return h.db;
}

function logged<A extends unknown[], R>(name: string, fn: (...a: A) => R): (...a: A) => R {
  FN[name] = fn as (...a: unknown[]) => unknown;
  return (...a: A): R => {
    const h = holder();
    if (h.depth > 0) return fn(...a);
    const callAt = Date.now();
    h.depth++;
    h.clockAt = callAt;
    try {
      const r = fn(...a);
      const ok = r && typeof r === "object" && !("error" in r) && !(r as { duplicate?: boolean }).duplicate;
      if (ok) {
        const args = name === "saveProduct" ? a.map((x: unknown, i: number) => (i === 1 && x && typeof x === "object" ? { ...(x as object), image: undefined } : x)) : a;
        h.log.push([name, JSON.parse(JSON.stringify(args)) as unknown[], callAt]);
        h.dirty = true;
      }
      return r;
    } finally {
      h.depth--;
      h.clockAt = null;
    }
  };
}

/* ---------------- reads ---------------- */

export const getSeller = (id: string) => db().sellers.find((s) => s.id === id);
export const getProduct = (id: string) => db().products.find((p) => p.id === id);
export const sellerActive = (id: string) => getSeller(id)?.status === "active";

export function isVisible(p: Product) {
  return p.status === "live" && sellerActive(p.sellerId);
}
export const liveProducts = () => db().products.filter(isVisible);

/* ---------------- cart pricing (server is the price authority) ---------------- */

export interface PricedLine {
  product: Product;
  qty: number;
  lineTotal: Paise;
  issue?: string;
}
export interface PricedGroup {
  seller: Seller;
  lines: PricedLine[];
  subtotal: Paise;
  eta: string;
  /** Same delivery estimate as an ISO date, so the UI can format it per language. */
  etaAt: string;
}
export interface PricedCart {
  groups: PricedGroup[];
  total: Paise;
  count: number;
  issues: string[];
}

export function priceCart(lines: CartLine[]): PricedCart {
  const issues: string[] = [];
  const bySeller = new Map<string, PricedGroup>();
  for (const l of lines) {
    const p = getProduct(l.productId);
    if (!p || !isVisible(p)) {
      issues.push(`${p?.title ?? l.productId} is no longer available`);
      continue;
    }
    let qty = Math.max(1, Math.floor(l.qty) || 1);
    let issue: string | undefined;
    if (p.stock <= 0) {
      issues.push(`${p.title} is out of stock`);
      continue;
    }
    if (qty > p.stock) {
      qty = p.stock;
      issue = `Only ${p.stock} left`;
      issues.push(`${p.title}: only ${p.stock} left, quantity adjusted`);
    }
    const seller = getSeller(p.sellerId)!;
    const g = bySeller.get(seller.id) ?? { seller, lines: [], subtotal: 0, eta: etaFor(seller.city), etaAt: etaAt(seller.city) };
    g.lines.push({ product: p, qty, lineTotal: p.price * qty, issue });
    g.subtotal += p.price * qty;
    bySeller.set(seller.id, g);
  }
  const groups = [...bySeller.values()];
  return {
    groups,
    total: groups.reduce((a, g) => a + g.subtotal, 0),
    count: groups.reduce((a, g) => a + g.lines.reduce((x, l) => x + l.qty, 0), 0),
    issues,
  };
}

const etaDays = (city: string) => (["Jaipur", "Moradabad"].includes(city) ? 3 : 4);
const etaAt = (city: string) => new Date(clock() + etaDays(city) * 864e5).toISOString();
function etaFor(city: string) {
  return new Date(etaAt(city)).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function checkPincode(pin: string): { ok: boolean; reason?: string } {
  if (!/^[1-9]\d{5}$/.test(pin)) return { ok: false, reason: "Enter a valid 6-digit pincode" };
  if (pin.startsWith("19") || pin.startsWith("79")) return { ok: false, reason: "Sorry, we don't deliver to this pincode yet" };
  return { ok: true };
}

/* ---------------- checkout, stock reservation, payment ---------------- */

export interface CheckoutInput {
  customerId: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  pincode: string;
  lines: CartLine[];
  source?: OrderGroup["source"];
  /** Optional fixed id (seed data, agent checkout claims). Otherwise derived from the content. */
  id?: string;
}

export const checkoutId = (customerId: string, at: string, lines: CartLine[]) => hid("grp", customerId, at, lines);

function createCheckout_(input: CheckoutInput, at = nowISO()): { group: OrderGroup; orders: Order[] } | { error: string } {
  const d = db();
  const pc = checkPincode(input.pincode);
  if (!pc.ok) return { error: pc.reason! };
  if (!input.customerName.trim() || !input.address.trim()) return { error: "Name and address are required" };
  const priced = priceCart(input.lines);
  if (!priced.groups.length) return { error: priced.issues[0] ?? "Cart is empty" };

  // Atomic reservation: check everything, then decrement everything, in one synchronous section.
  for (const g of priced.groups) for (const l of g.lines) if (l.product.stock < l.qty) return { error: `${l.product.title} just sold out` };
  for (const g of priced.groups) for (const l of g.lines) l.product.stock -= l.qty;

  const group: OrderGroup = {
    id: input.id ?? checkoutId(input.customerId, at, input.lines),
    customerId: input.customerId,
    customerName: input.customerName.trim(),
    phone: input.phone,
    address: input.address.trim(),
    city: input.city,
    pincode: input.pincode,
    total: priced.total,
    status: "pending_payment",
    source: input.source ?? "web",
    createdAt: at,
    expiresAt: new Date(clock() + 10 * 60_000).toISOString(),
  };
  const orders: Order[] = priced.groups.map((g) => {
    const items = g.lines.map((l) => {
      const bps = g.seller.commissionBps; // rate snapshotted at purchase
      return {
        productId: l.product.id,
        title: l.product.title,
        qty: l.qty,
        unitPrice: l.product.price,
        lineTotal: l.lineTotal,
        commissionBps: bps,
        commission: lineCommission(l.lineTotal, bps),
      };
    });
    const gross = items.reduce((a, i) => a + i.lineTotal, 0);
    const commission = items.reduce((a, i) => a + i.commission, 0);
    return {
      id: `ord_${group.id.slice(4)}_${priced.groups.indexOf(g)}`,
      groupId: group.id,
      sellerId: g.seller.id,
      status: "pending_payment" as OrderStatus,
      items,
      gross,
      commission,
      payout: gross - commission,
      refunded: 0,
      refundedCommission: 0,
      tracking: [{ status: "pending_payment" as OrderStatus, at, note: "Awaiting payment" }],
      createdAt: at,
    };
  });
  d.groups.push(group);
  d.orders.push(...orders);
  return { group, orders };
}

function expireStale(d: DB) {
  const t = clock();
  for (const g of d.groups) if (g.status === "pending_payment" && new Date(g.expiresAt).getTime() < t) releaseGroup(d, g, "expired");
}

function releaseGroup(d: DB, g: OrderGroup, status: "failed" | "expired") {
  if (g.status !== "pending_payment") return;
  g.status = status;
  for (const o of d.orders.filter((o) => o.groupId === g.id)) {
    for (const it of o.items) {
      const p = d.products.find((p) => p.id === it.productId);
      if (p) p.stock += it.qty; // release reservation
    }
    o.status = "cancelled";
    o.tracking.push({ status: "cancelled", at: nowISO(), note: status === "failed" ? "Payment failed; stock released" : "Payment window expired; stock released" });
  }
}

function failPayment_(groupId: string) {
  const d = db();
  const g = d.groups.find((x) => x.id === groupId);
  if (!g) return { error: "Order not found" };
  releaseGroup(d, g, "failed");
  return { ok: true };
}

function post(d: DB, e: Omit<LedgerEntry, "id">) {
  d.ledger.push({ id: `le_${++d.entrySeq}`, ...e });
}

/** Idempotent: a replayed paymentId never creates a second capture. */
function capturePayment_(groupId: string, paymentId: string, at = nowISO(), via = "razorpay_test") {
  const d = db();
  if (d.processedPayments.has(paymentId)) return { ok: true as const, duplicate: true as const };
  const g = d.groups.find((x) => x.id === groupId);
  if (!g) return { error: "Order group not found" };
  if (g.status !== "pending_payment") return { error: `Order group is ${g.status}; payment cannot be applied` };
  d.processedPayments.add(paymentId);
  g.status = "paid";
  g.paymentId = paymentId;
  if (g.source === "agent") (G.__bzAgent ??= {})[g.id] = { paidAt: at, total: g.total }; // best-effort, instance-local
  for (const o of d.orders.filter((o) => o.groupId === g.id)) {
    o.status = "placed";
    o.tracking.push({ status: "placed", at, note: `Payment captured (${via})` });
    const eventId = `evt_pay_${o.id}`;
    const memo = `Order ${o.id} via ${paymentId}`;
    post(d, { eventId, eventType: "payment_captured", account: "gateway_clearing", debit: o.gross, credit: 0, orderId: o.id, sellerId: o.sellerId, at, memo });
    post(d, { eventId, eventType: "payment_captured", account: `seller_payable:${o.sellerId}`, debit: 0, credit: o.payout, orderId: o.id, sellerId: o.sellerId, at, memo });
    post(d, { eventId, eventType: "payment_captured", account: "platform_commission", debit: 0, credit: o.commission, orderId: o.id, sellerId: o.sellerId, at, memo });
    d.notifications.push({ id: uid(d, "n"), sellerId: o.sellerId, at, text: `New order ${o.id.slice(-6).toUpperCase()}: ${o.items.reduce((a, i) => a + i.qty, 0)} item(s)` });
  }
  return { ok: true as const, group: g };
}

/* ---------------- fulfilment & refunds ---------------- */

export const NEXT: Record<string, OrderStatus[]> = {
  placed: ["accepted"],
  accepted: ["packed"],
  packed: ["shipped"],
  shipped: ["delivered"],
};

function advanceOrder_(orderId: string, to: OrderStatus, sellerId: string | null, at = nowISO()) {
  const d = db();
  const o = d.orders.find((x) => x.id === orderId);
  if (!o) return { error: "Order not found" };
  if (sellerId && o.sellerId !== sellerId) return { error: "Not your order" };
  if (!NEXT[o.status]?.includes(to)) return { error: `Invalid transition: ${o.status} → ${to}` };
  o.status = to;
  o.tracking.push({ status: to, at });
  return { ok: true };
}

function refundOrder_(orderId: string, actor: string, at = nowISO()) {
  const d = db();
  const o = d.orders.find((x) => x.id === orderId);
  if (!o) return { error: "Order not found" };
  if (!["placed", "accepted", "packed", "shipped", "delivered"].includes(o.status)) return { error: `Cannot refund an order that is ${o.status}` };
  const restock = ["placed", "accepted", "packed"].includes(o.status); // policy: restock only if not yet shipped
  const eventId = `evt_refund_${o.id}`;
  const memo = `Refund order ${o.id} by ${actor}`;
  // Reverse exactly what was credited: seller payout and platform commission go back to the buyer.
  post(d, { eventId, eventType: "refund", account: `seller_payable:${o.sellerId}`, debit: o.payout, credit: 0, orderId: o.id, sellerId: o.sellerId, at, memo });
  post(d, { eventId, eventType: "refund", account: "platform_commission", debit: o.commission, credit: 0, orderId: o.id, sellerId: o.sellerId, at, memo });
  post(d, { eventId, eventType: "refund", account: "gateway_clearing", debit: 0, credit: o.gross, orderId: o.id, sellerId: o.sellerId, at, memo });
  o.refunded = o.gross;
  o.refundedCommission = o.commission;
  if (restock) for (const it of o.items) { const p = d.products.find((p) => p.id === it.productId); if (p) p.stock += it.qty; }
  o.status = "refunded";
  o.tracking.push({ status: "refunded", at, note: restock ? "Refunded; stock restored" : "Refunded (already shipped; stock not restored)" });
  logAudit(actor, "refund_order", o.id);
  return { ok: true };
}

/* ---------------- ledger, balances, payouts ---------------- */

export function sellerBalance(sellerId: string): Paise {
  const acct = `seller_payable:${sellerId}`;
  return db().ledger.filter((e) => e.account === acct).reduce((a, e) => a + e.credit - e.debit, 0);
}

export function sellerEarnings(sellerId: string) {
  const d = db();
  const mine = d.orders.filter((o) => o.sellerId === sellerId && !["pending_payment", "cancelled"].includes(o.status));
  const eligible = mine.filter((o) => o.status === "delivered" && !o.settled);
  const escrow = mine.filter((o) => ["placed", "accepted", "packed", "shipped"].includes(o.status));
  const paid = d.payouts.filter((p) => p.sellerId === sellerId).reduce((a, p) => a + p.amount, 0);
  const live = mine.filter((o) => o.status !== "refunded");
  return {
    available: eligible.reduce((a, o) => a + o.payout, 0),
    inEscrow: escrow.reduce((a, o) => a + o.payout, 0),
    paidOut: paid,
    ledgerBalance: sellerBalance(sellerId),
    gross: live.reduce((a, o) => a + o.gross, 0),
    commission: live.reduce((a, o) => a + o.commission, 0),
  };
}

function runPayout_(sellerId: string, actor: string, at = nowISO()) {
  const d = db();
  const s = getSeller(sellerId);
  if (!s) return { error: "Seller not found" };
  const eligible = d.orders.filter((o) => o.sellerId === sellerId && o.status === "delivered" && !o.settled);
  const amount = eligible.reduce((a, o) => a + o.payout, 0);
  if (amount <= 0) return { error: "Nothing eligible to pay out" };
  const poId = uid(d, "po");
  const eventId = `evt_payout_${poId}`;
  const memo = `Payout to ${s.name} (simulated Route transfer)`;
  post(d, { eventId, eventType: "payout", account: `seller_payable:${sellerId}`, debit: amount, credit: 0, sellerId, at, memo });
  post(d, { eventId, eventType: "payout", account: "bank_settlement", debit: 0, credit: amount, sellerId, at, memo });
  eligible.forEach((o) => (o.settled = true));
  d.payouts.push({ id: poId, sellerId, amount, status: "paid", createdAt: at, mode: "simulated_route_transfer" });
  logAudit(actor, "run_payout", sellerId);
  return { ok: true, amount };
}

export function reconciliation() {
  const d = db();
  const debit = d.ledger.reduce((a, e) => a + e.debit, 0);
  const credit = d.ledger.reduce((a, e) => a + e.credit, 0);
  const accounts = new Map<string, { debit: number; credit: number }>();
  for (const e of d.ledger) {
    const a = accounts.get(e.account) ?? { debit: 0, credit: 0 };
    a.debit += e.debit;
    a.credit += e.credit;
    accounts.set(e.account, a);
  }
  const ev = new Map<string, number>();
  for (const e of d.ledger) ev.set(e.eventId, (ev.get(e.eventId) ?? 0) + e.debit - e.credit);
  const unbalancedEvents = [...ev.values()].filter((v) => v !== 0).length;
  return {
    debit,
    credit,
    diff: debit - credit,
    unbalancedEvents,
    events: ev.size,
    accounts: [...accounts.entries()].map(([account, v]) => ({ account, ...v })),
  };
}

/* ---------------- analytics (derived from the ledger / orders) ---------------- */

const NOT_SOLD = ["pending_payment", "cancelled"];

export function analytics() {
  const d = db();
  const gmv = d.ledger.filter((e) => e.eventType === "payment_captured" && e.account === "gateway_clearing").reduce((a, e) => a + e.debit, 0);
  const refunded = d.ledger.filter((e) => e.eventType === "refund" && e.account === "gateway_clearing").reduce((a, e) => a + e.credit, 0);
  const commission = d.ledger.filter((e) => e.account === "platform_commission").reduce((a, e) => a + e.credit - e.debit, 0);

  const days: { day: string; gmv: number; commission: number; orders: number }[] = [];
  for (let i = 13; i >= 0; i--) days.push({ day: new Date(clock() - i * 864e5).toISOString().slice(0, 10), gmv: 0, commission: 0, orders: 0 });
  for (const o of d.orders) {
    if (NOT_SOLD.includes(o.status)) continue;
    const day = days.find((x) => x.day === o.createdAt.slice(0, 10));
    if (day) {
      day.gmv += o.gross;
      day.commission += o.commission;
      day.orders += 1;
    }
  }
  const bySeller = d.sellers
    .map((s) => {
      const os = d.orders.filter((o) => o.sellerId === s.id && ![...NOT_SOLD, "refunded"].includes(o.status));
      return { id: s.id, name: s.name, gmv: os.reduce((a, o) => a + o.gross, 0), commission: os.reduce((a, o) => a + o.commission, 0), orders: os.length };
    })
    .filter((x) => x.gmv > 0)
    .sort((a, b) => b.gmv - a.gmv);
  const catMap = new Map<string, number>();
  for (const o of d.orders) {
    if ([...NOT_SOLD, "refunded"].includes(o.status)) continue;
    for (const it of o.items) {
      const cat = d.products.find((p) => p.id === it.productId)?.category ?? "other";
      catMap.set(cat, (catMap.get(cat) ?? 0) + it.lineTotal);
    }
  }
  const paidOrders = d.orders.filter((o) => !NOT_SOLD.includes(o.status));
  return {
    gmv,
    refunded,
    commission,
    netGmv: gmv - refunded,
    orders: paidOrders.length,
    aov: paidOrders.length ? Math.round(gmv / paidOrders.length) : 0,
    days,
    bySeller,
    categories: [...catMap.entries()].map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value),
  };
}

export function sellerSeries(sellerId: string) {
  const d = db();
  const days: { day: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) days.push({ day: new Date(clock() - i * 864e5).toISOString().slice(0, 10), value: 0 });
  for (const o of d.orders.filter((o) => o.sellerId === sellerId && ![...NOT_SOLD, "refunded"].includes(o.status))) {
    const day = days.find((x) => x.day === o.createdAt.slice(0, 10));
    if (day) day.value += o.gross;
  }
  return days;
}

/* ---------------- seller & admin mutations ---------------- */

export function logAudit(actor: string, action: string, target: string) {
  const d = holder().db;
  d.audit.unshift({ id: uid(d, "au"), actor, action, target, at: nowISO() });
}

function registerSeller_(input: { name: string; tagline: string; city: string; bankLast4: string; gstin?: string }) {
  const d = db();
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "store";
  const s: Seller = {
    id: uid(d, "s"),
    name: input.name,
    slug: `${slug}-${d.sellers.length}`,
    tagline: input.tagline || "New on Bazaar AI",
    city: input.city,
    emoji: "🏪",
    hue: parseInt(hid("h", input.name).slice(2, 6), 16) % 360,
    status: "pending",
    commissionBps: 1000,
    bankLast4: input.bankLast4,
    gstin: input.gstin,
    rating: 0,
    joinedAt: nowISO(),
  };
  d.sellers.push(s);
  return s;
}

export interface ProductInput {
  id?: string;
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  category: string;
  tags: string[];
  attributes: Record<string, string>;
  price: Paise;
  mrp: Paise;
  stock: number;
  hue: number;
  emoji: string;
  image?: string;
  publish: boolean;
  aiGenerated?: boolean;
}

const INJECTION = /ignore (all )?(previous|prior) instructions|system:|you are now|reveal .*prompt|100% discount/i;
export const looksLikeInjection = (s: string) => INJECTION.test(s);

export function moderate(p: { title: string; description: string; price: Paise; mrp: Paise }): string | undefined {
  if (INJECTION.test(p.title + " " + p.description)) return "Text contains instructions aimed at AI agents (prompt-injection pattern).";
  if (p.mrp > 0 && p.price < p.mrp * 0.2) return "Price is more than 80% below MRP; possible pricing error or bait listing.";
  return undefined;
}

function saveProduct_(sellerId: string, input: ProductInput) {
  const d = db();
  const s = getSeller(sellerId);
  if (!s) return { error: "Seller not found" };
  if (input.title.trim().length < 3) return { error: "Title is too short" };
  if (!(input.price > 0)) return { error: "Price must be greater than zero" };
  if (input.stock < 0 || !Number.isInteger(input.stock)) return { error: "Stock cannot be negative" };
  if (input.mrp < input.price) input.mrp = input.price;
  if (input.publish && s.status !== "active") return { error: s.status === "pending" ? "Your store is pending approval. Save as a draft until an admin approves it." : "Your store is suspended." };
  const flag = input.publish ? moderate(input) : undefined;
  const status: ProductStatus = !input.publish ? "draft" : flag ? "flagged" : "live";
  const t = nowISO();
  let p = input.id ? d.products.find((x) => x.id === input.id) : undefined;
  if (p && p.sellerId !== sellerId) return { error: "Not your product" };
  if (!p) {
    p = {
      id: uid(d, "p"), sellerId, title: "", titleHi: "", description: "", descriptionHi: "", category: "home", tags: [], attributes: {},
      price: 0, mrp: 0, stock: 0, lowStockThreshold: 5, status: "draft", hue: 20, emoji: "📦", rating: 0, reviews: [], createdAt: t, updatedAt: t,
    };
    d.products.push(p);
  }
  Object.assign(p, {
    title: input.title.trim(), titleHi: input.titleHi, description: input.description, descriptionHi: input.descriptionHi,
    category: input.category, tags: input.tags, attributes: input.attributes, price: input.price, mrp: input.mrp,
    stock: input.stock, hue: input.hue, emoji: input.emoji, image: input.image ?? p.image, status, flagReason: flag,
    aiGenerated: input.aiGenerated ?? p.aiGenerated, updatedAt: t,
  });
  return { ok: true as const, product: p, flagged: !!flag };
}

function setStock_(sellerId: string, productId: string, stock: number) {
  const p = getProduct(productId);
  if (!p || p.sellerId !== sellerId) return { error: "Not your product" };
  if (!Number.isInteger(stock) || stock < 0) return { error: "Stock cannot go below zero" };
  p.stock = stock;
  p.updatedAt = nowISO();
  return { ok: true };
}

function archiveProduct_(sellerId: string, productId: string) {
  const p = getProduct(productId);
  if (!p || p.sellerId !== sellerId) return { error: "Not your product" };
  p.status = "archived";
  return { ok: true };
}

function setSellerStatus_(id: string, status: SellerStatus, actor: string) {
  const s = getSeller(id);
  if (!s) return { error: "Seller not found" };
  s.status = status;
  logAudit(actor, `seller_${status}`, id);
  return { ok: true };
}

function setCommission_(id: string, bps: number, actor: string) {
  const s = getSeller(id);
  if (!s) return { error: "Seller not found" };
  if (!Number.isInteger(bps) || bps < 0 || bps > 5000) return { error: "Rate must be between 0% and 50%" };
  s.commissionBps = bps; // applies to future orders only; past lines keep their snapshot
  logAudit(actor, `set_commission_${bps}bps`, id);
  return { ok: true };
}

function setProductStatus_(id: string, status: ProductStatus, note: string, actor: string) {
  const p = getProduct(id);
  if (!p) return { error: "Product not found" };
  p.status = status;
  p.moderationNote = note;
  if (status === "live") p.flagReason = undefined;
  logAudit(actor, `product_${status}`, id);
  return { ok: true };
}

/* ---------------- reviews (untrusted customer input) ---------------- */

export interface ReviewInput { author: string; stars: number; text: string }
const round1 = (n: number) => Math.round(n * 10) / 10;
/** Strip control characters and collapse whitespace; reviews are shown as plain text only. */
const cleanText = (v: unknown, max: number) => String(v ?? "").replace(/\p{Cc}/gu, " ").replace(/\s+/g, " ").trim().slice(0, max + 1);

/** Reviews customers can see: held ones stay private until an admin publishes them. */
export const publicReviews = (p: Product) => p.reviews.filter((r) => !r.held);

/** True when this customer has a paid order containing the product (drives the "Verified purchase" badge). */
export function hasBought(customerId: string, productId: string) {
  const d = db();
  const paid = new Set(d.groups.filter((g) => g.customerId === customerId && g.status === "paid").map((g) => g.id));
  return d.orders.some((o) => paid.has(o.groupId) && o.status !== "cancelled" && o.items.some((it) => it.productId === productId));
}

function addReview_(productId: string, customerId: string, input: ReviewInput) {
  const p = getProduct(productId);
  if (!p || !isVisible(p)) return { error: "This product is not available for reviews." };
  const stars = Number(input.stars);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) return { error: "Choose a rating from 1 to 5 stars." };
  const author = cleanText(input.author, 40);
  const text = cleanText(input.text, 600);
  if (author.length < 2 || author.length > 40) return { error: "Enter a name between 2 and 40 characters." };
  if (text.length < 10) return { error: "Write at least 10 characters about the product." };
  if (text.length > 600) return { error: "Keep the review under 600 characters." };
  if (p.reviews.some((r) => r.customerId === customerId)) return { error: "You have already reviewed this product." };
  const at = nowISO();
  const held = looksLikeInjection(text) || looksLikeInjection(author);
  const review: Review = {
    id: `rev_${p.id}_${p.reviews.length}_${clock().toString(36)}`,
    author, text, stars, at, customerId,
    verified: hasBought(customerId, productId),
    ...(held ? { held: true, heldReason: "Contains instructions aimed at AI agents (prompt-injection pattern)." } : {}),
  };
  p.reviews.unshift(review);
  if (!held) applyRating(p, stars);
  return { ok: true as const, review, held };
}

function applyRating(p: Product, stars: number) {
  const n = p.ratingCount ?? publicReviews(p).length - 1;
  p.rating = round1((p.rating * Math.max(0, n) + stars) / (Math.max(0, n) + 1));
  p.ratingCount = Math.max(0, n) + 1;
}

/** Admin decision on a held review: publish it (counts toward the rating) or remove it. */
function moderateReview_(productId: string, reviewId: string, decision: "publish" | "remove", actor: string) {
  const p = getProduct(productId);
  const r = p?.reviews.find((x) => x.id === reviewId);
  if (!p || !r) return { error: "Review not found" };
  if (decision === "remove") p.reviews = p.reviews.filter((x) => x !== r);
  else if (r.held) { delete r.held; delete r.heldReason; applyRating(p, r.stars); }
  logAudit(actor, `review_${decision}`, `${p.id}/${reviewId}`);
  return { ok: true as const };
}

/* ---------------- Samples: short video ads (caption is untrusted seller input) ---------------- */

export interface AdInput { productId: string; caption: string; durationSec: number; mime: string; sizeBytes: number; videoKey: string; posterKey?: string }
type AdError = { error: string; code: string };
const adErr = (code: string, error: string): AdError => ({ error, code });
/** Captions with prompt-injection patterns or links (a common scam lure) wait for an admin. */
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|in|net|org|xyz|link|ly)\b)/i;

/** Ads customers can see: live, for a visible product of an active seller. */
export function feedAds() {
  return db().ads.filter((a) => {
    if (a.status !== "live") return false;
    const p = getProduct(a.productId);
    return !!p && isVisible(p) && p.sellerId === a.sellerId;
  });
}
export const sellerAds = (sellerId: string) => db().ads.filter((a) => a.sellerId === sellerId && a.status !== "removed");

function createAd_(sellerId: string, input: AdInput) {
  const seller = getSeller(sellerId);
  if (!seller) return adErr("seller", "Seller not found");
  if (seller.status !== "active") return adErr("not_active", "Your shop must be approved before posting ads.");
  const p = getProduct(input.productId);
  if (!p || p.sellerId !== sellerId) return adErr("product", "Choose one of your own products.");
  if (!isVisible(p)) return adErr("product_hidden", "The product must be live on the storefront.");
  if (!(VIDEO_MIME as readonly string[]).includes(input.mime)) return adErr("type", "Upload an MP4 or MOV video.");
  if (!(input.sizeBytes > 0) || input.sizeBytes > MAX_VIDEO_BYTES) return adErr("too_big", "The video file is too large.");
  if (!(input.durationSec >= MIN_VIDEO_SECONDS) || input.durationSec > MAX_VIDEO_SECONDS) return adErr("too_long", "Videos must be 3 to 60 seconds long.");
  if (!KEY_RE.test(input.videoKey) || !input.videoKey.startsWith("vid_") || (input.posterKey && (!KEY_RE.test(input.posterKey) || !input.posterKey.startsWith("img_")))) return adErr("key", "Upload failed. Please try again.");
  const caption = cleanText(input.caption, MAX_CAPTION);
  if (caption.length < 3) return adErr("caption_short", "Write a short caption (at least 3 characters).");
  if (caption.length > MAX_CAPTION) return adErr("caption_long", "Keep the caption under 150 characters.");
  const reason = looksLikeInjection(caption) ? "Caption contains instructions aimed at AI agents (prompt-injection pattern)." : LINK.test(caption) ? "Caption contains a link or web address." : undefined;
  const ad: Ad = {
    // Time + sequence: unique even for two uploads in the same millisecond, and deterministic on replay.
    id: `ad_u${clock().toString(36)}_${db().ads.length.toString(36)}`,
    sellerId, productId: p.id, caption,
    video: `/api/media/${input.videoKey}`,
    poster: input.posterKey ? `/api/media/${input.posterKey}` : undefined,
    durationSec: Math.round(input.durationSec * 10) / 10, mime: input.mime, sizeBytes: input.sizeBytes,
    status: reason ? "held" : "live", heldReason: reason, createdAt: nowISO(),
  };
  db().ads.unshift(ad);
  return { ok: true as const, ad, held: !!reason };
}

/** Admin decision on a held ad, or a seller removing their own ad. */
function moderateAd_(adId: string, decision: "publish" | "remove", actor: string) {
  const a = db().ads.find((x) => x.id === adId);
  if (!a) return { error: "Ad not found" };
  if (actor !== "admin" && actor !== a.sellerId) return { error: "Not your ad" };
  if (decision === "publish" && actor !== "admin") return { error: "Only an admin can publish a held ad" };
  if (decision === "remove") a.status = "removed";
  else { a.status = "live"; delete a.heldReason; }
  logAudit(actor, `ad_${decision}`, adId);
  return { ok: true as const };
}

/* ---------------- anomalies (fraud / review queue) ---------------- */

export function anomalies() {
  const d = db();
  const out: { id: string; kind: string; target: string; productId?: string; reviewId?: string; adId?: string; held?: boolean; sellerId?: string; reason: string }[] = [];
  for (const p of d.products) {
    if (p.status === "flagged") out.push({ id: `f_${p.id}`, kind: "listing", target: p.title, productId: p.id, sellerId: p.sellerId, reason: p.flagReason ?? "Flagged for review" });
    for (const [i, r] of p.reviews.entries()) if (r.held || INJECTION.test(r.text)) out.push({ id: `r_${r.id ?? `${p.id}_${i}`}`, kind: "review", target: p.title, productId: p.id, reviewId: r.id, sellerId: p.sellerId, held: !!r.held, reason: `Review by ${r.author} contains instructions aimed at AI agents.` });
  }
  const byCust = new Map<string, number>();
  for (const g of d.groups) if (g.status === "paid" && clock() - new Date(g.createdAt).getTime() < 2 * 864e5) byCust.set(g.customerId, (byCust.get(g.customerId) ?? 0) + 1);
  for (const ad of d.ads) if (ad.status === "held") out.push({ id: `a_${ad.id}`, kind: "ad", target: getProduct(ad.productId)?.title ?? ad.productId, productId: ad.productId, adId: ad.id, held: true, sellerId: ad.sellerId, reason: ad.heldReason ?? "Held for review" });
  for (const [c, n] of byCust) if (n >= 4) out.push({ id: `c_${c}`, kind: "buyer", target: c, reason: `${n} paid orders in 48 hours (velocity check).` });
  return out;
}


/** Per-instance, best-effort rate limit (abuse protection, not state). */
export function rateLimit(key: string, limit: number, windowMs = 60_000) {
  const m = (G.__bzRate ??= new Map<string, number[]>());
  const t = Date.now();
  const hits = (m.get(key) ?? []).filter((x) => t - x < windowMs);
  if (hits.length >= limit) { m.set(key, hits); return false; }
  hits.push(t);
  m.set(key, hits);
  return true;
}

export const agentPaid = (groupId: string) => G.__bzAgent?.[groupId];

/* ---------------- demo seed ---------------- */

function seedOrders(d: DB) {
  const base = Math.floor(Date.now() / 864e5) * 864e5 + 12 * 36e5; // today, 12:00 UTC: stable for a whole day
  const T = (daysAgo: number, h = 10) => new Date(base - daysAgo * 864e5 + (h - 12) * 36e5).toISOString();
  const custs: Record<string, [string, string, string]> = {
    cust_demo: ["Aarav Sharma", "Pune", "411001"],
    c2: ["Priya Nair", "Kochi", "682001"],
    c3: ["Rohan Mehta", "Mumbai", "400001"],
    c4: ["Sneha Iyer", "Chennai", "600001"],
    c5: ["Imran Qureshi", "Lucknow", "226001"],
  };
  type Row = [number, string, [string, number][], OrderStatus | "refund_all"];
  const plan: Row[] = [
    [13, "c2", [["p_01", 1], ["p_09", 1]], "delivered"],
    [12, "c3", [["p_30", 2], ["p_32", 1]], "delivered"],
    [11, "cust_demo", [["p_18", 1], ["p_01", 2]], "delivered"],
    [10, "c4", [["p_34", 1], ["p_35", 1], ["p_17", 1]], "delivered"],
    [9, "c5", [["p_10", 1]], "delivered"],
    [8, "c2", [["p_02", 1], ["p_19", 1]], "delivered"],
    [7, "c3", [["p_31", 1], ["p_13", 2], ["p_04", 1]], "delivered"],
    [6, "cust_demo", [["p_36", 1], ["p_14", 1]], "delivered"],
    [5, "c4", [["p_21", 1], ["p_11", 1], ["p_03", 1]], "refund_all"],
    [4, "c5", [["p_33", 2]], "shipped"],
    [3, "cust_demo", [["p_09", 2], ["p_26", 1], ["p_37", 1]], "shipped"],
    [2, "c3", [["p_05", 2], ["p_27", 1]], "packed"],
    [2, "c2", [["p_38", 1], ["p_22", 1]], "accepted"],
    [1, "c4", [["p_15", 1], ["p_06", 1]], "placed"],
    [1, "cust_demo", [["p_12", 1], ["p_28", 1], ["p_23", 1]], "placed"],
    [0, "c5", [["p_35", 1], ["p_07", 1]], "placed"],
  ];
  const chain: OrderStatus[] = ["accepted", "packed", "shipped", "delivered"];
  let refundGroupId: string | undefined;
  plan.forEach(([ago, cid, lines, final], i) => {
    const [name, city, pin] = custs[cid];
    const at = T(ago);
    const r = createCheckout(
      { customerId: cid, customerName: name, phone: "98xxxxxx" + String(10 + i), address: `${12 + i}, MG Road`, city, pincode: pin, lines: lines.map(([productId, qty]) => ({ productId, qty })), source: i % 5 === 3 ? "assistant" : "web", id: `grp_seed_${String(i + 1).padStart(2, "0")}` },
      at,
    );
    if ("error" in r) return;
    capturePayment(r.group.id, `pay_seed${String(i).padStart(3, "0")}`, at, "seed");
    if (final === "refund_all") refundGroupId = r.group.id;
    const target = final === "refund_all" ? "packed" : final;
    for (const o of r.orders) {
      if (target === "placed") break;
      for (const st of chain) {
        o.status = st;
        o.tracking.push({ status: st, at: new Date(new Date(at).getTime() + (chain.indexOf(st) + 1) * 9e6).toISOString() });
        if (st === target) break;
      }
    }
  });
  // "Seller B refunded in full" scenario from the PRD: refund one seller order of the group.
  if (refundGroupId) {
    const o = d.orders.find((o) => o.groupId === refundGroupId && o.sellerId === "s_ghar");
    if (o) refundOrder(o.id, "seed", T(4));
  }
  for (const sid of ["s_rangrez", "s_ghar"]) runPayout(sid, "seed", T(3));
  d.audit = [];
  d.notifications = [];
}

/* ---------------- logged (persisted) mutations ---------------- */
export const createCheckout = logged("createCheckout", createCheckout_);
export const failPayment = logged("failPayment", failPayment_);
export const capturePayment = logged("capturePayment", capturePayment_);
export const advanceOrder = logged("advanceOrder", advanceOrder_);
export const refundOrder = logged("refundOrder", refundOrder_);
export const runPayout = logged("runPayout", runPayout_);
export const registerSeller = logged("registerSeller", registerSeller_);
export const saveProduct = logged("saveProduct", saveProduct_);
export const setStock = logged("setStock", setStock_);
export const archiveProduct = logged("archiveProduct", archiveProduct_);
export const addReview = logged("addReview", addReview_);
export const moderateReview = logged("moderateReview", moderateReview_);
export const createAd = logged("createAd", createAd_);
export const moderateAd = logged("moderateAd", moderateAd_);
export const setSellerStatus = logged("setSellerStatus", setSellerStatus_);
export const setCommission = logged("setCommission", setCommission_);
export const setProductStatus = logged("setProductStatus", setProductStatus_);
