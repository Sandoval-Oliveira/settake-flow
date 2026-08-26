import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url =
  (import.meta.env['VITE_SUPABASE_URL'] as string | undefined) ??
  (import.meta.env['VITE_SUPABASE_PROJECT_URL'] as string | undefined);

const key =
  (import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined) ??
  (import.meta.env['VITE_SUPABASE_ANON_KEY'] as string | undefined);

export const isSupabaseConfigured = Boolean(url && key);

/**
 * Single browser client for the CRM. The project points at the existing
 * SetTake ERP database — no migrations are created from this app.
 */
export const supabase: SupabaseClient = createClient(
  url ?? "https://placeholder.supabase.co",
  key ?? "placeholder-anon-key",
  { auth: { persistSession: true, autoRefreshToken: true } },
);

export function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Banco de dados não conectado. Conecte seu projeto Supabase em Configurações → Integrações.",
    );
  }
}
