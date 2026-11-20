import { setProductStatusAction, setSellerStatusAction } from "@/app/actions";
import { btn } from "./ui";

export function SellerActions({ id, status, back = "/admin/sellers" }: { id: string; status: string; back?: string }) {
  const b = (to: string, label: string, v: "primary" | "outline" | "danger") => (
    <form action={setSellerStatusAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value={to} /><input type="hidden" name="_back" value={back} /><button className={btn(v, "sm")}>{label}</button></form>
  );
  return <div className="flex gap-2">{status === "pending" && b("active", "Approve", "primary")}{status === "active" && b("suspended", "Suspend", "danger")}{status === "suspended" && b("active", "Reinstate", "primary")}</div>;
}

export function ProductActions({ id, back = "/admin/products" }: { id: string; back?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={setProductStatusAction}><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="live" /><input type="hidden" name="note" value="Approved by admin" /><input type="hidden" name="_back" value={back} /><button className={btn("primary", "sm")}>Approve</button></form>
      <form action={setProductStatusAction} className="flex gap-1"><input type="hidden" name="id" value={id} /><input type="hidden" name="status" value="rejected" /><input type="hidden" name="_back" value={back} /><label className="sr-only" htmlFor={`n-${id}`}>Rejection reason</label><input id={`n-${id}`} name="note" defaultValue="Violates listing policy" className="h-8 w-40 rounded-lg border border-line bg-surface px-2 text-xs" /><button className={btn("danger", "sm")}>Reject</button></form>
    </div>
  );
}
