"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RoleSwitcher({ role, sellerId, sellers, }: { role: string; sellerId: string; sellers: { id: string; name: string }[]; lang?: string }) {
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
        className="h-11 rounded-xl border border-line bg-surface px-2 text-sm"
      >
        <option value="customer">Shopping</option>
        <option value="seller">Selling</option>
        <option value="admin">Admin</option>
      </select>
      {role === "seller" && (
        <>
          <label className="sr-only" htmlFor="sid">Acting as seller</label>
          <select id="sid" value={sellerId} onChange={(e) => go(`sid=${e.target.value}`)} className="hidden h-11 max-w-40 rounded-xl border border-line bg-surface px-2 text-sm md:block">
            {sellers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </>
      )}

    </div>
  );
}
