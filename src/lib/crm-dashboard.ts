import { crmError } from "@/lib/supabase-error";
import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "./supabase";

const enabled = isSupabaseConfigured;

type Row = Record<string, any>;

export type EtapaLeadsResumo = {
  id: string;
  nome: string;
  cor: string | null;
  tipo_final: string | null;
  ativos: number;
};

export type EtapaVendasResumo = {
  id: string;
  nome: string;
  cor: string | null;
  tipo_final: string | null;
  probabilidade: number | null;
  qtd: number;
  valor: number;
  valorPonderado: number;
};

export type DashboardData = {
  etapasLeads: EtapaLeadsResumo[];
  leadsAtivos: number;
  leadsTotal: number;
  leadsConvertidos: number;
  taxaConversao: number;
  diasMedioFunil: number | null;
  etapasVendas: EtapaVendasResumo[];
  pipelineBruto: number;
  pipelinePonderado: number;
  oportunidadesAbertas: number;
  ticketMedio: number;
  valorGanhoMes: number;
  qtdGanhasMes: number;
  cicloMedio: number | null;
  origens: { origem: string; total: number; convertidos: number }[];
};

const dias = (from: string | null | undefined, to: Date = new Date()) => {
  if (!from) return null;
  const d = new Date(from);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((to.getTime() - d.getTime()) / 86_400_000);
};

const aberta = (o: Row) => !o['resultado'] || String(o['resultado']).toLowerCase() === "aberto";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    enabled,
    queryFn: async (): Promise<DashboardData> => {
      const noventaDias = new Date(Date.now() - 90 * 86_400_000).toISOString();

      const [leadsRes, vendasRes, leads90Res] = await Promise.all([
        supabase
          .from("crm_funil_etapas")
          .select("id, nome, cor, ordem, tipo_final, crm_leads(id, convertido, criado_em)")
          .eq("funil", "leads")
          .order("ordem", { ascending: true }),
        supabase
          .from("crm_funil_etapas")
          .select(
            "id, nome, cor, ordem, tipo_final, probabilidade_fechamento, crm_oportunidades(id, valor, resultado, criado_em, data_fechamento)",
          )
          .eq("funil", "vendas")
          .order("ordem", { ascending: true }),
        supabase.from("crm_leads").select("origem, convertido, criado_em").gte("criado_em", noventaDias),
      ]);

      for (const r of [leadsRes, vendasRes, leads90Res]) {
        if (r.error) throw new Error(r.error.message);
      }

      const etapasLeadsRows = (leadsRes.data ?? []) as Row[];
      const etapasVendasRows = (vendasRes.data ?? []) as Row[];
      const leads90 = (leads90Res.data ?? []) as Row[];

      const todosLeads = etapasLeadsRows.flatMap((e) => (e['crm_leads'] ?? []) as Row[]);
      const leadsAtivosRows = todosLeads.filter((l) => !l['convertido']);
      const leadsConvertidos = todosLeads.length - leadsAtivosRows.length;

      const idadeAtivos = leadsAtivosRows
        .map((l) => dias(l['criado_em'] as string | null))
        .filter((n): n is number => n != null);

      const etapasLeads: EtapaLeadsResumo[] = etapasLeadsRows.map((e) => ({
        id: String(e['id']),
        nome: e['nome'] as string,
        cor: (e['cor'] as string | null) ?? null,
        tipo_final: (e['tipo_final'] as string | null) ?? null,
        ativos: ((e['crm_leads'] ?? []) as Row[]).filter((l) => !l['convertido']).length,
      }));

      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);

      let pipelineBruto = 0;
      let pipelinePonderado = 0;
      let oportunidadesAbertas = 0;
      let valorGanhoMes = 0;
      let qtdGanhasMes = 0;
      const ciclos: number[] = [];

      const etapasVendas: EtapaVendasResumo[] = etapasVendasRows.map((e) => {
        const ops = (e['crm_oportunidades'] ?? []) as Row[];
        const abertas = ops.filter(aberta);
        const valor = abertas.reduce((s, o) => s + Number(o['valor'] ?? 0), 0);
        const prob = e['probabilidade_fechamento'] == null ? null : Number(e['probabilidade_fechamento']);
        const ponderado = valor * ((prob ?? 0) / 100);

        pipelineBruto += valor;
        pipelinePonderado += ponderado;
        oportunidadesAbertas += abertas.length;

        for (const o of ops) {
          const ganho = String(o['resultado'] ?? "").toLowerCase() === "ganho";
          if (!ganho) continue;
          const fech = o['data_fechamento'] ? new Date(o['data_fechamento'] as string) : null;
          if (fech && fech >= inicioMes) {
            valorGanhoMes += Number(o['valor'] ?? 0);
            qtdGanhasMes += 1;
          }
          const ciclo = fech && o['criado_em'] ? dias(o['criado_em'] as string, fech) : null;
          if (ciclo != null && ciclo >= 0) ciclos.push(ciclo);
        }

        return {
          id: String(e['id']),
          nome: e['nome'] as string,
          cor: (e['cor'] as string | null) ?? null,
          tipo_final: (e['tipo_final'] as string | null) ?? null,
          probabilidade: prob,
          qtd: abertas.length,
          valor,
          valorPonderado: ponderado,
        };
      });

      const origensMap = new Map<string, { origem: string; total: number; convertidos: number }>();
      for (const l of leads90) {
        const key = (l['origem'] as string | null) ?? "Não informada";
        const item = origensMap.get(key) ?? { origem: key, total: 0, convertidos: 0 };
        item.total += 1;
        if (l['convertido']) item.convertidos += 1;
        origensMap.set(key, item);
      }

      return {
        etapasLeads,
        leadsAtivos: leadsAtivosRows.length,
        leadsTotal: todosLeads.length,
        leadsConvertidos,
        taxaConversao: todosLeads.length
          ? Math.round((leadsConvertidos / todosLeads.length) * 100)
          : 0,
        diasMedioFunil: idadeAtivos.length
          ? Math.round(idadeAtivos.reduce((s, n) => s + n, 0) / idadeAtivos.length)
          : null,
        etapasVendas,
        pipelineBruto,
        pipelinePonderado,
        oportunidadesAbertas,
        ticketMedio: oportunidadesAbertas ? pipelineBruto / oportunidadesAbertas : 0,
        valorGanhoMes,
        qtdGanhasMes,
        cicloMedio: ciclos.length
          ? Math.round(ciclos.reduce((s, n) => s + n, 0) / ciclos.length)
          : null,
        origens: [...origensMap.values()].sort((a, b) => b.total - a.total),
      };
    },
  });
}
