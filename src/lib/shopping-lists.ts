"use client";
import { localList, PRODUCT_ID } from "./local-list";

/** "Save for later" from the cart: product ids only. Details and prices are fetched live when shown. */
export const savedList = localList<string>("bz_saved", 50, (x): x is string => typeof x === "string" && PRODUCT_ID.test(x), (x) => x);

/** Products picked for side-by-side comparison (max 3). Title and photo are only for the tray; the compare page reads live data. */
export interface CompareItem { id: string; title: string; titleHi: string; image: string }
const isCompareItem = (x: unknown): x is CompareItem => {
  const o = x as CompareItem;
  // image: same-site paths only (/products/p_09.jpg, /api/art?…), never another origin.
  return !!o && typeof o.id === "string" && PRODUCT_ID.test(o.id) && typeof o.title === "string" && typeof o.titleHi === "string" && typeof o.image === "string" && /^\/(?!\/)[^\s"'<>\\]*$/.test(o.image);
};
export const compareList = localList<CompareItem>("bz_compare", 3, isCompareItem, (x) => x.id);

export const compareHref = (ids: string[]) => (ids.length ? `/compare?ids=${ids.join(",")}` : "/compare");
