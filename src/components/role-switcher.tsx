"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useT } from "./lang";

export function RoleSwitcher({ role, sellerId, sellers, }: { role: string; sellerId: string; sellers: { id: string; name: string }[]; lang?: string }) {
  const router = useRouter();
  const t = useT();
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
      <label className="sr-only" htmlFor="role">{t("role.label")}</label>
      <select
        id="role"
        value={role}
        onChange={(e) => go(`role=${e.target.value}`, e.target.value === "customer" ? "/" : e.target.value === "seller" ? "/seller" : "/admin")}
        className="h-9 rounded-lg border border-line bg-surface px-2.5 text-sm"
      >
        <option value="customer">{t("role.customer")}</option>
        <option value="seller">{t("role.seller")}</option>
        <option value="admin">{t("role.admin")}</option>
      </select>
      {role === "seller" && current && (
        <span className="hidden h-9 max-w-48 items-center truncate rounded-lg border border-line bg-surface px-3 text-sm font-medium md:flex" title={t("role.yourShop")}>{current}</span>
      )}

    </div>
  );
}
