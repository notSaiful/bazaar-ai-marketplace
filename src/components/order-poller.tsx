"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Refreshes server data every few seconds so buyers see each fulfilment update (Supabase Realtime in production). */
export function OrderPoller() {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), 5000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
