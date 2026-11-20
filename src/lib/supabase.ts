/**
 * Supabase wiring (prepared, not required). When NEXT_PUBLIC_SUPABASE_URL and keys are set,
 * auth + the repository layer should use these clients. The prototype's data layer is
 * src/lib/store.ts (local fallback) and implements the same entities as supabase/migrations.
 */
import { createClient } from "@supabase/supabase-js";

export const supabaseConfigured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Browser/anon client: subject to RLS. */
export function supabaseAnon() {
  if (!supabaseConfigured()) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

/** Server-only client with the service-role key (bypasses RLS). Never import from client components. */
export function supabaseService() {
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}
