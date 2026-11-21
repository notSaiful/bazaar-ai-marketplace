"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RoleSwitcher({ role, sellerId, sellers, }: { role: string; sellerId: string; sellers: { id: string; name: string }[]; lang?: string }) {
  const router = useRouter();
  const current = sellers.find((x) => x.id === sellerId)?.name;
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
        className="h-9 rounded-lg border border-line bg-surface px-2.5 text-sm"
      >
        <option value="customer">Shopping</option>
        <option value="seller">Selling</option>
        <option value="admin">Admin</option>
      </select>
      {role === "seller" && current && (
        <span className="hidden h-9 max-w-48 items-center truncate rounded-lg border border-line bg-surface px-3 text-sm font-medium md:flex" title="Your shop">{current}</span>
      )}

    </div>
  );
}
