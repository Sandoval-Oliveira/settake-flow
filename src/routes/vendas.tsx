import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Plus } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { EtapasEmpty } from "@/components/crm/EtapasEmpty";
import { KanbanBoard, type KanbanColumn } from "@/components/crm/Kanban";
import { OportunidadeDialog } from "@/components/crm/OportunidadeDialog";
import { TarefaDialog } from "@/components/crm/TarefaDialog";
import { InteracoesPanel } from "@/components/crm/InteracoesPanel";
import { CrmTable, type CrmColumn } from "@/components/crm/CrmTable";
import { ViewFade, ViewToggle } from "@/components/crm/ViewToggle";
import { RowActions } from "@/components/crm/RowActions";
import { ConfirmDeleteDialog } from "@/components/crm/ConfirmDeleteDialog";
import { OriginBadge, SoftBadge, WhatsAppButton } from "@/components/crm/primitives";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useOportunidades } from "@/lib/crm-api";
import { useExcluirOportunidade, useFunilVendas, useMoverCard } from "@/lib/crm-funis";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Oportunidade, PipelineVenda } from "@/lib/crm-types";
import { formatDate, formatMoney, whatsappLink } from "@/lib/format";


export const Route = createFileRoute("/vendas")({
  head: () => ({
    meta: [
      { title: "Vendas | SetTake CRM" },
      {
        name: "description",
        content: "Funil de vendas do SetTake CRM: oportunidades, valores e fechamento por etapa.",
      },
      { property: "og:title", content: "Vendas | SetTake CRM" },
      { property: "og:description", content: "Acompanhe oportunidades e valor do pipeline." },
    ],
  }),
  component: VendasPage,
});

function VendaCard({
  venda,
  onClick,
  onEdit,
  onDelete,
}: {
  venda: PipelineVenda;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      onClick={onClick}
      className="kanban-card kanban-card-hover cursor-pointer rounded-xl border border-border p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{venda.nome}</h3>
        <div className="flex shrink-0 items-center gap-1">
          <WhatsAppButton href={whatsappLink(venda.pessoa_whatsapp)} />
          <RowActions floating onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
      <p className="mt-0.5 text-xs text-muted-foreground">{venda.pessoa_nome ?? "Sem cliente"}</p>
      <p className="mt-2 text-sm font-bold text-brand">{formatMoney(venda.valor)}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {venda.servico_nome || venda.item_nome ? (
          <SoftBadge>{venda.servico_nome ?? venda.item_nome}</SoftBadge>
        ) : null}
        <OriginBadge origem={venda.origem} />
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        {venda.dias_na_etapa != null ? <span>⏱ {venda.dias_na_etapa}d</span> : null}
        {venda.ltv_atual ? <span>💰 LTV {formatMoney(venda.ltv_atual)}</span> : null}
        {venda.tarefas_pendentes ? <span>✅ {venda.tarefas_pendentes}</span> : null}
      </div>
    </article>
  );
}

function VendasPage() {
  const { data, isLoading } = useFunilVendas();
  const etapas = data?.etapas ?? [];
  const pipeline = data?.cards ?? [];
  const { data: oportunidades = [] } = useOportunidades();
  const mover = useMoverCard("vendas", "Oportunidade movida");

  const [view, setView] = useLocalStorage<"kanban" | "lista">("crm-vendas-view", "kanban");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Oportunidade | null>(null);
  const [detalhe, setDetalhe] = useState<PipelineVenda | null>(null);
  const [tarefaOpen, setTarefaOpen] = useState(false);
  const [excluir, setExcluir] = useState<PipelineVenda | null>(null);
  const excluirOportunidade = useExcluirOportunidade();

  const abrirEdicao = (o: PipelineVenda) => {
    setEditing(oportunidades.find((r) => String(r.id) === String(o.id)) ?? null);
    setDialogOpen(true);
  };

  const total = pipeline
    .filter((o) => !o.resultado)
    .reduce((s, o) => s + Number(o.valor ?? 0), 0);

  const columns: KanbanColumn[] = etapas.map((e) => {
    const soma = pipeline
      .filter((o) => String(o.etapa_id) === String(e.id))
      .reduce((s, o) => s + Number(o.valor ?? 0), 0);
    return {
      id: String(e.id),
      nome: e.nome,
      cor: e.cor,
      subtitle: soma ? formatMoney(soma) : undefined,
    };
  });

  const full = (id: string | null | undefined) =>
    oportunidades.find((o) => String(o.id) === String(id)) ?? null;

  const tableColumns = useMemo<CrmColumn<PipelineVenda>[]>(
    () => [
      {
        id: "nome",
        header: "Nome",
        required: true,
        size: 200,
        cell: (o) => <span className="font-medium">{o.nome}</span>,
      },
      {
        id: "etapa",
        header: "Etapa",
        required: true,
        size: 160,
        cell: (o) => <SoftBadge color={o.etapa_cor}>{o.etapa_nome ?? "—"}</SoftBadge>,
      },
      { id: "contato", header: "Contato", size: 180, cell: (o) => o.pessoa_nome ?? "—" },
      {
        id: "servico",
        header: "Serviço",
        size: 180,
        cell: (o) => o.servico_nome ?? o.item_nome ?? "—",
      },
      {
        id: "valor",
        header: "Valor",
        size: 130,
        cell: (o) => <span className="font-semibold text-brand">{formatMoney(o.valor)}</span>,
      },
      { id: "resultado", header: "Resultado", size: 120, cell: (o) => o.resultado ?? "Aberto" },
      {
        id: "dias",
        header: "Dias em aberto",
        size: 130,
        cell: (o) => (o.dias_na_etapa != null ? `${o.dias_na_etapa}d` : "—"),
      },
      {
        id: "data_fechamento",
        header: "Data fechamento",
        size: 140,
        cell: (o) => formatDate(o.data_fechamento),
      },
      {
        id: "criado_em",
        header: "Criado em",
        size: 130,
        defaultHidden: true,
        cell: (o) => formatDate(o.criado_em),
      },
      {
        id: "acoes",
        header: "",
        required: true,
        size: 60,
        cell: (o) => (
          <RowActions onEdit={() => abrirEdicao(o)} onDelete={() => setExcluir(o)} />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [oportunidades],
  );

  function moverCard(id: string, columnId: string) {
    const etapa = etapas.find((e) => String(e.id) === columnId);
    const values: Record<string, unknown> = {
      etapa_id: columnId,
      atualizado_em: new Date().toISOString(),
    };
    if (etapa?.tipo_final === "ganho") {
      values['resultado'] = "Ganho";
      values['data_fechamento'] = new Date().toISOString().slice(0, 10);
    } else if (etapa?.tipo_final === "perdido") {
      values['resultado'] = "Perdido";
      values['data_fechamento'] = new Date().toISOString().slice(0, 10);
    } else {
      values['resultado'] = null;
    }
    mover.mutate({ table: "crm_oportunidades", id, values });
  }

  return (
    <>
      <PageHeader
        title="Vendas"
        subtitle={`${formatMoney(total)} em pipeline aberto`}
        actions={
          <>
            <ViewToggle
              value={view}
              onChange={setView}
              options={[
                { value: "lista", label: "Lista", icon: List },
                { value: "kanban", label: "Kanban", icon: LayoutGrid },
              ]}
            />
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="brand-gradient font-semibold text-brand-foreground"
            >
              <Plus className="size-4" /> Nova oportunidade
            </Button>
          </>
        }
      />

      {!isLoading && etapas.length === 0 ? (
        <EtapasEmpty funil="vendas" />
      ) : view === "kanban" ? (
        <ViewFade>
          <KanbanBoard
            columns={columns}
            items={pipeline}
            loading={isLoading}
            getId={(o) => String(o.id)}
            getColumnId={(o) => (o.etapa_id ? String(o.etapa_id) : null)}
            onMove={moverCard}
            renderCard={(o) => (
              <VendaCard
                venda={o}
                onClick={() => setDetalhe(o)}
                onEdit={() => abrirEdicao(o)}
                onDelete={() => setExcluir(o)}
              />
            )}
            emptyMessage="Nenhuma oportunidade nesta etapa"
          />
        </ViewFade>
      ) : (
        <ViewFade>
          <CrmTable
            storageKey="crm-vendas"
            columns={tableColumns}
            rows={pipeline}
            loading={isLoading}
            getRowId={(o) => String(o.id)}
            onRowClick={(o) => setDetalhe(o)}
            emptyMessage="Nenhuma oportunidade encontrada"
          />
        </ViewFade>
      )}


      <ConfirmDeleteDialog
        open={Boolean(excluir)}
        onOpenChange={(v) => !v && setExcluir(null)}
        title="Excluir oportunidade?"
        description={`Esta ação não pode ser desfeita. A oportunidade "${excluir?.nome ?? ""}" será removida permanentemente, junto com suas interações e tarefas.`}
        loading={excluirOportunidade.isPending}
        onConfirm={() => {
          if (!excluir) return;
          excluirOportunidade.mutate(String(excluir.id), {
            onSuccess: () => {
              setExcluir(null);
              setDetalhe(null);
            },
          });
        }}
      />

      <OportunidadeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        oportunidade={editing}
        etapas={etapas}
      />
      <TarefaDialog
        open={tarefaOpen}
        onOpenChange={setTarefaOpen}
        vinculo={{
          oportunidade_id: detalhe ? String(detalhe.id) : null,
          pessoa_id: detalhe?.pessoa_id ? String(detalhe.pessoa_id) : null,
        }}
      />

      <Sheet open={Boolean(detalhe)} onOpenChange={(v) => !v && setDetalhe(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{detalhe?.nome}</SheetTitle>
          </SheetHeader>
          {detalhe ? (
            <div className="space-y-5 px-4 pb-8">
              <p className="text-2xl font-bold text-brand">{formatMoney(detalhe.valor)}</p>
              <div className="flex flex-wrap gap-2">
                {detalhe.etapa_nome ? (
                  <SoftBadge color={detalhe.etapa_cor}>{detalhe.etapa_nome}</SoftBadge>
                ) : null}
                <OriginBadge origem={detalhe.origem} />
                {detalhe.resultado ? <SoftBadge>{detalhe.resultado}</SoftBadge> : null}
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">Cliente</dt>
                  <dd className="text-foreground">{detalhe.pessoa_nome ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Serviço</dt>
                  <dd className="text-foreground">
                    {detalhe.servico_nome ?? detalhe.item_nome ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Fechamento</dt>
                  <dd className="text-foreground">{formatDate(detalhe.data_fechamento)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Criada em</dt>
                  <dd className="text-foreground">{formatDate(detalhe.criado_em)}</dd>
                </div>
                {detalhe.motivo_perda ? (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Motivo da perda</dt>
                    <dd className="text-danger">{detalhe.motivo_perda}</dd>
                  </div>
                ) : null}
              </dl>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(full(detalhe.id));
                    setDialogOpen(true);
                  }}
                >
                  Editar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setTarefaOpen(true)}>
                  Nova tarefa
                </Button>
              </div>
              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Interações</h3>
                <InteracoesPanel target={{ oportunidade_id: String(detalhe.id) }} />
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
