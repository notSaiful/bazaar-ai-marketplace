import Link from "next/link";
import { PHOTO_CREDITS, PRODUCT_SEED, licenseLabel } from "@/lib/catalog";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Photo credits" };

export default function Credits() {
  const titles = Object.fromEntries(PRODUCT_SEED.map((p) => [p.id, p.title]));
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader title="Photo credits" sub="Product photos are openly licensed images found through Openverse, cropped to fit. They illustrate the kind of item listed and are not photos of the exact product." />
      <ul className="divide-y divide-line rounded-[20px] border border-line">
        {Object.entries(PHOTO_CREDITS).map(([id, c]) => (
          <li key={id} className="flex flex-col gap-1 p-4 text-sm sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/product/${id}`} className="font-medium hover:underline">{titles[id] ?? id}</Link>
            <span className="text-muted">
              <a href={c.source} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">“{c.title}”</a> by {c.creator || "Unknown"} ·{" "}
              <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">{licenseLabel(c.license)}</a>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
