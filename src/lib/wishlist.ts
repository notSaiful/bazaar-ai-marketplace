import { cookies } from "next/headers";
import { getProduct, isVisible } from "./store";

export const WISHLIST_COOKIE = "wl";
const ID = /^p_[a-z0-9_]{1,40}$/i;

/** Wishlist ids from the visitor's cookie. The cookie is client-written, so treat it as untrusted: keep only real, visible products. */
export async function getWishlistIds(): Promise<string[]> {
  const raw = (await cookies()).get(WISHLIST_COOKIE)?.value ?? "";
  const ids = [...new Set(raw.split(".").filter((x) => ID.test(x)))].slice(0, 100);
  return ids.filter((id) => {
    const p = getProduct(id);
    return p && isVisible(p);
  });
}
