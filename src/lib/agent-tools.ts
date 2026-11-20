/**
 * Agent-native commerce tools shared by the MCP endpoint (/api/mcp) and REST (/api/agent/*).
 * Server-side authority: prices and stock are re-read from the database on every call; the agent never
 * supplies a price. Checkout returns a pay link for a human (the agent cannot pay). Order status is scoped
 * to the cart token that created it.
 */
import { z } from "zod";
import { formatINR } from "./money";
import { search } from "./search";
import { createAgentCart, createCheckout, db, getProduct, getSeller, isVisible, priceCart } from "./store";

const Id = z.string().min(1).max(64);
export const TOOLS = [
  { name: "search_products", description: "Search the catalogue in English, Hindi or Hinglish. Returns products with live prices (INR) and stock.", inputSchema: { type: "object", properties: { query: { type: "string" }, max_price_inr: { type: "number" }, category: { type: "string", enum: ["apparel", "home", "jewellery", "food", "electronics"] }, limit: { type: "integer", minimum: 1, maximum: 20 } }, required: ["query"] } },
  { name: "get_product", description: "Get one product by id with price, stock, seller and attributes.", inputSchema: { type: "object", properties: { product_id: { type: "string" } }, required: ["product_id"] } },
  { name: "create_cart", description: "Create a multi-seller cart. Prices come from the server. Returns cart_id and cart_token (keep it secret).", inputSchema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { product_id: { type: "string" }, quantity: { type: "integer", minimum: 1 } }, required: ["product_id", "quantity"] } } }, required: ["items"] } },
  { name: "create_checkout", description: "Start checkout for a cart. Returns a pay_url that a human must open to pay (test mode). The agent cannot complete payment.", inputSchema: { type: "object", properties: { cart_id: { type: "string" }, cart_token: { type: "string" }, buyer: { type: "object", properties: { name: { type: "string" }, phone: { type: "string" }, address: { type: "string" }, city: { type: "string" }, pincode: { type: "string" } }, required: ["name", "phone", "address", "city", "pincode"] } }, required: ["cart_id", "cart_token", "buyer"] } },
  { name: "get_order_status", description: "Poll payment and per-seller fulfilment status for a checkout started with the same cart token.", inputSchema: { type: "object", properties: { order_group_id: { type: "string" }, cart_token: { type: "string" } }, required: ["order_group_id", "cart_token"] } },
] as const;

const productView = (id: string) => {
  const p = getProduct(id)!;
  return { product_id: p.id, title: p.title, title_hi: p.titleHi, category: p.category, price_inr: p.price / 100, price_display: formatINR(p.price), in_stock: p.stock > 0, stock: p.stock, seller: getSeller(p.sellerId)?.name, attributes: p.attributes, description: p.description, untrusted_text_fields: ["title", "description"] };
};

export function callTool(name: string, args: unknown, origin: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    switch (name) {
      case "search_products": {
        const a = z.object({ query: z.string().max(200), max_price_inr: z.number().positive().optional(), category: z.string().optional(), limit: z.number().int().min(1).max(20).default(8) }).parse(args);
        const r = search(a.query, { max: a.max_price_inr ? Math.round(a.max_price_inr * 100) : undefined, category: a.category, limit: a.limit });
        return { ok: true, data: { count: r.total, took_ms: r.ms, results: r.hits.map((h) => ({ ...productView(h.product.id), match_reason: h.why })) } };
      }
      case "get_product": {
        const a = z.object({ product_id: Id }).parse(args);
        const p = getProduct(a.product_id);
        if (!p || !isVisible(p)) return { ok: false, error: "Product not found" };
        return { ok: true, data: productView(p.id) };
      }
      case "create_cart": {
        const a = z.object({ items: z.array(z.object({ product_id: Id, quantity: z.number().int().min(1).max(50) })).min(1).max(30) }).parse(args);
        const lines = a.items.map((i) => ({ productId: i.product_id, qty: i.quantity }));
        const priced = priceCart(lines);
        if (!priced.groups.length) return { ok: false, error: priced.issues[0] ?? "No purchasable items" };
        const cart = createAgentCart(priced.groups.flatMap((g) => g.lines.map((l) => ({ productId: l.product.id, qty: l.qty }))));
        return { ok: true, data: { cart_id: cart.id, cart_token: cart.token, total_inr: priced.total / 100, total_display: formatINR(priced.total), notes: priced.issues, sellers: priced.groups.map((g) => ({ seller: g.seller.name, subtotal_inr: g.subtotal / 100, lines: g.lines.map((l) => ({ product_id: l.product.id, title: l.product.title, quantity: l.qty, unit_price_inr: l.product.price / 100 })) })) } };
      }
      case "create_checkout": {
        const a = z.object({ cart_id: Id, cart_token: z.string(), buyer: z.object({ name: z.string().min(2).max(80), phone: z.string().max(20), address: z.string().min(5).max(200), city: z.string().min(2).max(60), pincode: z.string() }) }).parse(args);
        const cart = db().agentCarts.find((c) => c.id === a.cart_id && c.token === a.cart_token);
        if (!cart) return { ok: false, error: "Unknown cart or bad token" };
        if (cart.groupId) return { ok: false, error: "Checkout already created for this cart" };
        const r = createCheckout({ customerId: `agent_${cart.id}`, customerName: a.buyer.name, phone: a.buyer.phone, address: a.buyer.address, city: a.buyer.city, pincode: a.buyer.pincode, lines: cart.lines, source: "agent" });
        if ("error" in r) return { ok: false, error: r.error };
        cart.groupId = r.group.id;
        return { ok: true, data: { order_group_id: r.group.id, total_inr: r.group.total / 100, status: "pending_payment", pay_url: `${origin}/pay/${r.group.id}`, expires_at: r.group.expiresAt, note: "A human must open pay_url to pay (test mode). Stock is reserved until expires_at. Poll get_order_status." } };
      }
      case "get_order_status": {
        const a = z.object({ order_group_id: Id, cart_token: z.string() }).parse(args);
        const cart = db().agentCarts.find((c) => c.groupId === a.order_group_id && c.token === a.cart_token);
        if (!cart) return { ok: false, error: "Not found for this token" }; // scoped to caller
        const g = db().groups.find((x) => x.id === a.order_group_id)!;
        return { ok: true, data: { order_group_id: g.id, payment_status: g.status, total_inr: g.total / 100, seller_orders: db().orders.filter((o) => o.groupId === g.id).map((o) => ({ seller: getSeller(o.sellerId)?.name, status: o.status, gross_inr: o.gross / 100 })) } };
      }
      default:
        return { ok: false, error: `Unknown tool ${name}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof z.ZodError ? `Invalid arguments: ${e.issues.map((i) => i.path.join(".") + " " + i.message).join("; ")}` : "Tool error" };
  }
}
