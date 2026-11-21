/**
 * Stateless demo persistence for serverless hosts (Vercel) without a database.
 *
 * The seed is deterministic. A visitor's state is the seed plus an ordered log of every successful
 * mutation, kept in a signed, compressed cookie ("bz", "bz1", "bz2"). Any instance rebuilds the same
 * state by replaying the log on a fresh seed (see store.ts). Agent flows without cookies use signed
 * tokens (signToken / verifyToken). When Supabase env vars exist, the repository layer should replace this.
 *
 * The cookie is signed for integrity only. The default secret is public, so set DEMO_STATE_SECRET in
 * production; tampering can only change the tamperer's own demo state.
 */
import crypto from "node:crypto";
import zlib from "node:zlib";
import { workUnitAsyncStorage } from "next/dist/server/app-render/work-unit-async-storage.external";

export type LogEntry = [name: string, args: unknown[], at: number];

const SECRET = () => process.env.DEMO_STATE_SECRET || "bazaar-demo-state-secret";
const sign = (s: string) => crypto.createHmac("sha256", SECRET()).update(s).digest("base64url").slice(0, 22);

/** Hash for deterministic ids (not security sensitive). */
export function hid(prefix: string, ...parts: unknown[]) {
  const h = crypto.createHash("sha1").update(parts.map((p) => (typeof p === "string" ? p : JSON.stringify(p))).join("|")).digest("hex");
  return `${prefix}_${h.slice(0, 8)}`;
}

/* ---------- compact signed tokens (agent carts / checkout claims, cookie payloads) ---------- */
export function signToken(payload: unknown): string {
  const body = zlib.deflateRawSync(Buffer.from(JSON.stringify(payload))).toString("base64url");
  return `${body}.${sign(body)}`;
}
export function verifyToken<T>(token: string | undefined | null): T | null {
  if (!token) return null;
  const i = token.lastIndexOf(".");
  if (i < 1) return null;
  const body = token.slice(0, i), sig = token.slice(i + 1);
  const exp = sign(body);
  if (sig.length !== exp.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(exp))) return null;
  try {
    return JSON.parse(zlib.inflateRawSync(Buffer.from(body, "base64url"), { maxOutputLength: 200_000 }).toString()) as T;
  } catch {
    return null;
  }
}

/* ---------- cookie chunks ---------- */
const CHUNK = 3800;
export const MAX_CHUNKS = 3;
export const COOKIE = "bz";
const cname = (i: number) => (i === 0 ? COOKIE : `${COOKIE}${i}`);

export function encodeLog(log: LogEntry[]): string[] | null {
  if (!log.length) return [];
  const t = signToken(log);
  if (t.length > CHUNK * MAX_CHUNKS) return null;
  const out: string[] = [];
  for (let i = 0; i < t.length; i += CHUNK) out.push(t.slice(i, i + CHUNK));
  return out;
}

export function decodeLog(read: (name: string) => string | undefined): LogEntry[] {
  let t = "";
  for (let i = 0; i < MAX_CHUNKS + 1; i++) {
    const c = read(cname(i));
    if (!c) break;
    t += c;
  }
  const v = verifyToken<LogEntry[]>(t);
  return Array.isArray(v) ? v.filter((e) => Array.isArray(e) && typeof e[0] === "string") : [];
}
export const chunkNames = () => Array.from({ length: MAX_CHUNKS + 1 }, (_, i) => cname(i));

/* ---------- request scope (sync access to the cookies of the current request) ---------- */
export interface ReqLike { cookies: { get(name: string): { value: string } | undefined } }
/** Returns the current Next request store (a stable per-request object) or undefined outside a request. */
export function requestStore(): (object & ReqLike) | undefined {
  try {
    const s = workUnitAsyncStorage.getStore() as unknown as { type?: string; cookies?: ReqLike["cookies"] } | undefined;
    if (s && s.type === "request" && s.cookies) return s as unknown as object & ReqLike;
  } catch {}
  return undefined;
}
