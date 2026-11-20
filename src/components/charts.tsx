import { formatINR } from "@/lib/money";

/** Lightweight SVG charts: server-rendered, zero JS, accessible titles. */
export function AreaChart({ data, label, height = 160, money = true }: { data: { label: string; value: number }[]; label: string; height?: number; money?: boolean }) {
  const w = 600, h = height, pad = 24;
  const max = Math.max(1, ...data.map((d) => d.value));
  const x = (i: number) => pad + (i * (w - pad * 2)) / Math.max(1, data.length - 1);
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${h - pad} L${x(0)},${h - pad} Z`;
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <figure>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`${label}. Total ${money ? formatINR(total) : total}`}>
        <title>{label}</title>
        {[0, 0.5, 1].map((t) => <line key={t} x1={pad} x2={w - pad} y1={y(max * t)} y2={y(max * t)} stroke="var(--border)" strokeDasharray="3 4" />)}
        <path d={area} fill="var(--accent)" opacity=".14" />
        <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => <circle key={i} cx={x(i)} cy={y(d.value)} r="3" fill="var(--accent)"><title>{`${d.label}: ${money ? formatINR(d.value) : d.value}`}</title></circle>)}
        {data.map((d, i) => (i % Math.ceil(data.length / 7) === 0 ? <text key={i} x={x(i)} y={h - 6} fontSize="11" textAnchor="middle" fill="var(--muted)">{d.label}</text> : null))}
      </svg>
    </figure>
  );
}

export function HBars({ data, money = true }: { data: { label: string; value: number; sub?: string }[]; money?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <ul className="space-y-3" role="list">
      {data.map((d) => (
        <li key={d.label}>
          <div className="mb-1 flex justify-between text-sm"><span className="font-medium">{d.label}</span><span className="tabular-nums text-muted">{money ? formatINR(d.value) : d.value}{d.sub && ` · ${d.sub}`}</span></div>
          <div className="h-2.5 rounded-full bg-surface2"><div className="h-full rounded-full bg-accent" style={{ width: `${(d.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

const PALETTE = ["#d9480f", "#2563eb", "#0f9d58", "#a855f7", "#eab308", "#64748b"];
export function Donut({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const r = 48, c = 2 * Math.PI * r;
  const offsets = data.map((_, i) => data.slice(0, i).reduce((a, d) => a + (d.value / total) * c, 0));
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 120 120" className="size-32 shrink-0 -rotate-90" role="img" aria-label="Category mix of GMV">
        {data.map((d, i) => {
          const len = (d.value / total) * c;
          return <circle key={d.label} cx="60" cy="60" r={r} fill="none" stroke={PALETTE[i % PALETTE.length]} strokeWidth="18" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offsets[i]}><title>{`${d.label}: ${formatINR(d.value)}`}</title></circle>;
        })}
      </svg>
      <ul className="space-y-1 text-sm">
        {data.map((d, i) => <li key={d.label} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} /><span className="capitalize">{d.label}</span><span className="text-muted tabular-nums">{Math.round((d.value / total) * 100)}%</span></li>)}
      </ul>
    </div>
  );
}
