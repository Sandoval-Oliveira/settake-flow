import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const papelSchema = z.enum(["admin", "socio", "vendedor"]);

async function garantirAdmin(supabase: unknown, userId: string) {
  const sb = supabase as SupabaseClient;
  const { data, error } = await sb.rpc("tem_papel", { papeis: ["admin"] });
  if (error) {
    console.error("[usuarios] falha ao validar papel", error);
    throw new Error("Não foi possível validar suas permissões.");
  }
  if (data !== true) {
    console.error(`[usuarios] acesso negado para ${userId}`);
    throw new Error("Sem permissão");
  }
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

function mensagem(erro: unknown, padrao: string): string {
  const m = erro instanceof Error ? erro.message : String(erro);
  if (/already been registered|already registered|duplicate key/i.test(m))
    return "Este e-mail já está cadastrado.";
  if (/password/i.test(m) && /short|least/i.test(m))
    return "A senha deve ter pelo menos 8 caracteres.";
  return padrao;
}

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await garantirAdmin(context.supabase, context.userId);
    const sb = await admin();
    const { data: profiles, error } = await sb
      .from("profiles")
      .select("id, nome, email, ativo, criado_em")
      .order("criado_em", { ascending: true });
    if (error) {
      console.error("[usuarios] listar profiles", error);
      throw new Error("Não foi possível carregar os usuários.");
    }
    const { data: roles, error: erroRoles } = await sb.from("user_roles").select("user_id, role");
    if (erroRoles) {
      console.error("[usuarios] listar roles", erroRoles);
      throw new Error("Não foi possível carregar os papéis.");
    }
    const mapa = new Map<string, string>();
    for (const r of roles ?? []) mapa.set(String(r.user_id), String(r.role));
    return (profiles ?? []).map((p) => ({
      id: String(p.id),
      nome: (p.nome as string | null) ?? "",
      email: (p.email as string | null) ?? "",
      ativo: Boolean(p.ativo),
      criado_em: (p.criado_em as string | null) ?? null,
      role: (mapa.get(String(p.id)) ?? null) as "admin" | "socio" | "vendedor" | null,
    }));
  });

export const criarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        nome: z.string().min(2),
        email: z.string().email(),
        role: papelSchema,
        senha: z.string().min(8),
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase, context.userId);
    const sb = await admin();
    const { error } = await sb.auth.admin.createUser({
      email: data.email.trim(),
      password: data.senha,
      email_confirm: true,
      user_metadata: { nome: data.nome.trim() },
      app_metadata: { role: data.role },
    });
    if (error) {
      console.error("[usuarios] criar", error);
      throw new Error(mensagem(error, "Não foi possível criar o usuário."));
    }
    return { ok: true as const };
  });

export const atualizarUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        id: z.string().uuid(),
        nome: z.string().min(2),
        role: papelSchema,
      })
      .parse(data),
  )
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase, context.userId);
    if (data.id === context.userId && data.role !== "admin") {
      throw new Error("Você não pode alterar o seu próprio papel de administrador.");
    }
    const sb = await admin();
    const { error } = await sb
      .from("profiles")
      .update({ nome: data.nome.trim() })
      .eq("id", data.id);
    if (error) {
      console.error("[usuarios] atualizar perfil", error);
      throw new Error("Não foi possível salvar o nome.");
    }
    const { error: erroRole } = await sb
      .from("user_roles")
      .update({ role: data.role })
      .eq("user_id", data.id);
    if (erroRole) {
      console.error("[usuarios] atualizar papel", erroRole);
      throw new Error("Não foi possível salvar o papel.");
    }
    await sb.auth.admin.updateUserById(data.id, { app_metadata: { role: data.role } });
    return { ok: true as const };
  });

export const alterarStatusUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ id: z.string().uuid(), ativo: z.boolean() }).parse(data))
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase, context.userId);
    if (data.id === context.userId && !data.ativo) {
      throw new Error("Você não pode desativar a sua própria conta.");
    }
    const sb = await admin();
    const { error } = await sb.from("profiles").update({ ativo: data.ativo }).eq("id", data.id);
    if (error) {
      console.error("[usuarios] status perfil", error);
      throw new Error("Não foi possível alterar o status.");
    }
    const { error: erroAuth } = await sb.auth.admin.updateUserById(data.id, {
      ban_duration: data.ativo ? "none" : "876000h",
    });
    if (erroAuth) {
      console.error("[usuarios] status auth", erroAuth);
      throw new Error("Status alterado parcialmente. Tente novamente.");
    }
    return { ok: true as const };
  });

export const definirSenhaTemporaria = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ id: z.string().uuid(), senha: z.string().min(8) }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase, context.userId);
    const sb = await admin();
    const { error } = await sb.auth.admin.updateUserById(data.id, { password: data.senha });
    if (error) {
      console.error("[usuarios] senha temporária", error);
      throw new Error(mensagem(error, "Não foi possível redefinir a senha."));
    }
    return { ok: true as const, senha: data.senha };
  });

export const enviarEmailRedefinicao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z.object({ email: z.string().email(), origem: z.string().url() }).parse(data),
  )
  .handler(async ({ context, data }) => {
    await garantirAdmin(context.supabase, context.userId);
    const sb = await admin();
    const { error } = await sb.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${data.origem.replace(/\/$/, "")}/redefinir-senha`,
    });
    if (error) {
      console.error("[usuarios] email redefinicao", error);
      throw new Error("Não foi possível enviar o e-mail de redefinição.");
    }
    return { ok: true as const };
  });
