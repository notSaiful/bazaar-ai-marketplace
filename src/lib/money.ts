/** All money is integer paise. Never use floats for amounts. */
export type Paise = number;

export const rupees = (r: number): Paise => Math.round(r * 100);

export function formatINR(p: Paise, opts: { compact?: boolean } = {}): string {
  const neg = p < 0;
  const abs = Math.abs(p);
  const r = Math.floor(abs / 100);
  const ps = abs % 100;
  const rs = opts.compact && r >= 100000 ? `${(r / 100000).toFixed(2)}L` : r.toLocaleString("en-IN");
  const out = opts.compact || ps === 0 ? `₹${rs}${ps && !opts.compact ? "." + String(ps).padStart(2, "0") : ""}` : `₹${rs}.${String(ps).padStart(2, "0")}`;
  return neg ? `-${out}` : out;
}

/** Full precision, always two decimals (ledger views). */
export function formatINRExact(p: Paise): string {
  const neg = p < 0;
  const abs = Math.abs(p);
  const s = `₹${Math.floor(abs / 100).toLocaleString("en-IN")}.${String(abs % 100).padStart(2, "0")}`;
  return neg ? `-${s}` : s;
}

/** Commission for one order line. Rate in basis points (1000 = 10%). Rounded half-up per line. */
export function lineCommission(lineTotal: Paise, rateBps: number): Paise {
  return Math.floor((lineTotal * rateBps + 5000) / 10000);
}

export const bpsToPct = (bps: number) => `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`;
