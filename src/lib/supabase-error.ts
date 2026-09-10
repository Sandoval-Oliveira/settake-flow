type SupabaseErrorLike = { code?: string | null; message?: string | null } | null | undefined;

/** Converte erros do Supabase em Error com mensagem amigável (42501 = sem permissão). */
export function crmError(error: SupabaseErrorLike): Error {
  const code = error?.code ?? "";
  const message = error?.message ?? "Erro inesperado";
  const semPermissao =
    code === "42501" ||
    /permission denied|row-level security|violates row-level/i.test(message);
  return new Error(semPermissao ? "Sem permissão" : message);
}
