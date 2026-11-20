export type Lang = "en" | "hi";
const D: Record<string, { en: string; hi: string }> = {
  search_ph: { en: "Try: “diwali ke liye diya”, “sardi ke liye shawl”, “2000 tak gift for mom”", hi: "खोजें: “दिवाली के लिए दीये”, “सर्दी के लिए शॉल”" },
  shop: { en: "Shop", hi: "खरीदारी" },
  cart: { en: "Cart", hi: "कार्ट" },
  orders: { en: "My orders", hi: "मेरे ऑर्डर" },
  add_to_cart: { en: "Add to cart", hi: "कार्ट में डालें" },
  buy_now: { en: "Buy now", hi: "अभी खरीदें" },
  checkout: { en: "Checkout", hi: "चेकआउट" },
  hero_title: { en: "One cart. Many makers. Zero hassle.", hi: "एक कार्ट। कई कारीगर। एक भुगतान।" },
  hero_sub: { en: "Shop from independent sellers across India and pay once. Search in English, Hindi or Hinglish.", hi: "भारत भर के स्वतंत्र विक्रेताओं से खरीदें, एक बार भुगतान करें। हिंदी, अंग्रेज़ी या हिंग्लिश में खोजें।" },
  categories: { en: "Categories", hi: "श्रेणियाँ" },
  featured: { en: "Popular right now", hi: "अभी लोकप्रिय" },
  sellers: { en: "Meet the makers", hi: "हमारे कारीगर" },
  low_stock: { en: "Only {n} left", hi: "सिर्फ {n} बचे" },
  in_stock: { en: "In stock", hi: "उपलब्ध" },
  out_of_stock: { en: "Out of stock", hi: "स्टॉक में नहीं" },
  sold_by: { en: "Sold by", hi: "विक्रेता" },
  assistant: { en: "Shopping assistant", hi: "शॉपिंग असिस्टेंट" },
  total: { en: "Total", hi: "कुल" },
  delivery: { en: "Delivery by", hi: "डिलीवरी" },
};
export function t(key: string, lang: Lang, vars?: Record<string, string | number>) {
  let s = D[key]?.[lang] ?? D[key]?.en ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}
