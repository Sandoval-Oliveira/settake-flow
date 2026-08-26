import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { EtapasEmpty } from "@/components/crm/EtapasEmpty";
import { KanbanBoard, type KanbanColumn } from "@/components/crm/Kanban";
import { OportunidadeDialog } from "@/components/crm/OportunidadeDialog";
import { TarefaDialog } from "@/components/crm/TarefaDialog";
import { InteracoesPanel } from "@/components/crm/InteracoesPanel";
import { OriginBadge, SoftBadge, WhatsAppButton } from "@/components/crm/primitives";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEtapas, useOportunidades, usePipelineVendas, useSaveRecord } from "@/lib/crm-api";
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

function VendaCard({ venda, onClick }: { venda: PipelineVenda; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      className="kanban-card kanban-card-hover cursor-pointer rounded-xl border border-border p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{venda.nome}</h3>
        <WhatsAppButton href={whatsappLink(venda.pessoa_whatsapp)} />
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
  const { data: etapas = [], isLoading: loadingEtapas } = useEtapas("vendas");
  const { data: pipeline = [], isLoading } = usePipelineVendas();
  const { data: oportunidades = [] } = useOportunidades();
  const save = useSaveRecord("Oportunidade movida");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Oportunidade | null>(null);
  const [detalhe, setDetalhe] = useState<PipelineVenda | null>(null);
  const [tarefaOpen, setTarefaOpen] = useState(false);

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

  return (
    <>
      <PageHeader
        title="Vendas"
        subtitle={`${formatMoney(total)} em pipeline aberto`}
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="brand-gradient font-semibold text-brand-foreground"
          >
            <Plus className="size-4" /> Nova oportunidade
          </Button>
        }
      />

      {!loadingEtapas && etapas.length === 0 ? (
        <EtapasEmpty funil="vendas" />
      ) : (
        <KanbanBoard
          columns={columns}
          items={pipeline}
          loading={isLoading || loadingEtapas}
          getId={(o) => String(o.id)}
          getColumnId={(o) => (o.etapa_id ? String(o.etapa_id) : null)}
          onMove={(id, columnId) => {
            const etapa = etapas.find((e) => String(e.id) === columnId);
            const values: Record<string, unknown> = { etapa_id: columnId };
            if (etapa?.tipo_final === "ganho") {
              values['resultado'] = "Ganho";
              values['data_fechamento'] = new Date().toISOString().slice(0, 10);
            } else if (etapa?.tipo_final === "perdido") {
              values['resultado'] = "Perdido";
              values['data_fechamento'] = new Date().toISOString().slice(0, 10);
            } else {
              values['resultado'] = null;
            }
            save.mutate({ table: "crm_oportunidades", id, values });
          }}
          renderCard={(o) => <VendaCard venda={o} onClick={() => setDetalhe(o)} />}
          emptyMessage="Nenhuma oportunidade nesta etapa"
        />
      )}

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
