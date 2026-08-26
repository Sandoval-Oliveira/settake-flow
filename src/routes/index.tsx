import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/crm/PageHeader";
import { EmptyState, OriginBadge, Panel, PriorityBadge, WhatsAppButton } from "@/components/crm/primitives";
import {
  useAniversariantes,
  useMetricas,
  usePipelineLeads,
  usePipelineVendas,
  useTarefasPendentesView,
  useValorPipeline,
} from "@/lib/crm-api";
import { formatDate, formatDayMonth, formatMoney, percent, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard | SetTake CRM" },
      {
        name: "description",
        content:
          "Visão geral do SetTake CRM: leads ativos, valor em pipeline, tarefas do dia e aniversariantes.",
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

function Kpi({
  label,
  value,
  hint,
  tone = "brand",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "brand" | "success" | "info" | "danger";
}) {
  const toneClass = {
    brand: "text-brand",
    success: "text-success",
    info: "text-info",
    danger: "text-danger",
  }[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClass}`}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Dashboard() {
  const { data: leads = [], isLoading: loadingLeads } = usePipelineLeads();
  const { data: vendas = [] } = usePipelineVendas();
  const { data: tarefas = [] } = useTarefasPendentesView();
  const { data: aniversariantes = [] } = useAniversariantes();
  const { data: valorPipeline = [] } = useValorPipeline();
  const { data: metricas = [] } = useMetricas();

  const leadsAtivos = leads.filter((l) => !l.convertido).length;
  const convertidos = leads.filter((l) => l.convertido).length;
  const emAberto = vendas.filter((o) => !o.resultado);
  const pipeline = emAberto.reduce((s, o) => s + Number(o.valor ?? 0), 0);
  const ganhas = vendas.filter((o) => o.resultado === "Ganho");
  const valorGanho = ganhas.reduce((s, o) => s + Number(o.valor ?? 0), 0);
  const atrasadas = tarefas.filter((t) => t.atrasada);

  const maxValor = useMemo(
    () => Math.max(1, ...valorPipeline.map((v) => Number(v.valor_total ?? 0))),
    [valorPipeline],
  );

  const mesAtual = metricas[0];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Visão geral dos funis, tarefas e relacionamento"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Leads ativos"
          value={loadingLeads ? "—" : String(leadsAtivos)}
          hint={`${percent(convertidos, leads.length)}% de conversão`}
        />
        <Kpi
          label="Pipeline de vendas"
          value={formatMoney(pipeline)}
          hint={`${emAberto.length} oportunidade(s) em aberto`}
          tone="info"
        />
        <Kpi
          label="Vendas ganhas"
          value={formatMoney(valorGanho)}
          hint={`${ganhas.length} negócio(s) fechado(s)`}
          tone="success"
        />
        <Kpi
          label="Tarefas atrasadas"
          value={String(atrasadas.length)}
          hint={`${tarefas.length} pendente(s) no total`}
          tone={atrasadas.length ? "danger" : "brand"}
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel
          title="Valor por etapa do funil de vendas"
          className="xl:col-span-2"
          action={
            <Link to="/vendas" className="text-xs font-semibold text-brand hover:underline">
              Ver funil
            </Link>
          }
        >
          {valorPipeline.length === 0 ? (
            <EmptyState icon="📊" message="Sem oportunidades para exibir" />
          ) : (
            <ul className="space-y-3">
              {valorPipeline.map((v) => (
                <li key={String(v.etapa_id)}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="font-medium text-foreground">{v.etapa_nome}</span>
                    <span className="text-muted-foreground">
                      {v.total_oportunidades ?? 0} · {formatMoney(v.valor_total)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(Number(v.valor_total ?? 0) / maxValor) * 100}%`,
                        backgroundColor: v.etapa_cor ?? "#e8b800",
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Tarefas do dia"
          action={
            <Link to="/tarefas" className="text-xs font-semibold text-brand hover:underline">
              Ver todas
            </Link>
          }
        >
          {tarefas.length === 0 ? (
            <EmptyState icon="✅" message="Nenhuma tarefa pendente" />
          ) : (
            <ul className="space-y-3">
              {tarefas.slice(0, 6).map((t) => (
                <li
                  key={String(t.id)}
                  className="rounded-lg border border-border bg-surface/50 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{t.titulo}</span>
                    <PriorityBadge prioridade={t.prioridade} />
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t.atrasada ? "⚠️ Atrasada · " : ""}
                    {formatDate(t.prazo)}
                    {t.lead_nome || t.pessoa_nome ? ` · ${t.lead_nome ?? t.pessoa_nome}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel title="Aniversariantes próximos" className="xl:col-span-2">
          {aniversariantes.length === 0 ? (
            <EmptyState icon="🎂" message="Nenhum aniversário nos próximos dias" />
          ) : (
            <ul className="divide-y divide-border">
              {aniversariantes.slice(0, 8).map((a) => (
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
                      {a.ltv_total ? ` · LTV ${formatMoney(a.ltv_total)}` : ""}
                    </p>
                  </div>
                  <WhatsAppButton href={whatsappLink(a.whatsapp)} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Origem dos leads">
          {leads.length === 0 ? (
            <EmptyState icon="📈" message="Sem leads cadastrados" />
          ) : (
            <ul className="space-y-2">
              {Object.entries(
                leads.reduce<Record<string, number>>((acc, l) => {
                  const key = l.origem ?? "Não informada";
                  acc[key] = (acc[key] ?? 0) + 1;
                  return acc;
                }, {}),
              )
                .sort((a, b) => b[1] - a[1])
                .map(([origem, total]) => (
                  <li key={origem} className="flex items-center justify-between gap-2">
                    <OriginBadge origem={origem} />
                    <span className="text-xs font-semibold text-foreground">{total}</span>
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
