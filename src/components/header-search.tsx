"use client";
import { usePathname } from "next/navigation";
import { SearchBox } from "./search-box";

/** The home page already has a large search box, so the header one hides there. */
export function HeaderSearch({ placeholder }: { placeholder: string }) {
  const path = usePathname();
  if (path === "/") return <div className="hidden md:block md:flex-1" />;
  return <div className="order-last w-full md:order-none md:max-w-md md:flex-1"><SearchBox placeholder={placeholder} /></div>;
}
