import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { EtapasEmpty } from "@/components/crm/EtapasEmpty";
import { KanbanBoard, type KanbanColumn } from "@/components/crm/Kanban";
import { TarefaDialog } from "@/components/crm/TarefaDialog";
import { InteracoesPanel } from "@/components/crm/InteracoesPanel";
import { CrmTable, type CrmColumn } from "@/components/crm/CrmTable";
import { ViewFade, ViewToggle } from "@/components/crm/ViewToggle";
import { RowActions } from "@/components/crm/RowActions";
import { ConfirmDeleteDialog } from "@/components/crm/ConfirmDeleteDialog";
import { OriginBadge, SoftBadge, WhatsAppButton } from "@/components/crm/primitives";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useFunilNutricao, useMoverCard, useRemoverDaNutricao } from "@/lib/crm-funis";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { PipelineNutricao } from "@/lib/crm-types";
import { formatDate, formatDayMonth, formatMoney, whatsappLink } from "@/lib/format";


export const Route = createFileRoute("/nutricao")({
  head: () => ({
    meta: [
      { title: "Nutrição | SetTake CRM" },
      {
        name: "description",
        content:
          "Funil de nutrição de clientes do SetTake CRM: relacionamento, LTV e reativação de carteira.",
      },
      { property: "og:title", content: "Nutrição | SetTake CRM" },
      { property: "og:description", content: "Relacionamento contínuo com a carteira de clientes." },
    ],
  }),
  component: NutricaoPage,
});

type Engajamento = { cor: string; label: string; titulo: string };

function engajamento(dias: number | null | undefined): Engajamento {
  if (dias == null)
    return { cor: "bg-muted-foreground", label: "sem interações", titulo: "Nenhuma interação registrada" };
  if (dias <= 14)
    return { cor: "bg-success", label: `${dias}d sem contato`, titulo: "Engajamento recente" };
  if (dias <= 30)
    return { cor: "bg-warning", label: `${dias}d sem contato`, titulo: "Atenção: contato esfriando" };
  return { cor: "bg-danger", label: `${dias}d sem contato`, titulo: "Frio: mais de 30 dias sem contato" };
}

function NutricaoCard({
  item,
  onClick,
  onEdit,
  onDelete,
}: {
  item: PipelineNutricao;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const eng = engajamento(item.dias_ultima_interacao);
  return (
    <article
      onClick={onClick}
      className="kanban-card kanban-card-hover cursor-pointer rounded-xl border border-border p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          <span
            className={cn("size-2 shrink-0 rounded-full", eng.cor)}
            title={eng.titulo}
            aria-hidden
          />
          <span className="truncate">{item.nome}</span>
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          <WhatsAppButton href={whatsappLink(item.whatsapp)} />
          <RowActions floating deleteLabel="Remover do funil" onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
      <p className="mt-1 text-sm font-bold text-brand">{formatMoney(item.ltv_total)}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {item.segmento ? <SoftBadge>{item.segmento}</SoftBadge> : null}
        {item.area_atuacao ? <SoftBadge>{item.area_atuacao}</SoftBadge> : null}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span title={eng.titulo}>💬 {eng.label}</span>
        {item.tarefas_pendentes ? <span>✅ {item.tarefas_pendentes}</span> : null}
      </div>
    </article>
  );
}

type UltimoContato =
  | "qualquer"
  | "2semanas"
  | "1mes"
  | "mais30"
  | "mais60"
  | "sem";

const CONTATO_OPCOES: { value: UltimoContato; label: string }[] = [
  { value: "qualquer", label: "Qualquer" },
  { value: "2semanas", label: "Últimas 2 semanas" },
  { value: "1mes", label: "Último mês" },
  { value: "mais30", label: "Mais de 30 dias" },
  { value: "mais60", label: "Mais de 60 dias" },
  { value: "sem", label: "Sem interações" },
];

function passaContato(dias: number | null | undefined, filtro: UltimoContato) {
  if (filtro === "qualquer") return true;
  if (filtro === "sem") return dias == null;
  if (dias == null) return false;
  if (filtro === "2semanas") return dias <= 14;
  if (filtro === "1mes") return dias <= 30;
  if (filtro === "mais30") return dias > 30;
  return dias > 60;
}

function NutricaoPage() {
  const { data, isLoading } = useFunilNutricao();
  const etapas = data?.etapas ?? [];
  const todos = data?.cards ?? [];
  const mover = useMoverCard("nutricao", "Cliente movido");

  const [view, setView] = useLocalStorage<"kanban" | "lista">("crm-nutricao-view", "kanban");
  const [detalhe, setDetalhe] = useState<PipelineNutricao | null>(null);
  const [tarefaOpen, setTarefaOpen] = useState(false);
  const [remover, setRemover] = useState<PipelineNutricao | null>(null);
  const removerDaNutricao = useRemoverDaNutricao();

  const [busca, setBusca] = useState("");
  const [segmento, setSegmento] = useState<string>("todos");
  const [area, setArea] = useState<string>("todas");
  const [contato, setContato] = useState<UltimoContato>("qualquer");

  const segmentos = [...new Set(todos.map((p) => p.segmento).filter(Boolean))] as string[];
  const areas = [...new Set(todos.map((p) => p.area_atuacao).filter(Boolean))] as string[];

  const pipeline = todos.filter((p) => {
    const termo = busca.trim().toLowerCase();
    if (
      termo &&
      !`${p.nome ?? ""} ${p.whatsapp ?? ""} ${p.email ?? ""}`.toLowerCase().includes(termo)
    )
      return false;
    if (segmento !== "todos" && p.segmento !== segmento) return false;
    if (area !== "todas" && p.area_atuacao !== area) return false;
    return passaContato(p.dias_ultima_interacao, contato);
  });

  const ltvTotal = pipeline.reduce((s, p) => s + Number(p.ltv_total ?? 0), 0);
  const frios = pipeline.filter((p) => (p.dias_ultima_interacao ?? 999) > 30).length;
  const filtrosAtivos =
    Boolean(busca.trim()) || segmento !== "todos" || area !== "todas" || contato !== "qualquer";

  const columns: KanbanColumn[] = etapas.map((e) => {
    const daEtapa = pipeline.filter((p) => String(p.etapa_nutricao_id) === String(e.id));
    const soma = daEtapa.reduce((s, p) => s + Number(p.ltv_total ?? 0), 0);
    const friosEtapa = daEtapa.filter((p) => (p.dias_ultima_interacao ?? 999) > 30).length;
    return {
      id: String(e.id),
      nome: e.nome,
      cor: e.cor,
      subtitle: [soma ? formatMoney(soma) : null, friosEtapa ? `${friosEtapa} frio(s)` : null]
        .filter(Boolean)
        .join(" · ") || undefined,
    };
  });

  const tableColumns = useMemo<CrmColumn<PipelineNutricao>[]>(
    () => [
      {
        id: "nome",
        header: "Nome",
        required: true,
        size: 200,
        cell: (p) => <span className="font-medium">{p.nome}</span>,
      },
      {
        id: "etapa",
        header: "Etapa nutrição",
        required: true,
        size: 170,
        cell: (p) => <SoftBadge color={p.etapa_cor}>{p.etapa_nome ?? "—"}</SoftBadge>,
      },
      { id: "segmento", header: "Segmento", size: 140, cell: (p) => p.segmento ?? "—" },
      { id: "origem", header: "Origem", size: 160, cell: (p) => p.origem ?? "—" },
      { id: "whatsapp", header: "WhatsApp", size: 150, cell: (p) => p.whatsapp ?? "—" },
      { id: "email", header: "Email", size: 200, defaultHidden: true, cell: (p) => p.email ?? "—" },
      {
        id: "area_atuacao",
        header: "Área de atuação",
        size: 170,
        cell: (p) => p.area_atuacao ?? "—",
      },
      {
        id: "aniversario",
        header: "Aniversário",
        size: 120,
        cell: (p) => (p.aniversario ? formatDayMonth(p.aniversario) : "—"),
      },
      {
        id: "ltv",
        header: "LTV (R$)",
        size: 140,
        cell: (p) => <span className="font-semibold text-brand">{formatMoney(p.ltv_total)}</span>,
      },
      {
        id: "acoes",
        header: "",
        required: true,
        size: 60,
        cell: (p) => (
          <RowActions
            deleteLabel="Remover do funil"
            onEdit={() => setDetalhe(p)}
            onDelete={() => setRemover(p)}
          />
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Nutrição"
        subtitle={`${pipeline.length} cliente(s) · LTV total ${formatMoney(ltvTotal)}`}
        actions={
          <ViewToggle
            value={view}
            onChange={setView}
            options={[
              { value: "lista", label: "Lista", icon: List },
              { value: "kanban", label: "Kanban", icon: LayoutGrid },
            ]}
          />
        }
      />

      {!isLoading && etapas.length === 0 ? (
        <EtapasEmpty funil="nutricao" />
      ) : view === "kanban" ? (
        <ViewFade>
          <KanbanBoard
            columns={columns}
            items={pipeline}
            loading={isLoading}
            getId={(p) => String(p.id)}
            getColumnId={(p) => (p.etapa_nutricao_id ? String(p.etapa_nutricao_id) : null)}
            onMove={(id, columnId) =>
              mover.mutate({ table: "pessoas", id, values: { etapa_nutricao_id: columnId } })
            }
            renderCard={(p) => (
              <NutricaoCard
                item={p}
                onClick={() => setDetalhe(p)}
                onEdit={() => setDetalhe(p)}
                onDelete={() => setRemover(p)}
              />
            )}
            emptyMessage="Nenhum cliente nesta etapa"
          />
        </ViewFade>
      ) : (
        <ViewFade>
          <CrmTable
            storageKey="crm-nutricao"
            columns={tableColumns}
            rows={pipeline}
            loading={isLoading}
            getRowId={(p) => String(p.id)}
            onRowClick={(p) => setDetalhe(p)}
            emptyMessage="Nenhum cliente encontrado"
          />
        </ViewFade>
      )}


      <ConfirmDeleteDialog
        open={Boolean(remover)}
        onOpenChange={(v) => !v && setRemover(null)}
        title="Remover do funil de nutrição?"
        description={`O contato "${remover?.nome ?? ""}" será removido do funil de nutrição, mas seus dados e histórico financeiro serão mantidos na aba Contatos.`}
        confirmLabel="Remover"
        loading={removerDaNutricao.isPending}
        onConfirm={() => {
          if (!remover) return;
          removerDaNutricao.mutate(String(remover.id), {
            onSuccess: () => {
              setRemover(null);
              setDetalhe(null);
            },
          });
        }}
      />

      <TarefaDialog
        open={tarefaOpen}
        onOpenChange={setTarefaOpen}
        vinculo={{ pessoa_id: detalhe ? String(detalhe.id) : null }}
      />

      <Sheet open={Boolean(detalhe)} onOpenChange={(v) => !v && setDetalhe(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{detalhe?.nome}</SheetTitle>
          </SheetHeader>
          {detalhe ? (
            <div className="space-y-5 px-4 pb-8">
              <p className="text-2xl font-bold text-brand">{formatMoney(detalhe.ltv_total)}</p>
              <div className="flex flex-wrap gap-2">
                {detalhe.etapa_nome ? (
                  <SoftBadge color={detalhe.etapa_cor}>{detalhe.etapa_nome}</SoftBadge>
                ) : null}
                <OriginBadge origem={detalhe.origem} />
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Segmento</dt>
                  <dd className="text-foreground">{detalhe.segmento ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Área de atuação</dt>
                  <dd className="text-foreground">{detalhe.area_atuacao ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Última transação</dt>
                  <dd className="text-foreground">{formatDate(detalhe.ultima_transacao)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">WhatsApp</dt>
                  <dd className="text-foreground">{detalhe.whatsapp ?? "—"}</dd>
                </div>
              </dl>
              <Button size="sm" variant="secondary" onClick={() => setTarefaOpen(true)}>
                Nova tarefa
              </Button>
              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Interações</h3>
                <InteracoesPanel target={{ pessoa_id: String(detalhe.id) }} />
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
