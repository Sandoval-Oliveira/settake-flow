import { supabase as cloudSupabase } from "@/integrations/supabase/client";

const url = import.meta.env['VITE_SUPABASE_URL'] as string | undefined;
const key = import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] as string | undefined;

export const isSupabaseConfigured = Boolean(url && key);

/**
 * Browser client managed by Lovable Cloud. Reads VITE_SUPABASE_URL and
 * VITE_SUPABASE_PUBLISHABLE_KEY injected by the project backend.
 */
export const supabase = cloudSupabase;

export function assertConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Banco de dados não conectado. Ative o Lovable Cloud em Configurações → Backend.",
    );
  }
}
