import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/crm/PageHeader";
import { EtapasEmpty } from "@/components/crm/EtapasEmpty";
import { KanbanBoard, type KanbanColumn } from "@/components/crm/Kanban";
import { TarefaDialog } from "@/components/crm/TarefaDialog";
import { InteracoesPanel } from "@/components/crm/InteracoesPanel";
import { OriginBadge, SoftBadge, WhatsAppButton } from "@/components/crm/primitives";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEtapas, usePipelineNutricao, useSaveRecord } from "@/lib/crm-api";
import type { PipelineNutricao } from "@/lib/crm-types";
import { formatDate, formatMoney, whatsappLink } from "@/lib/format";

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

function NutricaoCard({ item, onClick }: { item: PipelineNutricao; onClick: () => void }) {
  const frio = (item.dias_ultima_interacao ?? 0) > 30;
  return (
    <article
      onClick={onClick}
      className="kanban-card kanban-card-hover cursor-pointer rounded-xl border border-border p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground">{item.nome}</h3>
        <WhatsAppButton href={whatsappLink(item.whatsapp)} />
      </div>
      <p className="mt-1 text-sm font-bold text-brand">{formatMoney(item.ltv_total)}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {item.segmento ? <SoftBadge>{item.segmento}</SoftBadge> : null}
        {item.area_atuacao ? <SoftBadge>{item.area_atuacao}</SoftBadge> : null}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        <span className={frio ? "text-danger" : undefined}>
          {item.dias_ultima_interacao != null
            ? `💬 ${item.dias_ultima_interacao}d sem contato`
            : "💬 sem interações"}
        </span>
        {item.tarefas_pendentes ? <span>✅ {item.tarefas_pendentes}</span> : null}
      </div>
    </article>
  );
}

function NutricaoPage() {
  const { data: etapas = [], isLoading: loadingEtapas } = useEtapas("nutricao");
  const { data: pipeline = [], isLoading } = usePipelineNutricao();
  const save = useSaveRecord("Cliente movido");

  const [detalhe, setDetalhe] = useState<PipelineNutricao | null>(null);
  const [tarefaOpen, setTarefaOpen] = useState(false);

  const ltvTotal = pipeline.reduce((s, p) => s + Number(p.ltv_total ?? 0), 0);

  const columns: KanbanColumn[] = etapas.map((e) => {
    const soma = pipeline
      .filter((p) => String(p.etapa_nutricao_id) === String(e.id))
      .reduce((s, p) => s + Number(p.ltv_total ?? 0), 0);
    return {
      id: String(e.id),
      nome: e.nome,
      cor: e.cor,
      subtitle: soma ? formatMoney(soma) : undefined,
    };
  });

  return (
    <>
      <PageHeader
        title="Nutrição"
        subtitle={`${pipeline.length} cliente(s) · LTV total ${formatMoney(ltvTotal)}`}
      />

      {!loadingEtapas && etapas.length === 0 ? (
        <EtapasEmpty funil="nutricao" />
      ) : (
        <KanbanBoard
          columns={columns}
          items={pipeline}
          loading={isLoading || loadingEtapas}
          getId={(p) => String(p.id)}
          getColumnId={(p) => (p.etapa_nutricao_id ? String(p.etapa_nutricao_id) : null)}
          onMove={(id, columnId) =>
            save.mutate({ table: "pessoas", id, values: { etapa_nutricao_id: columnId } })
          }
          renderCard={(p) => <NutricaoCard item={p} onClick={() => setDetalhe(p)} />}
          emptyMessage="Nenhum cliente nesta etapa"
        />
      )}

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
