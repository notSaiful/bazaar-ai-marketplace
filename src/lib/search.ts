/**
 * Hybrid search for English / Hindi (Devanagari) / Hinglish queries.
 * Local fallback for "Postgres full-text + pgvector":
 *   1. keyword ranker (BM25-style field weights over canonicalised tokens, fuzzy matching)
 *   2. concept ranker (intent dictionary stands in for embeddings: "sardi" -> winter, shawl)
 * merged with Reciprocal Rank Fusion. Returns the reason for every match (explainable AI).
 */
import { CATEGORIES } from "./catalog";
import { liveProducts } from "./store";
import type { Product } from "./types";

const STOP = new Set(
  ("a an the for of to in on and or me my mujhe mere meri mera chahiye chahie dikhao dikha do de dena show find get want need looking " +
    "ke ki ka ko se ek koi kuch wala wali wale hai hain hoga liye lie best accha achha achhi acchi good under below upto up tak kam " +
    "andar neeche rs inr rupay rupees rupaye price within budget aur with please pls bhai yaar jaisa jaise some any about " +
    "के की का को से एक कोई कुछ वाला वाली वाले है हैं लिए और में पर").split(" "),
);

// canonical -> variants (English / Hinglish spellings / Devanagari)
const CONCEPTS: Record<string, string[]> = {
  kurta: ["kurta", "kurti", "kurte", "kurtas", "कुर्ता", "कुर्ती", "कुर्ते"],
  saree: ["saree", "sari", "saari", "sarees", "साड़ी", "साडी", "साड़ियाँ"],
  diya: ["diya", "diye", "deepak", "dipak", "diyas", "दीया", "दीये", "दीपक", "दिया"],
  chai: ["chai", "tea", "chaay", "चाय"],
  jhumka: ["jhumka", "jhumke", "jhumki", "earring", "earrings", "झुमके", "झुमका", "बाली"],
  necklace: ["necklace", "haar", "mala", "हार", "माला"],
  bangles: ["bangle", "bangles", "chudi", "churi", "chudiyan", "चूड़ी", "चूड़ियाँ"],
  shawl: ["shawl", "shaal", "pashmina", "शॉल", "शाल"],
  dupatta: ["dupatta", "chunni", "chunri", "दुपट्टा", "चुनरी"],
  earphones: ["earphone", "earphones", "headphone", "headphones", "earbuds", "neckband", "ईयरफोन"],
  charger: ["charger", "adapter", "चार्जर"],
  speaker: ["speaker", "स्पीकर"],
  lamp: ["lamp", "light", "lamps", "लैंप", "रोशनी"],
  candle: ["candle", "candles", "mombatti", "मोमबत्ती"],
  pickle: ["pickle", "achaar", "achar", "अचार"],
  honey: ["honey", "shahad", "शहद"],
  saffron: ["saffron", "kesar", "केसर"],
  bag: ["bag", "tote", "jhola", "thaila", "बैग", "झोला"],
  rakhi: ["rakhi", "rakshabandhan", "राखी"],
  pooja: ["pooja", "puja", "पूजा", "mandir", "thali", "थाली"],
  bottle: ["bottle", "botal", "बोतल"],
  planter: ["planter", "gamla", "pot", "गमला", "गमले"],
  rug: ["rug", "carpet", "dari", "दरी", "कालीन"],
  kids: ["kids", "child", "children", "bachche", "bachhe", "baccha", "बच्चे", "बच्चों"],
  fitness: ["fitness", "smartwatch", "band", "watch"],
  powerbank: ["powerbank", "power", "bank", "पावर"],
  masala: ["masala", "spice", "spices", "मसाला", "मसाले"],
  mewa: ["mewa", "dryfruits", "dry", "fruits", "badam", "kaju", "मेवा"],
};
const CANON = new Map<string, string>();
for (const [c, vs] of Object.entries(CONCEPTS)) for (const v of vs) CANON.set(v.toLowerCase(), c);

// intent phrases -> product tags / categories (the "semantic" layer)
const INTENTS: { keys: string[]; tags: string[]; category?: string; label: string }[] = [
  { keys: ["gift", "tohfa", "uphaar", "present", "उपहार", "तोहफा", "gifting"], tags: ["gift"], label: "gift ideas" },
  { keys: ["sardi", "thand", "winter", "cold", "सर्दी", "ठंड", "sardiyon"], tags: ["winter", "shawl", "warm", "sardi", "thand"], label: "winter wear" },
  { keys: ["diwali", "deepavali", "dipawali", "दिवाली", "tyohar", "tyauhar", "त्योहार", "festival", "festive"], tags: ["diwali", "festive", "diya", "pooja", "mewa"], label: "festive picks" },
  { keys: ["shaadi", "shadi", "wedding", "vivah", "शादी", "विवाह", "dulhan"], tags: ["wedding", "shaadi", "bridal"], label: "wedding" },
  { keys: ["music", "gaana", "gaane", "gana", "संगीत", "party"], tags: ["music", "earphones", "speaker"], label: "music" },
  { keys: ["padhai", "study", "exam", "पढ़ाई", "homework"], tags: ["study", "lamp", "padhai"], label: "study" },
  { keys: ["ghar", "sajawat", "decor", "sajane", "सजावट", "घर", "home", "decoration"], tags: ["decor", "sajawat"], category: "home", label: "home decor" },
  { keys: ["mom", "maa", "mummy", "mother", "mataji", "माँ", "मां"], tags: ["maa", "mom", "gift"], label: "for mom" },
  { keys: ["papa", "father", "dad", "pitaji", "पापा"], tags: ["papa", "mens", "gift"], label: "for dad" },
  { keys: ["bhai", "brother", "भाई"], tags: ["rakhi", "bhai", "brother"], label: "for brother" },
  { keys: ["kapde", "clothes", "clothing", "wear", "कपड़े", "outfit"], tags: [], category: "apparel", label: "clothing" },
  { keys: ["gehne", "zewar", "jewellery", "jewelry", "jewels", "गहने", "ornaments"], tags: [], category: "jewellery", label: "jewellery" },
  { keys: ["khana", "nashta", "snacks", "grocery", "kitchen", "rasoi", "खाना", "रसोई"], tags: ["kitchen", "rasoi"], category: "food", label: "food & kitchen" },
  { keys: ["gadget", "gadgets", "electronics", "tech", "इलेक्ट्रॉनिक्स"], tags: [], category: "electronics", label: "electronics" },
  { keys: ["health", "sehat", "wellness", "immunity", "सेहत"], tags: ["health", "wellness", "immunity", "honey"], label: "health & wellness" },
  { keys: ["sasta", "cheap", "budget", "affordable", "सस्ता", "kifayati"], tags: [], label: "budget friendly" },
];

export interface ParsedQuery {
  raw: string;
  tokens: string[]; // canonicalised content tokens
  maxPrice?: number; // paise
  minPrice?: number;
  intents: string[];
  cheap: boolean;
  category?: string;
}

const tokenize = (s: string) => (s.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) ?? []);

function lev1(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

let VOCAB: Set<string> | null = null;
let VOCAB_N = -1;
function vocab(products: Product[]) {
  if (!VOCAB || VOCAB_N !== products.length) {
    VOCAB = new Set(products.flatMap((p) => tokenize([p.title, p.tags.join(" ")].join(" ")).map((t) => CANON.get(t) ?? t)));
    VOCAB_N = products.length;
  }
  return VOCAB;
}

export function parseQuery(q: string, products: Product[] = liveProducts()): ParsedQuery {
  let s = q.toLowerCase();
  let maxPrice: number | undefined;
  let minPrice: number | undefined;
  const num = (x: string) => {
    const m = x.replace(/,/g, "");
    return /k$/.test(m) ? parseFloat(m) * 1000 : parseFloat(m);
  };
  const reMax = [
    /(?:under|below|less than|upto|up to|max|within|<)\s*(?:rs\.?|inr|₹)?\s*(\d[\d,]*(?:\.\d+)?k?)/,
    /(?:₹|rs\.?|inr)\s*(\d[\d,]*(?:\.\d+)?k?)\s*(?:tak|se kam|ke andar|ke neeche|or less)?/,
    /(\d[\d,]*(?:\.\d+)?k?)\s*(?:rs|rupay|rupaye|rupees|₹)?\s*(?:tak|se kam|ke andar|ke neeche|se neeche|या कम|तक|से कम)/,
  ];
  for (const re of reMax) {
    const m = s.match(re);
    if (m) { maxPrice = Math.round(num(m[1]) * 100); s = s.replace(m[0], " "); break; }
  }
  const mm = s.match(/(?:above|over|more than|se zyada|se upar|>)\s*(?:rs\.?|₹)?\s*(\d[\d,]*k?)/);
  if (mm) { minPrice = Math.round(num(mm[1]) * 100); s = s.replace(mm[0], " "); }

  const v = vocab(products);
  const raw = tokenize(s);
  const intents: string[] = [];
  let cheap = false;
  let category: string | undefined;
  const tokens: string[] = [];
  for (const t of raw) {
    const intent = INTENTS.find((i) => i.keys.includes(t));
    if (intent) {
      intents.push(intent.label);
      if (intent.label === "budget friendly") cheap = true;
      if (intent.category && !category) category = intent.category;
    }
    if (STOP.has(t) || /^\d+$/.test(t)) continue;
    let c = CANON.get(t) ?? t;
    if (!CANON.has(t) && !v.has(c) && c.length >= 5) {
      const near = [...v].find((w) => w.length >= 5 && lev1(w, c));
      if (near) c = near;
    }
    tokens.push(c);
  }
  return { raw: q, tokens, maxPrice, minPrice, intents: [...new Set(intents)], cheap, category };
}

export interface SearchOpts {
  category?: string;
  sellerId?: string;
  min?: number; // paise
  max?: number;
  sort?: "relevance" | "price_asc" | "price_desc" | "rating";
  limit?: number;
}
export interface SearchHit {
  product: Product;
  score: number;
  why: string[];
}

function docTokens(p: Product) {
  const canon = (t: string) => CANON.get(t) ?? t;
  return {
    title: tokenize(p.title + " " + p.titleHi).map(canon),
    tags: p.tags.map((t) => canon(t.toLowerCase())),
    body: tokenize(p.description + " " + p.descriptionHi + " " + Object.values(p.attributes).join(" ") + " " + p.category).map(canon),
  };
}

export function search(q: string, opts: SearchOpts = {}) {
  const t0 = performance.now();
  const all = liveProducts();
  const parsed = parseQuery(q, all);
  const maxP = opts.max ?? parsed.maxPrice;
  const minP = opts.min ?? parsed.minPrice;
  const cat = opts.category ?? undefined;

  let pool = all.filter((p) => (!cat || p.category === cat) && (!opts.sellerId || p.sellerId === opts.sellerId) && (maxP === undefined || p.price <= maxP) && (minP === undefined || p.price >= minP));
  const qTokens = parsed.tokens;
  const intentDefs = INTENTS.filter((i) => parsed.intents.includes(i.label));

  const why = new Map<string, string[]>();
  const addWhy = (id: string, w: string) => { const a = why.get(id) ?? []; if (!a.includes(w)) a.push(w); why.set(id, a); };
  const kw = new Map<string, number>();
  const sem = new Map<string, number>();

  if (qTokens.length || intentDefs.length || parsed.category) {
    for (const p of pool) {
      const d = docTokens(p);
      let k = 0;
      for (const t of qTokens) {
        if (d.title.includes(t)) { k += 3; addWhy(p.id, `"${t}" in title`); }
        else if (d.tags.includes(t)) { k += 2; addWhy(p.id, `"${t}" in tags`); }
        else if (d.body.includes(t)) { k += 1; addWhy(p.id, `"${t}" in details`); }
      }
      if (k) kw.set(p.id, k);
      let s = 0;
      for (const i of intentDefs) {
        const hits = i.tags.filter((tg) => d.tags.includes(tg) || d.title.includes(tg)).length;
        if (hits) { s += hits; addWhy(p.id, `Understood as ${i.label}`); }
        if (i.category && p.category === i.category) { s += 1; addWhy(p.id, `Category: ${i.label}`); }
      }
      if (s) sem.set(p.id, s);
    }
    const rank = (m: Map<string, number>) => new Map([...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([id], i) => [id, i + 1]));
    const rk = rank(kw), rs = rank(sem);
    const fused = new Map<string, number>();
    for (const [id, r] of rk) fused.set(id, (fused.get(id) ?? 0) + 1 / (60 + r));
    for (const [id, r] of rs) fused.set(id, (fused.get(id) ?? 0) + 0.8 / (60 + r));
    // all content tokens must be explained by something unless there is an intent
    pool = pool.filter((p) => fused.has(p.id));
    pool.sort((a, b) => (fused.get(b.id)! - fused.get(a.id)!) || b.rating - a.rating);
    pool.forEach((p) => kw.set(p.id, fused.get(p.id)!));
  } else {
    pool.sort((a, b) => b.rating - a.rating);
  }

  if (parsed.cheap && !opts.sort) pool.sort((a, b) => a.price - b.price);
  if (opts.sort === "price_asc") pool.sort((a, b) => a.price - b.price);
  if (opts.sort === "price_desc") pool.sort((a, b) => b.price - a.price);
  if (opts.sort === "rating") pool.sort((a, b) => b.rating - a.rating);

  const hits: SearchHit[] = pool.slice(0, opts.limit ?? 60).map((p) => ({ product: p, score: kw.get(p.id) ?? 0, why: (why.get(p.id) ?? []).slice(0, 3) }));
  return { hits, total: pool.length, parsed, ms: Math.round((performance.now() - t0) * 100) / 100, mode: "hybrid (keyword + concept, RRF)" };
}

export const categoryName = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
