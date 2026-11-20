"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";

export function RoleSwitcher({ role, sellerId, sellers, lang }: { role: string; sellerId: string; sellers: { id: string; name: string }[]; lang: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (qs: string, to?: string) =>
    start(async () => {
      await fetch(`/api/role?${qs}`, { method: "POST" });
      if (to) router.push(to);
      router.refresh();
    });
  return (
    <div className="flex items-center gap-2" aria-busy={pending}>
      <label className="sr-only" htmlFor="role">Demo role</label>
      <select
        id="role"
        value={role}
        onChange={(e) => go(`role=${e.target.value}`, e.target.value === "customer" ? "/" : e.target.value === "seller" ? "/seller" : "/admin")}
        className="h-10 rounded-xl border border-line bg-surface px-2 text-sm font-medium"
      >
        <option value="customer">👤 Customer</option>
        <option value="seller">🏪 Seller</option>
        <option value="admin">🛡️ Admin</option>
      </select>
      {role === "seller" && (
        <>
          <label className="sr-only" htmlFor="sid">Acting as seller</label>
          <select id="sid" value={sellerId} onChange={(e) => go(`sid=${e.target.value}`)} className="hidden h-10 max-w-40 rounded-xl border border-line bg-surface px-2 text-sm md:block">
            {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </>
      )}
      <button aria-label={lang === "hi" ? "Switch to English" : "हिंदी में बदलें"} className="grid h-10 min-w-10 place-items-center rounded-xl border border-line bg-surface px-2 text-sm font-semibold hover:bg-surface2" onClick={() => go(`lang=${lang === "hi" ? "en" : "hi"}`)}>
        <span className="flex items-center gap-1"><Languages className="size-4" />{lang === "hi" ? "EN" : "हि"}</span>
      </button>
    </div>
  );
}
