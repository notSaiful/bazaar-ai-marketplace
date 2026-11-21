import { CATEGORIES } from "./catalog";
import { db, liveProducts } from "./store";
import { accountName, type Session } from "./session";
import { t } from "./i18n";
import type { SideNavData } from "@/components/side-nav";

export function sideNavData(s: Session): SideNavData {
  const name = accountName(s.role, s.sellerId);
  return {
    role: s.role,
    account: { name, initials: name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() },
    labels: { orders: t("orders", s.lang), shop: t("shop", s.lang), categories: t("categories", s.lang), sellers: t("sellers", s.lang) },
    categories: CATEGORIES.map((c) => ({ slug: c.slug, name: s.lang === "hi" ? c.nameHi : c.name, emoji: c.emoji })),
    makers: db().sellers.filter((x) => x.status === "active").map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, hue: m.hue })),
    live: liveProducts().length,
  };
}
