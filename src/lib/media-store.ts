/**
 * Demo-only media store for uploaded ad videos and posters: kept in this server instance's memory.
 * The ad's metadata is shared through the visitor's state log, but the bytes are NOT shared across
 * serverless instances and disappear on a cold start. Production: Supabase Storage (see README).
 * Capped so a busy demo cannot exhaust memory.
 */
const MAX_ITEMS = 40;
const MAX_TOTAL = 120 * 1024 * 1024;

type Item = { bytes: Uint8Array; mime: string; at: number };
const G = globalThis as unknown as { __bzMedia?: Map<string, Item> };
const store = () => (G.__bzMedia ??= new Map());

export const KEY_RE = /^(vid|img)_[a-f0-9]{16}$/;

export function newMediaKey(kind: "vid" | "img") {
  return `${kind}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export function putMedia(key: string, bytes: Uint8Array, mime: string) {
  if (!KEY_RE.test(key)) throw new Error("bad media key");
  const m = store();
  m.set(key, { bytes, mime, at: Date.now() });
  // Evict oldest until within limits.
  let total = [...m.values()].reduce((s, x) => s + x.bytes.length, 0);
  for (const [k, v] of [...m.entries()].sort((a, b) => a[1].at - b[1].at)) {
    if (m.size <= MAX_ITEMS && total <= MAX_TOTAL) break;
    m.delete(k);
    total -= v.bytes.length;
  }
}

export const getMedia = (key: string) => (KEY_RE.test(key) ? store().get(key) : undefined);
export const deleteMedia = (key: string) => void store().delete(key);
