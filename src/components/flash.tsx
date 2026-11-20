export function Flash({ sp }: { sp: { msg?: string | string[]; err?: string | string[] } }) {
  const msg = Array.isArray(sp.msg) ? sp.msg[0] : sp.msg;
  const err = Array.isArray(sp.err) ? sp.err[0] : sp.err;
  if (!msg && !err) return null;
  return <div role={err ? "alert" : "status"} className={`pop mb-4 rounded-xl px-4 py-3 text-sm ${err ? "bg-bad/15 text-bad" : "bg-ok/15 text-ok"}`}>{err ?? msg}</div>;
}
