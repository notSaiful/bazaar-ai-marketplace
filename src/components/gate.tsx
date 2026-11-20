"use client";
import { useRouter } from "next/navigation";
import { btn } from "./ui";

export function SwitchRole({ role, label }: { role: "seller" | "admin" | "customer"; label: string }) {
  const router = useRouter();
  return <button className={btn("primary")} onClick={async () => { await fetch(`/api/role?role=${role}`, { method: "POST" }); router.refresh(); }}>{label}</button>;
}
