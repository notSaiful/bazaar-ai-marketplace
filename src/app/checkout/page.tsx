import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout";
import { PageHeader } from "@/components/ui";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t("checkout.checkout", (await getSession()).lang) };
}
export default async function CheckoutPage() {
  const s = await getSession();
  return <div className="space-y-8"><PageHeader title={t("checkout.form.title", s.lang)} /><CheckoutForm /></div>;
}
