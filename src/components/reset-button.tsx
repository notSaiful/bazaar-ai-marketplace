"use client";
import { resetDemoAction } from "@/app/actions";

export function ResetButton() {
  return (
    <form action={resetDemoAction} onSubmit={(e) => { if (!confirm("Reset your demo data to the original seed? Your orders and changes will be cleared.")) e.preventDefault(); }}>
      <button className="underline hover:text-fg">Reset demo data</button>
    </form>
  );
}
