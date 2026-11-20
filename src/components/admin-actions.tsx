import { setProductStatusAction, setSellerStatusAction } from "@/app/actions";
import { btn } from "./ui";

export function SellerActions({ id, status, back = "/admin/sellers" }: { id: string; status: string; back?: string }) {
  const b = (to: string, label: string, v: "primary" | "outline" | "danger") => (
    <form action={setSellerStatusAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={to} /><input type="hidden" name="_back" value={back} /><button className={btn(v, "sm")}>{label}</button></form>
  );
  return <div className="flex gap-2">{status === "pending" && b("active", "Approve", "primary")}{status === "active" && b("suspended", "Suspend", "outline")}{status === "suspended" && b("active", "Reinstate", "primary")}</div>;
}

export function ProductActions({ id, back = "/admin" }: { id: string; back?: string }) {
  const f = (status: string, label: string, v: "primary" | "outline", note: string) => (
    <form action={setProductStatusAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={status} /><input type="hidden" name="note" value={note} /><input type="hidden" name="_back" value={back} /><button className={btn(v, "sm")}>{label}</button></form>
  );
  return <div className="flex gap-2">{f("live", "Approve", "primary", "Approved by admin")}{f("rejected", "Reject", "outline", "Rejected by admin")}</div>;
}
