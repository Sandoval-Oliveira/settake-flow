import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { EtapasEmpty } from "@/components/crm/EtapasEmpty";
import { KanbanBoard, type KanbanColumn } from "@/components/crm/Kanban";
import { LeadDialog } from "@/components/crm/LeadDialog";
import { ConverterLeadDialog } from "@/components/crm/ConverterLeadDialog";
import { InteracoesPanel } from "@/components/crm/InteracoesPanel";
import { TarefaDialog } from "@/components/crm/TarefaDialog";
import { CrmTable, type CrmColumn } from "@/components/crm/CrmTable";
import { ViewFade, ViewToggle } from "@/components/crm/ViewToggle";
import { OriginBadge, SoftBadge, WhatsAppButton } from "@/components/crm/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLeads } from "@/lib/crm-api";
import { useFunilLeads, useMoverCard } from "@/lib/crm-funis";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { Lead, PipelineLead } from "@/lib/crm-types";
import { formatDate, whatsappLink } from "@/lib/format";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Leads | SetTake CRM" },
      {
        name: "description",
        content: "Funil de leads do SetTake CRM com kanban, qualificação e conversão em cliente.",
      },
      { property: "og:title", content: "Leads | SetTake CRM" },
      { property: "og:description", content: "Gerencie a qualificação de leads em kanban." },
    ],
  }),
  component: LeadsPage,
});

function LeadCard({
  lead,
  onClick,
  onEdit,
  onDelete,
}: {
  lead: PipelineLead;
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
        <h3 className="text-sm font-semibold text-foreground">{lead.nome}</h3>
        <div className="flex shrink-0 items-center gap-1">
          <WhatsAppButton href={whatsappLink(lead.whatsapp)} />
          <RowActions floating onEdit={onEdit} onDelete={onDelete} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <OriginBadge origem={lead.origem} />
        {lead.segmento ? <SoftBadge>{lead.segmento}</SoftBadge> : null}
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
        {lead.dias_na_etapa != null ? <span>⏱ {lead.dias_na_etapa}d na etapa</span> : null}
        {lead.tarefas_pendentes ? <span>✅ {lead.tarefas_pendentes}</span> : null}
      </div>
    </article>
  );
}

function LeadsPage() {
  const { data, isLoading } = useFunilLeads();
  const etapas = data?.etapas ?? [];
  const { data: leadsRaw = [] } = useLeads();
  const mover = useMoverCard("leads", "Lead movido");

  const [view, setView] = useLocalStorage<"kanban" | "lista">("crm-leads-view", "kanban");
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Lead | null>(null);
  const [detalhe, setDetalhe] = useState<PipelineLead | null>(null);
  const [converter, setConverter] = useState<Lead | null>(null);
  const [tarefaOpen, setTarefaOpen] = useState(false);

  const termo = busca.trim().toLowerCase();
  const items = (data?.cards ?? []).filter(
    (l) =>
      !termo ||
      (l.nome ?? "").toLowerCase().includes(termo) ||
      (l.whatsapp ?? "").includes(termo) ||
      (l.email ?? "").toLowerCase().includes(termo),
  );

  const columns: KanbanColumn[] = etapas.map((e) => ({
    id: String(e.id),
    nome: e.nome,
    cor: e.cor,
    subtitle: undefined,
  }));

  const tableColumns = useMemo<CrmColumn<PipelineLead>[]>(
    () => [
      {
        id: "nome",
        header: "Nome",
        required: true,
        size: 200,
        cell: (l) => <span className="font-medium">{l.nome}</span>,
      },
      {
        id: "etapa",
        header: "Etapa",
        required: true,
        size: 150,
        cell: (l) => <SoftBadge color={l.etapa_cor}>{l.etapa_nome ?? "—"}</SoftBadge>,
      },
      { id: "segmento", header: "Segmento", size: 140, cell: (l) => l.segmento ?? "—" },
      { id: "origem", header: "Origem", size: 160, cell: (l) => l.origem ?? "—" },
      { id: "whatsapp", header: "WhatsApp", size: 150, cell: (l) => l.whatsapp ?? "—" },
      { id: "email", header: "Email", size: 200, cell: (l) => l.email ?? "—" },
      {
        id: "instagram",
        header: "Instagram",
        size: 150,
        defaultHidden: true,
        cell: (l) => l.instagram ?? "—",
      },
      {
        id: "quem_indicou",
        header: "Quem indicou",
        size: 160,
        defaultHidden: true,
        cell: (l) => l.quem_indicou ?? "—",
      },
      {
        id: "dias_no_funil",
        header: "Dias no funil",
        size: 120,
        cell: (l) => (l.dias_no_funil != null ? `${l.dias_no_funil}d` : "—"),
      },
      { id: "criado_em", header: "Criado em", size: 130, cell: (l) => formatDate(l.criado_em) },
      {
        id: "atualizado_em",
        header: "Atualizado em",
        size: 130,
        defaultHidden: true,
        cell: (l) => formatDate(l.atualizado_em),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Leads"
        subtitle={`${items.length} lead(s) em qualificação`}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar lead"
                className="w-56 pl-9"
              />
            </div>
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
              <Plus className="size-4" /> Novo lead
            </Button>
          </>
        }
      />

      {!isLoading && etapas.length === 0 ? (
        <EtapasEmpty funil="leads" />
      ) : view === "kanban" ? (
        <ViewFade>
          <KanbanBoard
            columns={columns}
            items={items}
            loading={isLoading}
            getId={(l) => String(l.id)}
            getColumnId={(l) => (l.etapa_id ? String(l.etapa_id) : null)}
            onMove={(id, columnId) =>
              mover.mutate({
                table: "crm_leads",
                id,
                values: { etapa_id: columnId, atualizado_em: new Date().toISOString() },
              })
            }
            renderCard={(l) => <LeadCard lead={l} onClick={() => setDetalhe(l)} />}
            emptyMessage="Nenhum lead nesta etapa"
          />
        </ViewFade>
      ) : (
        <ViewFade>
          <CrmTable
            storageKey="crm-leads"
            columns={tableColumns}
            rows={items}
            loading={isLoading}
            getRowId={(l) => String(l.id)}
            onRowClick={(l) => setDetalhe(l)}
            emptyMessage="Nenhum lead encontrado"
          />
        </ViewFade>
      )}

      <LeadDialog open={dialogOpen} onOpenChange={setDialogOpen} lead={editing} etapas={etapas} />
      <ConverterLeadDialog
        open={Boolean(converter)}
        onOpenChange={(v) => !v && setConverter(null)}
        lead={converter}
      />
      <TarefaDialog
        open={tarefaOpen}
        onOpenChange={setTarefaOpen}
        vinculo={{ lead_id: detalhe ? String(detalhe.id) : null }}
      />

      <Sheet open={Boolean(detalhe)} onOpenChange={(v) => !v && setDetalhe(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{detalhe?.nome}</SheetTitle>
          </SheetHeader>
          {detalhe ? (
            <div className="space-y-5 px-4 pb-8">
              <div className="flex flex-wrap gap-2">
                <OriginBadge origem={detalhe.origem} />
                {detalhe.segmento ? <SoftBadge>{detalhe.segmento}</SoftBadge> : null}
                {detalhe.etapa_nome ? (
                  <SoftBadge color={detalhe.etapa_cor}>{detalhe.etapa_nome}</SoftBadge>
                ) : null}
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted-foreground">WhatsApp</dt>
                  <dd className="text-foreground">{detalhe.whatsapp ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">E-mail</dt>
                  <dd className="truncate text-foreground">{detalhe.email ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Instagram</dt>
                  <dd className="text-foreground">{detalhe.instagram ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Criado em</dt>
                  <dd className="text-foreground">{formatDate(detalhe.criado_em)}</dd>
                </div>
                {detalhe.quem_indicou ? (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Quem indicou</dt>
                    <dd className="text-foreground">{detalhe.quem_indicou}</dd>
                  </div>
                ) : null}
                {detalhe.observacoes ? (
                  <div className="col-span-2">
                    <dt className="text-muted-foreground">Observações</dt>
                    <dd className="whitespace-pre-wrap text-foreground">{detalhe.observacoes}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setEditing(leadsRaw.find((l) => String(l.id) === String(detalhe.id)) ?? null);
                    setDialogOpen(true);
                  }}
                >
                  Editar
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setTarefaOpen(true)}>
                  Nova tarefa
                </Button>
                <Button
                  size="sm"
                  className="brand-gradient font-semibold text-brand-foreground"
                  onClick={() => {
                    const full = leadsRaw.find((l) => String(l.id) === String(detalhe.id));
                    if (full) setConverter(full);
                  }}
                >
                  Converter em cliente
                </Button>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Interações</h3>
                <InteracoesPanel target={{ lead_id: String(detalhe.id) }} />
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
