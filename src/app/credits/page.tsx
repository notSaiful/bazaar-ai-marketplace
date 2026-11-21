import Link from "next/link";
import { PHOTO_CREDITS, PRODUCT_SEED, licenseLabel } from "@/lib/catalog";
import { getSession } from "@/lib/session";
import { t } from "@/lib/i18n";
import { PageHeader } from "@/components/ui";

export async function generateMetadata() {
  const { lang } = await getSession();
  return { title: t("nav.photoCredits", lang) };
}

export default async function Credits() {
  const { lang } = await getSession();
  const titles = Object.fromEntries(PRODUCT_SEED.map((p) => [p.id, lang === "hi" ? p.titleHi : p.title]));
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title={t("nav.photoCredits", lang)} sub={t("shop.credits.sub", lang)} />
      <p className="text-sm text-muted">{t("samples.credits", lang)}</p>
      <ul className="divide-y divide-line rounded-xl border border-line">
        {Object.entries(PHOTO_CREDITS).map(([id, c]) => (
          <li key={id} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/product/${id}`} className="font-medium hover:underline">{titles[id] ?? id}</Link>
            <span className="text-muted">
              <a href={c.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">“{c.title}”</a> {t("shop.credits.by", lang, { name: c.creator || t("shop.unknown", lang) })} ·{" "}
              <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">{licenseLabel(c.license)}</a>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
