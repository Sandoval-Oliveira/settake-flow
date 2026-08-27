import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "./supabase";
import { FUNIL_KEYS } from "./crm-funis";
import type { Etapa, Funil } from "./crm-types";

const enabled = isSupabaseConfigured;

export type ListaTabela =
  | "crm_config_segmentos"
  | "crm_config_origens"
  | "crm_config_areas_atuacao";

export type ItemLista = { id: number; nome: string; ativo: boolean; ordem: number };

/* --------------------------- listas de referência -------------------------- */

export function useLista(tabela: ListaTabela) {
  return useQuery({
    queryKey: [tabela],
    enabled,
    queryFn: async (): Promise<ItemLista[]> => {
      const { data, error } = await supabase
        .from(tabela)
        .select("id, nome, ativo, ordem")
        .order("ordem", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as ItemLista[];
    },
  });
}

/** Opções ativas de uma lista de referência, para os selects dos formulários. */
export function useOpcoesLista(tabela: ListaTabela) {
  return useQuery({
    queryKey: [tabela, "ativos"],
    enabled,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<{ value: string; label: string }[]> => {
      const { data, error } = await supabase
        .from(tabela)
        .select("id, nome")
        .eq("ativo", true)
        .order("ordem", { ascending: true });
      if (error) throw new Error(error.message);
      return ((data ?? []) as unknown as { nome: string }[]).map((r) => ({
        value: r.nome,
        label: r.nome,
      }));
    },
  });
}

function useListaInvalidate(tabela: ListaTabela) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [tabela] });
  };
}

export function useCriarItemLista(tabela: ListaTabela) {
  const invalidate = useListaInvalidate(tabela);
  return useMutation({
    mutationFn: async ({ nome, ordem }: { nome: string; ordem: number }) => {
      const { error } = await supabase.from(tabela).insert({ nome, ordem, ativo: true } as never);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Item adicionado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAtualizarItemLista(tabela: ListaTabela) {
  const invalidate = useListaInvalidate(tabela);
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: number } & Partial<ItemLista>) => {
      const { error } = await supabase
        .from(tabela)
        .update(patch as never)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirItemLista(tabela: ListaTabela) {
  const invalidate = useListaInvalidate(tabela);
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from(tabela).delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Item excluído");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReordenarLista(tabela: ListaTabela) {
  const invalidate = useListaInvalidate(tabela);
  return useMutation({
    mutationFn: async (ids: number[]) => {
      for (const [index, id] of ids.entries()) {
        const { error } = await supabase
          .from(tabela)
          .update({ ordem: index + 1 } as never)
          .eq("id", id);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ------------------------------ etapas de funil ---------------------------- */

export function useEtapasFunil(funil: Funil) {
  return useQuery({
    queryKey: ["crm_funil_etapas", funil],
    enabled,
    queryFn: async (): Promise<Etapa[]> => {
      const { data, error } = await supabase
        .from("crm_funil_etapas")
        .select("id, funil, nome, ordem, cor, tipo_final")
        .eq("funil", funil)
        .order("ordem", { ascending: true });
      if (error) throw new Error(error.message);
      return (data ?? []) as unknown as Etapa[];
    },
  });
}

function useEtapasInvalidate(funil: Funil) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["crm_funil_etapas", funil] });
    qc.invalidateQueries({ queryKey: FUNIL_KEYS[funil] });
  };
}

export type EtapaPatch = {
  nome?: string;
  cor?: string | null;
  tipo_final?: Etapa["tipo_final"];
  ordem?: number;
};

export function useCriarEtapa(funil: Funil) {
  const invalidate = useEtapasInvalidate(funil);
  return useMutation({
    mutationFn: async (payload: EtapaPatch & { ordem: number }) => {
      const { error } = await supabase
        .from("crm_funil_etapas")
        .insert({ ...payload, funil } as never);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Etapa criada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAtualizarEtapa(funil: Funil) {
  const invalidate = useEtapasInvalidate(funil);
  return useMutation({
    mutationFn: async ({ id, ...patch }: EtapaPatch & { id: string }) => {
      const { error } = await supabase
        .from("crm_funil_etapas")
        .update(patch as never)
        .eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReordenarEtapas(funil: Funil) {
  const invalidate = useEtapasInvalidate(funil);
  return useMutation({
    mutationFn: async (ids: string[]) => {
      for (const [index, id] of ids.entries()) {
        const { error } = await supabase
          .from("crm_funil_etapas")
          .update({ ordem: index + 1 } as never)
          .eq("id", id);
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
}

const CONTAGEM: Record<Funil, { tabela: string; coluna: string; filtro: (q: any) => any }> = {
  leads: {
    tabela: "crm_leads",
    coluna: "etapa_id",
    filtro: (q) => q.eq("convertido", false),
  },
  vendas: {
    tabela: "crm_oportunidades",
    coluna: "etapa_id",
    filtro: (q) => q.is("resultado", null),
  },
  nutricao: {
    tabela: "pessoas",
    coluna: "etapa_nutricao_id",
    filtro: (q) => q,
  },
};

export async function contarRegistrosNaEtapa(funil: Funil, etapaId: string): Promise<number> {
  if (!enabled) return 0;
  const cfg = CONTAGEM[funil];
  let q: any = supabase
    .from(cfg.tabela)
    .select("id", { count: "exact", head: true })
    .eq(cfg.coluna, etapaId);
  q = cfg.filtro(q);
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export function useExcluirEtapa(funil: Funil) {
  const invalidate = useEtapasInvalidate(funil);
  return useMutation({
    mutationFn: async (id: string) => {
      const count = await contarRegistrosNaEtapa(funil, id);
      if (count > 0) {
        throw new Error(
          `Esta etapa possui ${count} registro(s) ativo(s). Mova-os antes de excluir.`,
        );
      }
      const { error } = await supabase.from("crm_funil_etapas").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Etapa excluída");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
