/**
 * Guarded shopping agent. Tools read the database only (search_products, get_product, view_cart);
 * every price/stock figure in a reply is formatted from tool results, never generated. Product text and
 * reviews are never interpreted as instructions. Off-topic and manipulation attempts are declined.
 * Deterministic so evals are reproducible; an LLM can be dropped in for phrasing without touching tools.
 */
import { formatINR } from "./money";
import { parseQuery, search } from "./search";
import { getSeller, looksLikeInjection, priceCart } from "./store";
import type { CartLine, Product } from "./types";

export interface AssistantCard {
  id: string;
  title: string;
  price: number;
  sellerName: string;
  stock: number;
  category: string;
  emoji: string;
  hue: number;
  image?: string;
  why: string[];
}
export interface AssistantReply {
  reply: string;
  cards: AssistantCard[];
  /** Lines the UI may add to the cart when the user taps the button. */
  suggestedCart: CartLine[];
  suggestedTotal?: number;
  declined?: boolean;
  trace: { tool: string; args: string; result: string }[];
}

const SHOP_WORDS = /(cart|checkout|order|track|price|cost|gift|budget|buy|add|remove|kharid|chahiye|dikha|dikhao|show|find|search|under|tak|ke liye|suggest|recommend|bundle|combo|stock|available|delivery|sasta|cheap|mera|kya|hai|help|offer|deal)/i;
const OFFTOPIC = /(weather|mausam|president|prime minister|capital of|joke|poem|kavita|python|javascript|code|recipe for|stock market|bitcoin|crypto|homework|essay|translate|who is|kaun hai|news|cricket score|medical|diagnos|loan)/i;
const MANIPULATE = /(ignore (all |your |the )?(previous|prior|above)|system prompt|reveal .*prompt|you are now|developer mode|jailbreak|100% discount|set (the )?price|free of cost|apply .*coupon|change .*price|dan mode)/i;

const card = (p: Product, sellerName: string, why: string[] = []): AssistantCard => ({
  id: p.id, title: p.title, price: p.price, sellerName, stock: p.stock, category: p.category, emoji: p.emoji, hue: p.hue, image: p.image, why,
});


export function assistantRespond(message: string, cart: CartLine[] = []): AssistantReply {
  const trace: AssistantReply["trace"] = [];
  const msg = message.trim().slice(0, 500);
  const base: AssistantReply = { reply: "", cards: [], suggestedCart: [], trace };

  if (!msg) return { ...base, reply: "Tell me what you're looking for. For example: “diwali gift under 2000 for mom”." };
  if (MANIPULATE.test(msg) || looksLikeInjection(msg))
    return { ...base, declined: true, reply: "I can't change prices, discounts or my instructions. Every price comes straight from the seller's catalogue. I'm happy to help you find something within your budget instead." };

  if (/^(hi|hello|hey|namaste|namaskar|hii+|नमस्ते)\b/i.test(msg))
    return { ...base, reply: "Namaste! I can find products, compare sellers and build a cart for you. Try: “sardi ke liye shawl”, “diwali gift 2000 tak”, or “view my cart”." };

  if (/(view|show|dikha|mera|my).*(cart|kart)|^cart$/i.test(msg) || /cart (mein|me) kya/i.test(msg)) {
    const pc = priceCart(cart);
    trace.push({ tool: "view_cart", args: `${cart.length} lines`, result: `${pc.count} items` });
    if (!pc.count) return { ...base, reply: "Your cart is empty. Tell me what you need and I'll add it." };
    const lines = pc.groups.map((g) => `• ${g.seller.name}: ${g.lines.map((l) => `${l.qty}× ${l.product.title}`).join(", ")} (${formatINR(g.subtotal)})`);
    return { ...base, reply: `Your cart has ${pc.count} item(s) from ${pc.groups.length} seller(s):\n${lines.join("\n")}\nTotal ${formatINR(pc.total)}. Say “checkout” when you're ready.` };
  }
  if (/\b(checkout|pay|payment|order kar|place order)\b/i.test(msg)) {
    const pc = priceCart(cart);
    if (!pc.count) return { ...base, reply: "Your cart is empty. Add something first and I'll take you to checkout." };
    return { ...base, reply: `Your total is ${formatINR(pc.total)} across ${pc.groups.length} seller(s). Open the cart and tap Checkout to pay once for everything.` };
  }

  const parsed = parseQuery(msg);
  const looksShopping = SHOP_WORDS.test(msg) || parsed.tokens.length > 0;
  if (OFFTOPIC.test(msg) && !/(shop|buy|cart|gift)/i.test(msg))
    return { ...base, declined: true, reply: "I'm a shopping assistant, so I can only help with finding and buying products from our sellers. What would you like to shop for?" };

  // multi-topic: split "diya aur mithai", "kurta and jhumka"
  const budget = parsed.maxPrice;
  const segments = msg.split(/\s+(?:aur|and|bhi|\+|plus|&)\s+|\s+bhi\b|,/i).map((s) => s.trim()).filter((s) => parseQuery(s).tokens.length > 0 || parseQuery(s).intents.length > 0);
  const picks: { p: Product; why: string[] }[] = [];
  const used = new Set<string>();

  const gather = (q: string, n: number, remaining?: number) => {
    const r = search(q, { max: remaining, limit: 12 });
    trace.push({ tool: "search_products", args: JSON.stringify({ q, maxPaise: remaining ?? null }), result: `${r.total} matches in ${r.ms}ms` });
    const out: typeof picks = [];
    for (const h of r.hits) {
      if (used.has(h.product.id) || h.product.stock < 1) continue;
      if (out.some((o) => o.p.sellerId === h.product.sellerId) && r.hits.some((x) => x.product.sellerId !== h.product.sellerId && !used.has(x.product.id))) continue; // diversify sellers
      out.push({ p: h.product, why: h.why });
      if (out.length >= n) break;
    }
    return out;
  };

  const wantsBundle = /(gift|bundle|combo|hamper|suggest|recommend)/i.test(msg) || segments.length > 1;
  if (segments.length > 1) {
    // Every part of the request gets one item; the budget is shared fairly (unspent money carries forward).
    let remaining = budget;
    segments.forEach((seg, i) => {
      const share = remaining === undefined ? undefined : Math.floor(remaining / (segments.length - i));
      let got = gather(seg, 1, share);
      if (!got.length && remaining !== undefined) got = gather(seg, 1, remaining);
      for (const g of got) { picks.push(g); used.add(g.p.id); if (remaining !== undefined) remaining -= g.p.price; }
    });
  } else if (wantsBundle) {
    let remaining = budget;
    const cands = gather(msg, 8, budget);
    for (const c of cands) {
      if (picks.length >= 3) break;
      if (remaining !== undefined && c.p.price > remaining) continue;
      if (picks.some((x) => x.p.sellerId === c.p.sellerId)) continue;
      picks.push(c);
      if (remaining !== undefined) remaining -= c.p.price;
    }
    if (picks.length < 2) for (const c of cands) { if (picks.length >= 3) break; if (!picks.some((x) => x.p.id === c.p.id) && (remaining === undefined || c.p.price <= remaining)) { picks.push(c); if (remaining !== undefined) remaining -= c.p.price; } }
  } else {
    picks.push(...gather(msg, 4, budget));
  }

  if (!picks.length) {
    if (!looksShopping) return { ...base, declined: true, reply: "I can only help with shopping on Bazaar AI. Tell me what you're looking for, in English, Hindi or Hinglish." };
    return { ...base, reply: `I couldn't find an in-stock match${budget ? ` under ${formatINR(budget)}` : ""}. Try a different word or a higher budget.` };
  }

  const total = picks.reduce((a, x) => a + x.p.price, 0);
  const cards = picks.map((x) => card(x.p, getSeller(x.p.sellerId)?.name ?? "", x.why));
  const sellers = new Set(picks.map((x) => x.p.sellerId)).size;
  const lines = picks.map((x) => `• ${x.p.title} (${getSeller(x.p.sellerId)?.name}) ${formatINR(x.p.price)}`);
  const bundle = picks.length > 1;
  trace.push({ tool: "get_product", args: picks.map((x) => x.p.id).join(","), result: `prices & stock read from database` });
  return {
    ...base,
    cards,
    suggestedCart: picks.map((x) => ({ productId: x.p.id, qty: 1 })),
    suggestedTotal: total,
    reply: bundle
      ? `Here's a ${sellers > 1 ? `${sellers}-seller ` : ""}bundle${budget ? ` within ${formatINR(budget)}` : ""}:\n${lines.join("\n")}\nTotal ${formatINR(total)}. Tap “Add all to cart” and I'll sort the rest.`
      : `Here ${picks.length === 1 ? "is the best match" : "are the best matches"}${budget ? ` under ${formatINR(budget)}` : ""}:\n${lines.join("\n")}`,
  };
}
