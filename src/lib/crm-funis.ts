import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "./supabase";
import type {
  Etapa,
  Funil,
  PipelineLead,
  PipelineNutricao,
  PipelineVenda,
} from "./crm-types";

const enabled = isSupabaseConfigured;

type Row = Record<string, any>;

async function plain<T>(table: string, build?: (q: any) => any): Promise<T[]> {
  if (!enabled) return [];
  let q: any = supabase.from(table).select("*");
  if (build) q = build(q);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as T[];
}

/** Etapas do funil com os cards aninhados — garante o join etapa ↔ card. */
async function fetchEtapasComCards(funil: Funil, rel: string, fields: string): Promise<Row[]> {
  if (!enabled) return [];
  const { data, error } = await supabase
    .from("crm_funil_etapas")
    .select(`id, funil, nome, ordem, cor, tipo_final, ${rel} ( ${fields} )`)
    .eq("funil", funil)
    .order("ordem", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

function toEtapa(e: Row): Etapa {
  return {
    id: String(e['id']),
    funil: e['funil'] as Funil,
    nome: e['nome'] as string,
    ordem: Number(e['ordem'] ?? 0),
    cor: (e['cor'] as string | null) ?? null,
    tipo_final: (e['tipo_final'] as Etapa["tipo_final"]) ?? null,
  };
}

export type FunilData<T> = { etapas: Etapa[]; cards: T[] };

export const FUNIL_KEYS = {
  leads: ["funil-leads"],
  vendas: ["funil-vendas"],
  nutricao: ["funil-nutricao"],
} as const;

/* ---------------------------------- leads --------------------------------- */

export function useFunilLeads() {
  return useQuery({
    queryKey: FUNIL_KEYS.leads,
    enabled,
    queryFn: async (): Promise<FunilData<PipelineLead>> => {
      const [etapasRows, view] = await Promise.all([
        fetchEtapasComCards(
          "leads",
          "crm_leads",
          "id, nome, whatsapp, email, segmento, origem, instagram, quem_indicou, observacoes, convertido, etapa_id, criado_em, atualizado_em",
        ),
        plain<Row>("crm_pipeline_leads"),
      ]);
      const byId = new Map(view.map((v) => [String(v['id']), v]));
      const etapas = etapasRows.map(toEtapa);
      const cards: PipelineLead[] = [];
      for (const e of etapasRows) {
        for (const lead of (e['crm_leads'] ?? []) as Row[]) {
          if (lead['convertido']) continue;
          const v = byId.get(String(lead['id'])) ?? {};
          cards.push({
            ...(v as Row),
            ...lead,
            id: String(lead['id']),
            etapa_id: String(e['id']),
            etapa_nome: e['nome'] as string,
            etapa_cor: (e['cor'] as string | null) ?? null,
            etapa_ordem: Number(e['ordem'] ?? 0),
            tipo_final: (e['tipo_final'] as Etapa["tipo_final"]) ?? null,
            dias_no_funil: v['dias_no_funil'] ?? null,
            dias_na_etapa: v['dias_na_etapa'] ?? null,
            tarefas_pendentes: v['tarefas_pendentes'] ?? 0,
          } as PipelineLead);
        }
      }
      return { etapas, cards };
    },
  });
}

/* --------------------------------- vendas --------------------------------- */

export function useFunilVendas() {
  return useQuery({
    queryKey: FUNIL_KEYS.vendas,
    enabled,
    queryFn: async (): Promise<FunilData<PipelineVenda>> => {
      const [etapasRows, view] = await Promise.all([
        fetchEtapasComCards(
          "vendas",
          "crm_oportunidades",
          "id, nome, valor, resultado, motivo_perda, data_fechamento, origem, item_id, pessoa_id, etapa_id, criado_em, atualizado_em, pessoas ( id, nome, whatsapp, segmento, area_atuacao ), item ( id, nome )",
        ),
        plain<Row>("crm_pipeline_vendas"),
      ]);
      const byId = new Map(view.map((v) => [String(v['id']), v]));
      const etapas = etapasRows.map(toEtapa);
      const cards: PipelineVenda[] = [];
      for (const e of etapasRows) {
        for (const op of (e['crm_oportunidades'] ?? []) as Row[]) {
          const v = byId.get(String(op['id'])) ?? {};
          const pessoa = (op['pessoas'] ?? null) as Row | null;
          const item = (op['item'] ?? null) as Row | null;
          cards.push({
            ...(v as Row),
            ...op,
            id: String(op['id']),
            nome: op['nome'] as string,
            etapa_id: String(e['id']),
            etapa_nome: e['nome'] as string,
            etapa_cor: (e['cor'] as string | null) ?? null,
            etapa_ordem: Number(e['ordem'] ?? 0),
            pessoa_nome: pessoa?.['nome'] ?? v['pessoa'] ?? null,
            pessoa_whatsapp: pessoa?.['whatsapp'] ?? v['whatsapp'] ?? null,
            segmento: pessoa?.['segmento'] ?? v['segmento'] ?? null,
            area_atuacao: pessoa?.['area_atuacao'] ?? v['area_atuacao'] ?? null,
            item_nome: item?.['nome'] ?? null,
            servico_nome: item?.['nome'] ?? v['servico'] ?? null,
            ltv_atual: v['ltv_atual'] ?? null,
            dias_na_etapa: v['dias_na_etapa'] ?? null,
            tarefas_pendentes: v['tarefas_pendentes'] ?? 0,
          } as PipelineVenda);
        }
      }
      return { etapas, cards };
    },
  });
}

/* -------------------------------- nutrição -------------------------------- */

export function useFunilNutricao() {
  return useQuery({
    queryKey: FUNIL_KEYS.nutricao,
    enabled,
    queryFn: async (): Promise<FunilData<PipelineNutricao>> => {
      const [etapasRows, view] = await Promise.all([
        fetchEtapasComCards(
          "nutricao",
          "pessoas",
          "id, nome, whatsapp, email, segmento, origem, area_atuacao, aniversario, etapa_nutricao_id",
        ),
        plain<Row>("crm_pipeline_nutricao"),
      ]);
      const byId = new Map(view.map((v) => [String(v['id']), v]));
      const etapas = etapasRows.map(toEtapa);
      const cards: PipelineNutricao[] = [];
      for (const e of etapasRows) {
        for (const p of (e['pessoas'] ?? []) as Row[]) {
          const v = byId.get(String(p['id'])) ?? {};
          cards.push({
            ...(v as Row),
            ...p,
            id: String(p['id']),
            etapa_nutricao_id: String(e['id']),
            etapa_nome: e['nome'] as string,
            etapa_cor: (e['cor'] as string | null) ?? null,
            etapa_ordem: Number(e['ordem'] ?? 0),
            ltv_total: v['ltv_total'] ?? 0,
            ultima_transacao: v['ultima_transacao'] ?? null,
            tarefas_pendentes: v['tarefas_pendentes'] ?? 0,
          } as PipelineNutricao);
        }
      }
      return { etapas, cards };
    },
  });
}

/* ------------------------------- mover card ------------------------------- */

type MoveArgs = { table: string; id: string; values: Record<string, unknown> };

export function useMoverCard(funil: Funil, successMessage = "Card movido") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ table, id, values }: MoveArgs) => {
      if (!enabled) throw new Error("Banco não conectado.");
      const { error } = await supabase.from(table).update(values).eq("id", id);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FUNIL_KEYS[funil] });
      void qc.invalidateQueries({ queryKey: ["pipeline_leads"] });
      void qc.invalidateQueries({ queryKey: ["pipeline_vendas"] });
      void qc.invalidateQueries({ queryKey: ["pipeline_nutricao"] });
      void qc.invalidateQueries({ queryKey: ["valor_pipeline"] });
      toast.success(successMessage);
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

/* ------------------------------- exclusões -------------------------------- */

function invalidarFunil(qc: ReturnType<typeof useQueryClient>, funil: Funil) {
  void qc.invalidateQueries({ queryKey: FUNIL_KEYS[funil] });
  void qc.invalidateQueries({ queryKey: ["pipeline_leads"] });
  void qc.invalidateQueries({ queryKey: ["pipeline_vendas"] });
  void qc.invalidateQueries({ queryKey: ["pipeline_nutricao"] });
  void qc.invalidateQueries({ queryKey: ["valor_pipeline"] });
  void qc.invalidateQueries({ queryKey: ["contatos-lista"] });
}

async function del(table: string, column: string, value: string) {
  const { error } = await supabase.from(table).delete().eq(column, value);
  if (error) throw new Error(error.message);
}

export function useExcluirLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (leadId: string) => {
      if (!enabled) throw new Error("Banco não conectado.");
      await del("crm_interacoes", "lead_id", leadId);
      await del("crm_tarefas", "lead_id", leadId);
      await del("crm_leads", "id", leadId);
      return true;
    },
    onSuccess: () => {
      invalidarFunil(qc, "leads");
      void qc.invalidateQueries({ queryKey: ["leads"] });
      toast.success("Lead excluído com sucesso.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useExcluirOportunidade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (oportunidadeId: string) => {
      if (!enabled) throw new Error("Banco não conectado.");
      await del("crm_interacoes", "oportunidade_id", oportunidadeId);
      await del("crm_tarefas", "oportunidade_id", oportunidadeId);
      await del("crm_oportunidades", "id", oportunidadeId);
      return true;
    },
    onSuccess: () => {
      invalidarFunil(qc, "vendas");
      void qc.invalidateQueries({ queryKey: ["oportunidades"] });
      toast.success("Oportunidade excluída com sucesso.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoverDaNutricao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pessoaId: string) => {
      if (!enabled) throw new Error("Banco não conectado.");
      const { error } = await supabase
        .from("pessoas")
        .update({ etapa_nutricao_id: null })
        .eq("id", pessoaId);
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      invalidarFunil(qc, "nutricao");
      toast.success("Contato removido do funil de nutrição.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}



/* -------------------------- contatos + ranking --------------------------- */

export type ContatoLista = {
  id: string;
  nome: string;
  whatsapp: string | null;
  email: string | null;
  segmento: string | null;
  area_atuacao: string | null;
  origem: string | null;
  instagram: string | null;
  quem_indicou: string | null;
  aniversario: string | null;
  criado_em: string | null;
  tipo: string | null;
  etapa_nutricao_id: string | null;
  etapa_nutricao_nome: string | null;
  etapa_nutricao_cor: string | null;
  ltv: number;
};

export function useContatosLista() {
  return useQuery({
    queryKey: ["contatos-lista"],
    enabled,
    queryFn: async (): Promise<ContatoLista[]> => {
      if (!enabled) return [];
      const { data, error } = await supabase
        .from("pessoas")
        .select(
          "id, nome, tipo, whatsapp, email, segmento, area_atuacao, origem, instagram, quem_indicou, aniversario, criado_em, etapa_nutricao_id, crm_funil_etapas ( nome, cor ), transacoes ( valor, natureza_id )",
        )
        .order("nome", { ascending: true });
      if (error) throw new Error(error.message);
      return ((data ?? []) as Row[]).map((c) => {
        const etapa = (c['crm_funil_etapas'] ?? null) as Row | null;
        const transacoes = (c['transacoes'] ?? []) as Row[];
        return {
          id: String(c['id']),
          nome: c['nome'] as string,
          tipo: (c['tipo'] as string | null) ?? null,
          whatsapp: (c['whatsapp'] as string | null) ?? null,
          email: (c['email'] as string | null) ?? null,
          segmento: (c['segmento'] as string | null) ?? null,
          area_atuacao: (c['area_atuacao'] as string | null) ?? null,
          origem: (c['origem'] as string | null) ?? null,
          instagram: (c['instagram'] as string | null) ?? null,
          quem_indicou: (c['quem_indicou'] as string | null) ?? null,
          aniversario: (c['aniversario'] as string | null) ?? null,
          criado_em: (c['criado_em'] as string | null) ?? null,
          etapa_nutricao_id: c['etapa_nutricao_id'] ? String(c['etapa_nutricao_id']) : null,
          etapa_nutricao_nome: (etapa?.['nome'] as string | null) ?? null,
          etapa_nutricao_cor: (etapa?.['cor'] as string | null) ?? null,
          ltv: transacoes
            .filter((t) => Number(t['natureza_id']) === 1)
            .reduce((acc, t) => acc + Number(t['valor'] ?? 0), 0),
        };
      });
    },
  });
}

export type RankingItem = {
  pessoa_id: string;
  nome: string;
  segmento: string | null;
  total: number;
  transacoes: number;
};

export type EvolucaoMes = { mes: string; valor: number };

export function useRankingReceita(inicio: string, fim: string) {
  return useQuery({
    queryKey: ["ranking-receita", inicio, fim],
    enabled,
    queryFn: async (): Promise<{ ranking: RankingItem[]; evolucao: EvolucaoMes[] }> => {
      if (!enabled) return { ranking: [], evolucao: [] };
      const { data, error } = await supabase
        .from("transacoes")
        .select("valor, criado_em, pessoa_id, pessoas ( id, nome, segmento )")
        .eq("natureza_id", 1)
        .gte("criado_em", inicio)
        .lte("criado_em", fim)
        .not("pessoa_id", "is", null);
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as Row[];

      const acc = new Map<string, RankingItem>();
      for (const t of rows) {
        const id = String(t['pessoa_id']);
        const pessoa = (t['pessoas'] ?? null) as Row | null;
        const current =
          acc.get(id) ??
          {
            pessoa_id: id,
            nome: (pessoa?.['nome'] as string | null) ?? "Sem nome",
            segmento: (pessoa?.['segmento'] as string | null) ?? null,
            total: 0,
            transacoes: 0,
          };
        current.total += Number(t['valor'] ?? 0);
        current.transacoes += 1;
        acc.set(id, current);
      }
      const ranking = [...acc.values()].sort((a, b) => b.total - a.total).slice(0, 10);

      const meses = new Map<string, { label: string; valor: number }>();
      for (const t of rows) {
        const raw = t['criado_em'] as string | null;
        if (!raw) continue;
        const d = new Date(raw);
        const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
        const item = meses.get(chave) ?? { label, valor: 0 };
        item.valor += Number(t['valor'] ?? 0);
        meses.set(chave, item);
      }
      const evolucao = [...meses.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([, v]) => ({ mes: v.label, valor: v.valor }));

      return { ranking, evolucao };
    },
  });
}
