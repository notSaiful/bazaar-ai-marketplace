import type { Metadata } from "next";
import { CartPageClient } from "@/components/checkout";
import { PageHeader } from "@/components/ui";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  return { title: t("nav.cart", (await getSession()).lang) };
}
export default async function CartPage() {
  const s = await getSession();
  return <div className="space-y-8"><PageHeader title={t("nav.cart", s.lang)} /><CartPageClient /></div>;
}
