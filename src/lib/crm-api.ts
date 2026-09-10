import { crmError } from "@/lib/supabase-error";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  Aniversariante,
  Etapa,
  Funil,
  Interacao,
  Lead,
  MetricaConversao,
  Oportunidade,
  Pessoa,
  PipelineLead,
  PipelineNutricao,
  PipelineVenda,
  Servico,
  Tarefa,
  TarefaPendente,
  ValorPipeline,
} from "./crm-types";

const enabled = isSupabaseConfigured;

async function select<T>(table: string, build?: (q: any) => any): Promise<T[]> {
  if (!enabled) return [];
  let q: any = supabase.from(table).select("*");
  if (build) q = build(q);
  const { data, error } = await q;
  if (error) throw crmError(error);
  return (data ?? []) as T[];
}

/* ---------------------------------- reads --------------------------------- */

export function useEtapas(funil?: Funil) {
  return useQuery({
    queryKey: ["etapas", funil ?? "all"],
    enabled,
    queryFn: () =>
      select<Etapa>("crm_funil_etapas", (q) => {
        const base = funil ? q.eq("funil", funil) : q;
        return base.order("ordem", { ascending: true });
      }),
  });
}

export function usePipelineLeads() {
  return useQuery({
    queryKey: ["pipeline_leads"],
    enabled,
    queryFn: () => select<PipelineLead>("crm_pipeline_leads"),
  });
}

export function usePipelineVendas() {
  return useQuery({
    queryKey: ["pipeline_vendas"],
    enabled,
    queryFn: () => select<PipelineVenda>("crm_pipeline_vendas"),
  });
}

export function usePipelineNutricao() {
  return useQuery({
    queryKey: ["pipeline_nutricao"],
    enabled,
    queryFn: () => select<PipelineNutricao>("crm_pipeline_nutricao"),
  });
}

export function useAniversariantes() {
  return useQuery({
    queryKey: ["aniversariantes"],
    enabled,
    queryFn: () => select<Aniversariante>("crm_aniversariantes"),
  });
}

export function useTarefasPendentesView() {
  return useQuery({
    queryKey: ["tarefas_pendentes"],
    enabled,
    queryFn: () => select<TarefaPendente>("crm_tarefas_pendentes"),
  });
}

export function useMetricas() {
  return useQuery({
    queryKey: ["metricas"],
    enabled,
    queryFn: () => select<MetricaConversao>("crm_metricas_conversao"),
  });
}

export function useValorPipeline() {
  return useQuery({
    queryKey: ["valor_pipeline"],
    enabled,
    queryFn: () => select<ValorPipeline>("crm_valor_pipeline"),
  });
}

export function usePessoas() {
  return useQuery({
    queryKey: ["pessoas"],
    enabled,
    queryFn: () => select<Pessoa>("pessoas", (q) => q.order("nome", { ascending: true })),
  });
}

export function usePessoa(id: string | undefined) {
  return useQuery({
    queryKey: ["pessoa", id],
    enabled: enabled && Boolean(id),
    queryFn: async () => {
      const rows = await select<Pessoa>("pessoas", (q) => q.eq("id", id).limit(1));
      return rows[0] ?? null;
    },
  });
}

export function useOportunidades(pessoaId?: string) {
  return useQuery({
    queryKey: ["oportunidades", pessoaId ?? "all"],
    enabled,
    queryFn: () =>
      select<Oportunidade>("crm_oportunidades", (q) =>
        pessoaId ? q.eq("pessoa_id", pessoaId) : q,
      ),
  });
}

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    enabled,
    queryFn: () => select<Lead>("crm_leads", (q) => q.order("criado_em", { ascending: false })),
  });
}

export function useServicos() {
  return useQuery({
    queryKey: ["servicos"],
    enabled,
    queryFn: async (): Promise<Servico[]> => {
      const grupos = await select<{ id: number; nome: string }>("grupo", (q) =>
        q.eq("natureza_id", 1),
      );
      if (!grupos.length) return [];
      const nomes = new Map(grupos.map((g) => [String(g.id), g.nome]));
      const itens = await select<{ id: number; nome: string; grupo_id: number }>("item", (q) =>
        q.in(
          "grupo_id",
          grupos.map((g) => g.id),
        ),
      );
      return itens
        .map((i) => ({ id: i.id, nome: i.nome, grupo_nome: nomes.get(String(i.grupo_id)) ?? "—" }))
        .sort((a, b) => a.grupo_nome.localeCompare(b.grupo_nome) || a.nome.localeCompare(b.nome));
    },
  });
}

export type LtvInfo = {
  ltv_total: number;
  total_transacoes: number;
  ultima_transacao: string | null;
  ticket_medio: number;
};

export function useLtv(pessoaId: string | undefined) {
  return useQuery({
    queryKey: ["ltv", pessoaId],
    enabled: enabled && Boolean(pessoaId),
    queryFn: async (): Promise<LtvInfo> => {
      const empty: LtvInfo = {
        ltv_total: 0,
        total_transacoes: 0,
        ultima_transacao: null,
        ticket_medio: 0,
      };
      try {
        const rows = await select<Record<string, unknown>>("ltv_clientes", (q) =>
          q.eq("pessoa_id", pessoaId).limit(1),
        );
        const row = rows[0];
        if (!row) return empty;
        const total = Number(row['ltv_total'] ?? row['ltv'] ?? row['valor_total'] ?? 0);
        const qtd = Number(row['total_transacoes'] ?? row['transacoes'] ?? row['qtd_transacoes'] ?? 0);
        return {
          ltv_total: total,
          total_transacoes: qtd,
          ultima_transacao: (row['ultima_transacao'] as string | null) ?? null,
          ticket_medio: Number(row['ticket_medio'] ?? (qtd ? total / qtd : 0)),
        };
      } catch {
        return empty;
      }
    },
  });
}

export function useTarefas() {
  return useQuery({
    queryKey: ["tarefas"],
    enabled,
    queryFn: () =>
      select<Tarefa>("crm_tarefas", (q) => q.order("prazo", { ascending: true, nullsFirst: false })),
  });
}

export function useInteracoes(filter: {
  lead_id?: string | null;
  pessoa_id?: string | null;
  oportunidade_id?: string | null;
}) {
  const key = filter.lead_id ?? filter.pessoa_id ?? filter.oportunidade_id ?? null;
  return useQuery({
    queryKey: ["interacoes", key],
    enabled: enabled && Boolean(key),
    queryFn: () =>
      select<Interacao>("crm_interacoes", (q) => {
        let base = q;
        if (filter.lead_id) base = base.eq("lead_id", filter.lead_id);
        if (filter.pessoa_id) base = base.eq("pessoa_id", filter.pessoa_id);
        if (filter.oportunidade_id) base = base.eq("oportunidade_id", filter.oportunidade_id);
        return base.order("criado_em", { ascending: false });
      }),
  });
}

/* -------------------------------- mutations ------------------------------- */

const PIPELINE_KEYS = [
  ["pipeline_leads"],
  ["pipeline_vendas"],
  ["pipeline_nutricao"],
  ["leads"],
  ["pessoas"],
  ["oportunidades"],
  ["tarefas"],
  ["tarefas_pendentes"],
  ["valor_pipeline"],
  ["metricas"],
  ["aniversariantes"],
];

export function useInvalidateCrm() {
  const qc = useQueryClient();
  return () => {
    for (const key of PIPELINE_KEYS) void qc.invalidateQueries({ queryKey: key });
    void qc.invalidateQueries({ queryKey: ["interacoes"] });
  };
}

async function write(
  op: "insert" | "update" | "delete",
  table: string,
  payload?: Record<string, unknown>,
  id?: string,
) {
  if (!isSupabaseConfigured) {
    throw new Error("Banco não conectado. Conecte seu Supabase em Configurações → Integrações.");
  }
  if (op === "insert") {
    const { data, error } = await supabase.from(table).insert(payload!).select("*").single();
    if (error) throw crmError(error);
    return data;
  }
  if (op === "update") {
    const { data, error } = await supabase
      .from(table)
      .update(payload!)
      .eq("id", id!)
      .select("*")
      .single();
    if (error) throw crmError(error);
    return data;
  }
  const { error } = await supabase.from(table).delete().eq("id", id!);
  if (error) throw crmError(error);
  return null;
}

type SaveArgs = { table: string; id?: string | null; values: Record<string, unknown> };

export function useSaveRecord(successMessage = "Salvo com sucesso") {
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: async ({ table, id, values }: SaveArgs) =>
      id ? write("update", table, values, id) : write("insert", table, values),
    onSuccess: () => {
      invalidate();
      toast.success(successMessage);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteRecord(successMessage = "Registro excluído") {
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: async ({ table, id }: { table: string; id: string }) =>
      write("delete", table, undefined, id),
    onSuccess: () => {
      invalidate();
      toast.success(successMessage);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export type ConversaoPayload = {
  lead: Lead;
  pessoa: Record<string, unknown>;
  oportunidade: Record<string, unknown> | null;
};

export function useConverterLead() {
  const invalidate = useInvalidateCrm();
  return useMutation({
    mutationFn: async ({ lead, pessoa, oportunidade }: ConversaoPayload) => {
      const nova = (await write("insert", "pessoas", {
        ...pessoa,
        lead_origem_id: lead.id,
      })) as Pessoa;
      await write("update", "crm_leads", { convertido: true, pessoa_id: nova.id }, lead.id);
      if (oportunidade) {
        await write("insert", "crm_oportunidades", { ...oportunidade, pessoa_id: nova.id });
      }
      return nova;
    },
    onSuccess: () => {
      invalidate();
      toast.success("✅ Lead convertido! Contato e oportunidade criados.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
