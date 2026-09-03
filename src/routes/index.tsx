import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { EmptyState, OriginBadge, Panel, PriorityBadge, WhatsAppButton } from "@/components/crm/primitives";
import { useAniversariantes, useMetricas, useTarefasPendentesView } from "@/lib/crm-api";
import { useDashboard } from "@/lib/crm-dashboard";
import { formatDateTime, formatDayMonth, formatMoney, whatsappLink } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | SetTake CRM" },
      {
        name: "description",
        content:
          "Visão geral do SetTake CRM: leads ativos, pipeline bruto e ponderado, tarefas do dia e aniversariantes.",
      },
      { property: "og:title", content: "Dashboard | SetTake CRM" },
      {
        property: "og:description",
        content: "Acompanhe leads, vendas, nutrição e tarefas em um só painel.",
      },
    ],
  }),
  component: Dashboard,
});

type Tone = "neutro" | "accent" | "positivo" | "alerta";

const TONE_CLASS: Record<Tone, string> = {
  neutro: "text-foreground",
  accent: "text-brand",
  positivo: "text-success",
  alerta: "text-danger",
};

function Kpi({
  label,
  value,
  hint,
  tone = "neutro",
  title,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  title?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5" title={title}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("mt-2 text-2xl font-bold", TONE_CLASS[tone])}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Barra({ pct, dim }: { pct: number; dim?: boolean }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-secondary">
      <div
        className={cn("h-full rounded-full", dim ? "bg-border" : "brand-gradient")}
        style={{ width: `${Math.max(pct, 2)}%` }}
      />
    </div>
  );
}

function isFinalPerdido(tipo: string | null) {
  return tipo === "perdido" || tipo === "desqualificado";
}

function Dashboard() {
  const { data, isLoading } = useDashboard();
  const { data: tarefas = [] } = useTarefasPendentesView();
  const { data: aniversariantes = [] } = useAniversariantes();
  const { data: metricas = [] } = useMetricas();

  const atrasadas = tarefas.filter((t) => t.atrasada);
  const limite = Date.now() + 2 * 86_400_000;
  const urgentes = tarefas
    .filter((t) => {
      const prazo = t.prazo ? new Date(t.prazo).getTime() : null;
      return t.prioridade === "Urgente" || (prazo != null && prazo <= limite);
    })
    .slice(0, 4);

  const maxLeads = Math.max(1, ...(data?.etapasLeads.map((e) => e.ativos) ?? [0]));
  const maxValor = Math.max(1, ...(data?.etapasVendas.map((e) => e.valor) ?? [0]));
  const etapaTop = [...(data?.etapasVendas ?? [])].sort((a, b) => b.valor - a.valor)[0];
  const mesAtual = metricas[0];

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Visão geral dos funis, tarefas e relacionamento" />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi
          label="Leads ativos"
          value={isLoading ? "—" : String(data?.leadsAtivos ?? 0)}
          hint={`${data?.taxaConversao ?? 0}% de conversão`}
        />
        <Kpi
          label="Pipeline bruto"
          value={formatMoney(data?.pipelineBruto)}
          hint={`${data?.oportunidadesAbertas ?? 0} oportunidade(s) em aberto`}
          tone="accent"
        />
        <Kpi
          label="Pipeline ponderado"
          value={formatMoney(data?.pipelinePonderado)}
          hint="Valor ajustado por probabilidade"
          tone="accent"
          title="Cada oportunidade multiplicada pela probabilidade de fechamento da etapa"
        />
        <Kpi
          label="Vendas ganhas"
          value={formatMoney(data?.valorGanhoMes)}
          hint={`${data?.qtdGanhasMes ?? 0} negócio(s) fechado(s) este mês`}
          tone={data?.valorGanhoMes ? "positivo" : "neutro"}
        />
        <Kpi
          label="Ticket médio"
          value={formatMoney(data?.ticketMedio)}
          hint="Média das oportunidades abertas"
        />
        <Kpi
          label="Tarefas atrasadas"
          value={String(atrasadas.length)}
          hint={`${tarefas.length} pendente(s) no total`}
          tone={atrasadas.length ? "alerta" : "neutro"}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel
          title={
            <span>
              Funil de Leads
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {data?.leadsAtivos ?? 0} leads ativos
              </span>
            </span>
          }
          action={
            <Link to="/leads" className="text-xs font-semibold text-brand hover:underline">
              Ver funil →
            </Link>
          }
        >
          {!data?.etapasLeads.length ? (
            <EmptyState icon="🎯" message="Nenhuma etapa configurada no funil de leads" />
          ) : (
            <ul className="space-y-3">
              {data.etapasLeads.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="w-[140px] shrink-0 truncate text-[13px] text-muted-foreground">
                    {e.nome}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Barra
                      pct={(e.ativos / maxLeads) * 100}
                      dim={isFinalPerdido(e.tipo_final)}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right text-[13px] font-semibold text-foreground">
                    {e.ativos}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
            <span>Taxa de conversão: {data?.taxaConversao ?? 0}%</span>
            <span>
              Tempo médio no funil:{" "}
              {data?.diasMedioFunil != null ? `${data.diasMedioFunil} dias` : "—"}
            </span>
          </div>
        </Panel>

        <Panel
          title={
            <span>
              Funil de Vendas
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {formatMoney(data?.pipelineBruto)} em pipeline
              </span>
            </span>
          }
          action={
            <Link to="/vendas" className="text-xs font-semibold text-brand hover:underline">
              Ver funil →
            </Link>
          }
        >
          {!data?.etapasVendas.length ? (
            <EmptyState icon="💰" message="Nenhuma etapa configurada no funil de vendas" />
          ) : (
            <ul className="space-y-3">
              {data.etapasVendas.map((e) => (
                <li key={e.id} className="flex items-center gap-3">
                  <span className="w-[120px] shrink-0 truncate text-[13px] text-muted-foreground">
                    {e.nome}
                  </span>
                  <span className="w-9 shrink-0 text-[11px] font-semibold text-brand">
                    {e.probabilidade != null ? `${e.probabilidade}%` : "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Barra
                      pct={(e.valor / maxValor) * 100}
                      dim={isFinalPerdido(e.tipo_final)}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-[13px] text-muted-foreground">
                    {e.qtd}
                  </span>
                  <span className="w-24 shrink-0 text-right text-[13px] font-semibold text-foreground">
                    {formatMoney(e.valor)}
                  </span>
                  <span className="w-3 shrink-0 text-center text-brand" aria-hidden>
                    {etapaTop && etapaTop.id === e.id && e.valor > 0 ? "★" : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4 space-y-1 border-t border-border pt-3 text-[11px] text-muted-foreground">
            <p>
              Pipeline bruto: <span className="text-foreground">{formatMoney(data?.pipelineBruto)}</span> ·
              Pipeline ponderado:{" "}
              <span className="font-semibold text-brand">{formatMoney(data?.pipelinePonderado)}</span>
            </p>
            <p>
              Ticket médio: {formatMoney(data?.ticketMedio)} · Ciclo médio:{" "}
              {data?.cicloMedio != null ? `${data.cicloMedio}d` : "—"}
            </p>
          </div>
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel
          title="Tarefas urgentes"
          action={
            <Link to="/tarefas" className="text-xs font-semibold text-brand hover:underline">
              Ver todas
            </Link>
          }
        >
          {urgentes.length === 0 ? (
            <EmptyState icon="✅" message="Nenhuma tarefa urgente" />
          ) : (
            <ul className="space-y-3">
              {urgentes.map((t) => (
                <li key={String(t.id)} className="rounded-lg border border-border bg-surface/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{t.titulo}</span>
                    <PriorityBadge prioridade={t.prioridade} />
                  </div>
                  <p
                    className={cn(
                      "mt-1 flex items-center gap-1 text-[11px]",
                      t.atrasada ? "text-danger" : "text-muted-foreground",
                    )}
                  >
                    {t.atrasada ? <AlertCircle className="size-3" /> : null}
                    {t.prazo ? formatDateTime(t.prazo) : "Sem prazo"}
                    {t.lead_nome || t.pessoa_nome ? ` · ${t.lead_nome ?? t.pessoa_nome}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Aniversariantes"
          action={
            <Link to="/contatos" className="text-xs font-semibold text-brand hover:underline">
              Ver contatos
            </Link>
          }
        >
          {aniversariantes.length === 0 ? (
            <EmptyState icon="🎂" message="Nenhum aniversário nos próximos dias" />
          ) : (
            <ul className="divide-y divide-border">
              {aniversariantes.slice(0, 4).map((a) => (
                <li key={String(a.id)} className="flex items-center gap-3 py-2.5">
                  <span className="text-lg" aria-hidden>
                    🎂
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.nome}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDayMonth(a.aniversario)}
                      {a.dias_para_aniversario != null
                        ? ` · em ${a.dias_para_aniversario} dia(s)`
                        : ""}
                      {a.ltv_total ? (
                        <span className="text-brand"> · LTV {formatMoney(a.ltv_total)}</span>
                      ) : null}
                    </p>
                  </div>
                  <WhatsAppButton href={whatsappLink(a.whatsapp)} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Origem dos leads (90 dias)">
          {!data?.origens.length ? (
            <EmptyState icon="📈" message="Sem leads no período" />
          ) : (
            <ul className="space-y-2">
              {data.origens.map((o) => (
                <li key={o.origem} className="flex items-center justify-between gap-2">
                  <OriginBadge origem={o.origem} />
                  <span className="text-xs font-semibold text-foreground">{o.total}</span>
                </li>
              ))}
            </ul>
          )}
          {mesAtual ? (
            <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted-foreground">
              Ticket médio do período: {formatMoney(mesAtual.ticket_medio)}
            </p>
          ) : null}
        </Panel>
      </div>
    </>
  );
}
