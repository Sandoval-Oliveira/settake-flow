import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { LayoutGrid, List, Plus, Search } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { ContatoDialog } from "@/components/crm/ContatoDialog";
import { OportunidadeDialog } from "@/components/crm/OportunidadeDialog";
import { TarefaDialog } from "@/components/crm/TarefaDialog";
import { InteracoesPanel } from "@/components/crm/InteracoesPanel";
import { CrmTable, type CrmColumn } from "@/components/crm/CrmTable";
import { ViewFade, ViewToggle } from "@/components/crm/ViewToggle";
import { RankingReceita } from "@/components/crm/RankingReceita";
import {
  EmptyState,
  OriginBadge,
  SelectField,
  SoftBadge,
  WhatsAppButton,
} from "@/components/crm/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useEtapas, useLtv, useOportunidades, usePessoas } from "@/lib/crm-api";
import { useContatosLista } from "@/lib/crm-funis";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { AREAS_ATUACAO, ORIGENS, SEGMENTOS, type Pessoa } from "@/lib/crm-types";
import { formatDate, formatDayMonth, formatMoney, initials, whatsappLink } from "@/lib/format";


export const Route = createFileRoute("/contatos")({
  head: () => ({
    meta: [
      { title: "Contatos | SetTake CRM" },
      {
        name: "description",
        content:
          "Base de contatos do SetTake CRM: clientes e fornecedores com LTV, histórico e oportunidades.",
      },
      { property: "og:title", content: "Contatos | SetTake CRM" },
      { property: "og:description", content: "Clientes e fornecedores com histórico completo." },
    ],
  }),
  component: ContatosPage,
});

function DetalheContato({ pessoa, onNovaOportunidade, onNovaTarefa, onEditar }: {
  pessoa: Pessoa;
  onNovaOportunidade: () => void;
  onNovaTarefa: () => void;
  onEditar: () => void;
}) {
  const { data: ltv } = useLtv(String(pessoa.id));
  const { data: oportunidades = [] } = useOportunidades(String(pessoa.id));

  return (
    <div className="space-y-5 px-4 pb-8">
      <div className="flex flex-wrap gap-2">
        {pessoa.tipo ? <SoftBadge>{pessoa.tipo}</SoftBadge> : null}
        {pessoa.segmento ? <SoftBadge>{pessoa.segmento}</SoftBadge> : null}
        {pessoa.area_atuacao ? <SoftBadge>{pessoa.area_atuacao}</SoftBadge> : null}
        <OriginBadge origem={pessoa.origem} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <p className="text-[11px] text-muted-foreground">LTV</p>
          <p className="text-sm font-bold text-brand">{formatMoney(ltv?.ltv_total)}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <p className="text-[11px] text-muted-foreground">Transações</p>
          <p className="text-sm font-bold text-foreground">{ltv?.total_transacoes ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-surface/50 p-3">
          <p className="text-[11px] text-muted-foreground">Ticket médio</p>
          <p className="text-sm font-bold text-foreground">{formatMoney(ltv?.ticket_medio)}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted-foreground">WhatsApp</dt>
          <dd className="text-foreground">{pessoa.whatsapp ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">E-mail</dt>
          <dd className="truncate text-foreground">{pessoa.email ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Instagram</dt>
          <dd className="text-foreground">{pessoa.instagram ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Aniversário</dt>
          <dd className="text-foreground">{formatDayMonth(pessoa.aniversario)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">CPF / CNPJ</dt>
          <dd className="text-foreground">{pessoa.cpf_cnpj ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Última transação</dt>
          <dd className="text-foreground">{formatDate(ltv?.ultima_transacao)}</dd>
        </div>
        {pessoa.endereco ? (
          <div className="col-span-2">
            <dt className="text-muted-foreground">Endereço</dt>
            <dd className="text-foreground">{pessoa.endereco}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onEditar}>
          Editar
        </Button>
        <Button size="sm" variant="secondary" onClick={onNovaTarefa}>
          Nova tarefa
        </Button>
        <Button
          size="sm"
          className="brand-gradient font-semibold text-brand-foreground"
          onClick={onNovaOportunidade}
        >
          Nova oportunidade
        </Button>
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Oportunidades</h3>
        {oportunidades.length === 0 ? (
          <EmptyState icon="💼" message="Nenhuma oportunidade registrada" />
        ) : (
          <ul className="space-y-2">
            {oportunidades.map((o) => (
              <li
                key={String(o.id)}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface/50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-foreground">{o.nome}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {o.resultado ?? "Em aberto"} · {formatDate(o.data_fechamento ?? o.criado_em)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-brand">{formatMoney(o.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border pt-4">
        <h3 className="mb-3 text-sm font-semibold text-foreground">Interações</h3>
        <InteracoesPanel target={{ pessoa_id: String(pessoa.id) }} />
      </div>
    </div>
  );
}

function ContatosPage() {
  const { data: pessoas = [], isLoading } = usePessoas();
  const { data: contatos = [], isLoading: loadingLista } = useContatosLista();
  const { data: etapasNutricao = [] } = useEtapas("nutricao");
  const { data: etapasVendas = [] } = useEtapas("vendas");

  const [aba, setAba] = useLocalStorage<"contatos" | "ranking">("crm-contatos-aba", "contatos");
  const [view, setView] = useLocalStorage<"lista" | "cards">("crm-contatos-view", "lista");
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<"Todos" | "Cliente" | "Fornecedor">("Todos");
  const [segmento, setSegmento] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [origem, setOrigem] = useState<string | null>(null);
  const [detalhe, setDetalhe] = useState<Pessoa | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Pessoa | null>(null);
  const [oppOpen, setOppOpen] = useState(false);
  const [tarefaOpen, setTarefaOpen] = useState(false);

  const termo = busca.trim().toLowerCase();

  function abrirPessoa(id: string) {
    const pessoa = pessoas.find((p) => String(p.id) === String(id));
    if (pessoa) setDetalhe(pessoa);
  }

  const filtrar = <T extends { nome: string | null; whatsapp: string | null; email: string | null; tipo: string | null; segmento: string | null; area_atuacao: string | null; origem: string | null }>(
    rows: T[],
  ) =>
    rows.filter(
      (p) =>
        (tipo === "Todos" || p.tipo === tipo) &&
        (!segmento || p.segmento === segmento) &&
        (!area || p.area_atuacao === area) &&
        (!origem || p.origem === origem) &&
        (!termo ||
          (p.nome ?? "").toLowerCase().includes(termo) ||
          (p.whatsapp ?? "").includes(termo) ||
          (p.email ?? "").toLowerCase().includes(termo)),
    );

  const lista = filtrar(contatos);
  const cards = filtrar(pessoas as unknown as (typeof contatos)[number][]);

  const tableColumns = useMemo<CrmColumn<(typeof contatos)[number]>[]>(
    () => [
      {
        id: "nome",
        header: "Nome",
        required: true,
        size: 200,
        cell: (p) => <span className="font-medium">{p.nome}</span>,
      },
      { id: "tipo", header: "Tipo", size: 110, cell: (p) => p.tipo ?? "—" },
      { id: "whatsapp", header: "WhatsApp", size: 150, cell: (p) => p.whatsapp ?? "—" },
      { id: "email", header: "Email", size: 200, cell: (p) => p.email ?? "—" },
      { id: "segmento", header: "Segmento", size: 140, cell: (p) => p.segmento ?? "—" },
      {
        id: "area_atuacao",
        header: "Área de atuação",
        size: 160,
        cell: (p) => p.area_atuacao ?? "—",
      },
      { id: "origem", header: "Origem", size: 150, cell: (p) => p.origem ?? "—" },
      {
        id: "instagram",
        header: "Instagram",
        size: 140,
        defaultHidden: true,
        cell: (p) => p.instagram ?? "—",
      },
      {
        id: "quem_indicou",
        header: "Quem indicou",
        size: 160,
        defaultHidden: true,
        cell: (p) => p.quem_indicou ?? "—",
      },
      {
        id: "etapa_nutricao",
        header: "Etapa nutrição",
        size: 160,
        cell: (p) =>
          p.etapa_nutricao_nome ? (
            <SoftBadge color={p.etapa_nutricao_cor}>{p.etapa_nutricao_nome}</SoftBadge>
          ) : (
            "—"
          ),
      },
      {
        id: "ltv",
        header: "LTV (R$)",
        size: 140,
        cell: (p) => <span className="font-semibold text-brand">{formatMoney(p.ltv)}</span>,
      },
      {
        id: "aniversario",
        header: "Aniversário",
        size: 120,
        defaultHidden: true,
        cell: (p) => (p.aniversario ? formatDayMonth(p.aniversario) : "—"),
      },
      {
        id: "criado_em",
        header: "Criado em",
        size: 130,
        defaultHidden: true,
        cell: (p) => formatDate(p.criado_em),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title="Contatos"
        subtitle={aba === "ranking" ? "Ranking de clientes por receita" : `${lista.length} contato(s)`}
        actions={
          <>
            <ViewToggle
              value={aba}
              onChange={setAba}
              options={[
                { value: "contatos", label: "Contatos" },
                { value: "ranking", label: "Ranking" },
              ]}
            />
            {aba === "contatos" ? (
              <>
                <ViewToggle
                  value={view}
                  onChange={setView}
                  options={[
                    { value: "lista", label: "Lista", icon: List },
                    { value: "cards", label: "Cards", icon: LayoutGrid },
                  ]}
                />
                <div className="flex rounded-lg border border-border bg-card p-1">
                  {(["Todos", "Cliente", "Fornecedor"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                        tipo === t
                          ? "brand-gradient text-brand-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="w-40">
                  <SelectField
                    value={segmento}
                    onChange={setSegmento}
                    options={SEGMENTOS.map((s) => ({ value: s, label: s }))}
                    placeholder="Segmento"
                  />
                </div>
                <div className="w-40">
                  <SelectField
                    value={area}
                    onChange={setArea}
                    options={AREAS_ATUACAO.map((s) => ({ value: s, label: s }))}
                    placeholder="Área"
                  />
                </div>
                <div className="w-40">
                  <SelectField
                    value={origem}
                    onChange={setOrigem}
                    options={ORIGENS.map((s) => ({ value: s, label: s }))}
                    placeholder="Origem"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar contato"
                    className="w-56 pl-9"
                  />
                </div>
              </>
            ) : null}
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="brand-gradient font-semibold text-brand-foreground"
            >
              <Plus className="size-4" /> Novo contato
            </Button>
          </>
        }
      />

      {aba === "ranking" ? (
        <ViewFade>
          <RankingReceita onSelect={abrirPessoa} />
        </ViewFade>
      ) : view === "lista" ? (
        <ViewFade>
          <CrmTable
            storageKey="crm-contatos"
            columns={tableColumns}
            rows={lista}
            loading={loadingLista}
            getRowId={(p) => String(p.id)}
            onRowClick={(p) => abrirPessoa(String(p.id))}
            emptyMessage="Nenhum contato encontrado"
          />
        </ViewFade>
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState icon="👤" message="Nenhum contato encontrado" />
      ) : (
        <ViewFade>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {cards.map((p) => (
              <article
                key={String(p.id)}
                onClick={() => abrirPessoa(String(p.id))}
                className="kanban-card kanban-card-hover cursor-pointer rounded-xl border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="brand-gradient flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold text-brand-foreground">
                    {initials(p.nome)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-foreground">{p.nome}</h3>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {p.segmento ?? p.tipo ?? "—"}
                    </p>
                  </div>
                  <WhatsAppButton href={whatsappLink(p.whatsapp)} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.tipo ? <SoftBadge>{p.tipo}</SoftBadge> : null}
                  {p.area_atuacao ? <SoftBadge>{p.area_atuacao}</SoftBadge> : null}
                </div>
              </article>
            ))}
          </div>
        </ViewFade>
      )}


      <ContatoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pessoa={editing}
        etapasNutricao={etapasNutricao}
      />
      <OportunidadeDialog
        open={oppOpen}
        onOpenChange={setOppOpen}
        etapas={etapasVendas}
        pessoaId={detalhe ? String(detalhe.id) : null}
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
            <DetalheContato
              pessoa={detalhe}
              onEditar={() => {
                setEditing(detalhe);
                setDialogOpen(true);
              }}
              onNovaOportunidade={() => setOppOpen(true)}
              onNovaTarefa={() => setTarefaOpen(true)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
