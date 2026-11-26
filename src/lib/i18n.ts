/**
 * Tiny i18n: English + Hindi (PRD UX-3, bilingual by default).
 * Dictionaries live in src/lib/dict/*, one file per area, so they can grow without conflicts.
 * Server components: t(key, s.lang). Client components: const t = useT() from @/components/lang.
 * Keys are namespaced ("cart.empty"). Placeholders use {name}. Brand names, ₹ and digits stay as-is.
 */
import { common } from "./dict/common";
import { shop } from "./dict/shop";
import { checkout } from "./dict/checkout";
import { seller } from "./dict/seller";
import { ui } from "./dict/ui";
import { samples } from "./dict/samples";
import { engage } from "./dict/engage";
import { browse } from "./dict/browse";
import { fill, type Dict, type Lang } from "./i18n-core";
import { CLIENT_KEYS } from "./dict/client-keys";

export * from "./i18n-core";

/** Legacy keys kept for existing callers. */
const legacy: Dict = {
  search_ph: { en: "Search, e.g. “diwali ke liye diya”", hi: "खोजें: “दिवाली के लिए दीये”, “सर्दी के लिए शॉल”" },
  shop: { en: "Shop", hi: "खरीदारी" },
  cart: { en: "Cart", hi: "कार्ट" },
  orders: { en: "My orders", hi: "मेरे ऑर्डर" },
  add_to_cart: { en: "Add to cart", hi: "कार्ट में डालें" },
  buy_now: { en: "Buy now", hi: "अभी खरीदें" },
  checkout: { en: "Checkout", hi: "चेकआउट" },
  hero_title: { en: "Handmade goods, one checkout.", hi: "हाथ से बना सामान, एक चेकआउट।" },
  hero_sub: { en: "Shop independent sellers and pay once. Search in English, Hindi or Hinglish.", hi: "स्वतंत्र विक्रेताओं से खरीदें और एक ही बार भुगतान करें। हिंदी, अंग्रेज़ी या हिंग्लिश में खोजें।" },
  categories: { en: "Categories", hi: "श्रेणियाँ" },
  featured: { en: "Popular", hi: "लोकप्रिय" },
  sellers: { en: "Meet the makers", hi: "हमारे कारीगर" },
  low_stock: { en: "Only {n} left", hi: "सिर्फ़ {n} बचे" },
  in_stock: { en: "In stock", hi: "उपलब्ध" },
  out_of_stock: { en: "Out of stock", hi: "स्टॉक में नहीं" },
  sold_by: { en: "Sold by", hi: "विक्रेता" },
  assistant: { en: "Shopping assistant", hi: "शॉपिंग असिस्टेंट" },
  total: { en: "Total", hi: "कुल" },
  delivery: { en: "Delivery by", hi: "डिलीवरी" },
};

export const DICT: Dict = { ...legacy, ...common, ...ui, ...shop, ...checkout, ...seller, ...samples, ...engage, ...browse };

export function t(key: string, lang: Lang, vars?: Record<string, string | number>) {
  return fill(DICT[key]?.[lang] ?? DICT[key]?.en ?? key, vars);
}

/**
 * Phrases handed to client components via <LangProvider>: active language only, and no seller-portal
 * phrases for shoppers. Keeps the dictionary out of the JS bundle.
 */
export function clientMessages(lang: Lang, role: string): Record<string, string> {
  const out: Record<string, string> = {};
  // Only keys that client components use (generated list, see scripts/client-keys.ts).
  for (const k of CLIENT_KEYS) {
    if (role === "customer" && (k.startsWith("seller.") || k.startsWith("msg."))) continue;
    const v = DICT[k];
    if (v) out[k] = v[lang] || v.en;
  }
  return out;
}

/** Plural helper: t(n === 1 ? one : many). Hindi rarely needs it, English does. */
export const tn = (n: number, one: string, many: string, lang: Lang, vars?: Record<string, string | number>) => t(n === 1 ? one : many, lang, { n, ...vars });
