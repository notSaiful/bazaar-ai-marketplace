/** Admin copilot over READ-ONLY aggregates (no write path exists in this module). Deterministic for demo safety. */
import { analytics, anomalies, db, reconciliation } from "./store";
import { formatINR, formatINRExact } from "./money";

export interface CopilotAnswer { text: string; chart?: { label: string; value: number }[]; source: string }

export function copilotAnswer(q: string): CopilotAnswer {
  const a = analytics();
  const d = db();
  const s = q.toLowerCase();
  if (/(top|best).*(seller|vendor)|seller.*(top|best)|kaun.*seller/.test(s))
    return { text: `${a.bySeller[0]?.name} leads with ${formatINR(a.bySeller[0]?.gmv ?? 0)} GMV across ${a.bySeller[0]?.orders} orders.`, chart: a.bySeller.map((x) => ({ label: x.name, value: x.gmv })), source: "analytics.bySeller (ledger-derived orders)" };
  if (/(seller|vendor).*(commission|fee|earn)|(commission|fee|earn).*(seller|vendor)|kis seller/.test(s)) {
    const by = [...a.bySeller].sort((x, y) => y.commission - x.commission);
    return { text: `${by[0]?.name} earned the platform the most commission: ${formatINR(by[0]?.commission ?? 0)} on ${formatINR(by[0]?.gmv ?? 0)} of sales. Next: ${by.slice(1, 3).map((x) => `${x.name} (${formatINR(x.commission)})`).join(", ")}.`, chart: by.map((x) => ({ label: x.name, value: x.commission })), source: "orders grouped by seller (commission snapshotted per line)" };
  }
  if (/commission|fee|take rate/.test(s))
    return { text: `Platform commission earned is ${formatINR(a.commission)} on ${formatINR(a.gmv)} GMV (${((a.commission / Math.max(1, a.gmv)) * 100).toFixed(1)}% effective, after reversals on refunds).`, chart: a.days.map((x) => ({ label: x.day.slice(5), value: x.commission })), source: "ledger: platform_commission" };
  if (/gmv|sales|revenue|trend/.test(s))
    return { text: `GMV is ${formatINR(a.gmv)} over ${a.orders} seller orders (AOV ${formatINR(a.aov)}). Refunds: ${formatINR(a.refunded)}. Net ${formatINR(a.netGmv)}.`, chart: a.days.map((x) => ({ label: x.day.slice(5), value: x.gmv })), source: "ledger: gateway_clearing" };
  if (/reconcil|ledger|balance|mismatch/.test(s)) {
    const r = reconciliation();
    return { text: `Ledger debits ${formatINRExact(r.debit)} − credits ${formatINRExact(r.credit)} = ${formatINRExact(r.diff)} across ${r.events} events (${r.unbalancedEvents} unbalanced).`, source: "ledger_entries" };
  }
  if (/pending|approval|approve/.test(s)) {
    const p = d.sellers.filter((x) => x.status === "pending");
    return { text: p.length ? `${p.length} seller(s) awaiting approval: ${p.map((x) => x.name).join(", ")}.` : "No sellers are waiting for approval.", source: "sellers" };
  }
  if (/fraud|flag|anomal|risk|suspicious/.test(s)) {
    const f = anomalies();
    return { text: f.length ? `${f.length} item(s) flagged: ${f.map((x) => `${x.target} (${x.reason})`).join(" | ")}` : "Nothing is flagged right now.", source: "anomaly rules" };
  }
  if (/stock|inventory|low/.test(s)) {
    const low = d.products.filter((p) => p.status === "live" && p.stock <= p.lowStockThreshold);
    return { text: `${low.length} live product(s) are at or below their low-stock threshold: ${low.map((p) => `${p.title} (${p.stock})`).join(", ") || "none"}.`, chart: low.map((p) => ({ label: p.title.slice(0, 14), value: p.stock })), source: "products" };
  }
  if (/categor|mix/.test(s))
    return { text: `${a.categories[0]?.category} is the largest category at ${formatINR(a.categories[0]?.value ?? 0)}.`, chart: a.categories.map((c) => ({ label: c.category, value: c.value })), source: "order items" };
  return { text: "I can answer questions about GMV, commission, top sellers, category mix, low stock, pending approvals, fraud flags and ledger reconciliation. I only read data; I can't change anything.", source: "n/a" };
}
