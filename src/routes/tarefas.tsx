import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertCircle, CalendarDays, List, Plus } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { TarefaDialog } from "@/components/crm/TarefaDialog";
import { TarefasCalendario } from "@/components/crm/TarefasCalendario";
import { TarefaDrawer, type VinculoInfo } from "@/components/crm/TarefaDrawer";
import { ConcluirTarefaDialog } from "@/components/crm/ConcluirTarefaDialog";
import { ViewFade, ViewToggle } from "@/components/crm/ViewToggle";
import { ConfirmDeleteDialog } from "@/components/crm/ConfirmDeleteDialog";
import { EmptyState, Panel, PriorityBadge } from "@/components/crm/primitives";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalStorage } from "@/hooks/use-local-storage";
import {
  useDeleteRecord,
  useLeads,
  useOportunidades,
  usePessoas,
  useTarefas,
} from "@/lib/crm-api";
import { useReabrirTarefa } from "@/lib/crm-tarefas";
import { PRIORIDADES, type Prioridade, type Tarefa } from "@/lib/crm-types";
import { formatDateTime, toDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tarefas")({
  head: () => ({
    meta: [
      { title: "Tarefas | SetTake CRM" },
      {
        name: "description",
        content:
          "Tarefas do SetTake CRM organizadas por prazo, prioridade e vínculo com leads, clientes e oportunidades.",
      },
      { property: "og:title", content: "Tarefas | SetTake CRM" },
      { property: "og:description", content: "Organize follow-ups por prazo e prioridade." },
    ],
  }),
  component: TarefasPage,
});

type Filtro = "Pendentes" | "Hoje" | "Atrasadas" | "Concluídas" | "Todas";
type Vinculo = "Lead" | "Contato" | "Oportunidade";

const VINCULO_EMPTY: VinculoInfo = {
  nome: null,
  tipo: null,
  whatsapp: null,
  segmento: null,
  origem: null,
  oportunidadeNome: null,
  oportunidadeValor: null,
};

function isAtrasada(t: Tarefa) {
  const d = toDate(t.prazo);
  return Boolean(d && d.getTime() < Date.now() && t.status !== "Concluída");
}

function isHoje(t: Tarefa) {
  const d = toDate(t.prazo);
  if (!d) return false;
  return d.toDateString() === new Date().toDateString();
}

function TarefasPage() {
  const { data: tarefas = [], isLoading } = useTarefas();
  const { data: leads = [] } = useLeads();
  const { data: pessoas = [] } = usePessoas();
  const { data: oportunidades = [] } = useOportunidades();
  const remove = useDeleteRecord("Tarefa excluída");
  const reabrir = useReabrirTarefa();

  const [view, setView] = useLocalStorage<"lista" | "calendario">("crm-tarefas-view", "lista");
  const [filtro, setFiltro] = useState<Filtro>("Pendentes");
  const [prioridades, setPrioridades] = useState<Prioridade[]>([]);
  const [vinculos, setVinculos] = useState<Vinculo[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tarefa | null>(null);
  const [detalhe, setDetalhe] = useState<Tarefa | null>(null);
  const [aConcluir, setAConcluir] = useState<Tarefa | null>(null);
  const [aExcluir, setAExcluir] = useState<Tarefa | null>(null);

  const vinculoDe = useMemo(() => {
    const leadMap = new Map(leads.map((l) => [String(l.id), l]));
    const pessoaMap = new Map(pessoas.map((p) => [String(p.id), p]));
    const opMap = new Map(oportunidades.map((o) => [String(o.id), o]));
    return (t: Tarefa | null): VinculoInfo => {
      if (!t) return VINCULO_EMPTY;
      const op = t.oportunidade_id ? opMap.get(String(t.oportunidade_id)) : undefined;
      const lead = t.lead_id ? leadMap.get(String(t.lead_id)) : undefined;
      const pessoa = t.pessoa_id
        ? pessoaMap.get(String(t.pessoa_id))
        : op?.pessoa_id
          ? pessoaMap.get(String(op.pessoa_id))
          : undefined;
      const base = lead ?? pessoa;
      return {
        nome: base?.nome ?? null,
        tipo: lead ? "Lead" : pessoa ? "Contato" : op ? "Oportunidade" : null,
        whatsapp: (base as { whatsapp?: string | null } | undefined)?.whatsapp ?? null,
        segmento: (base as { segmento?: string | null } | undefined)?.segmento ?? null,
        origem: (base as { origem?: string | null } | undefined)?.origem ?? null,
        oportunidadeNome: op?.titulo ?? null,
        oportunidadeValor: op?.valor ?? null,
      };
    };
  }, [leads, pessoas, oportunidades]);

  function tipoVinculo(t: Tarefa): Vinculo | null {
    if (t.oportunidade_id) return "Oportunidade";
    if (t.lead_id) return "Lead";
    if (t.pessoa_id) return "Contato";
    return null;
  }

  const filtrada = tarefas.filter((t) => {
    const porStatus =
      filtro === "Todas"
        ? true
        : filtro === "Concluídas"
          ? t.status === "Concluída"
          : filtro === "Atrasadas"
            ? isAtrasada(t)
            : filtro === "Hoje"
              ? isHoje(t) && t.status !== "Concluída"
              : t.status !== "Concluída" && t.status !== "Cancelada";
    if (!porStatus) return false;
    if (prioridades.length && !prioridades.includes((t.prioridade ?? "Baixa") as Prioridade))
      return false;
    if (vinculos.length) {
      const tipo = tipoVinculo(t);
      if (!tipo || !vinculos.includes(tipo)) return false;
    }
    return true;
  });

  const porPrioridade = [...filtrada].sort(
    (a, b) =>
      PRIORIDADES.indexOf((b.prioridade ?? "Baixa") as never) -
        PRIORIDADES.indexOf((a.prioridade ?? "Baixa") as never) ||
      (toDate(a.prazo)?.getTime() ?? Infinity) - (toDate(b.prazo)?.getTime() ?? Infinity),
  );

  function toggleChip<T>(list: T[], value: T, set: (next: T[]) => void) {
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  return (
    <>
      <PageHeader
        title="Tarefas"
        subtitle={`${filtrada.length} tarefa(s) em "${filtro}"`}
        actions={
          <>
            <ViewToggle
              value={view}
              onChange={setView}
              options={[
                { value: "lista", label: "Lista", icon: List },
                { value: "calendario", label: "Calendário", icon: CalendarDays },
              ]}
            />
            <div className="flex flex-wrap rounded-lg border border-border bg-card p-1">
              {(["Pendentes", "Hoje", "Atrasadas", "Concluídas", "Todas"] as Filtro[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    filtro === f
                      ? "brand-gradient text-brand-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="brand-gradient font-semibold text-brand-foreground"
            >
              <Plus className="size-4" /> Nova tarefa
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Prioridade
          </span>
          {(["Urgente", "Alta", "Média", "Baixa"] as Prioridade[]).map((p) => (
            <button
              key={p}
              onClick={() => toggleChip(prioridades, p, setPrioridades)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                prioridades.includes(p)
                  ? "border-brand bg-brand/10 font-semibold text-brand"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Vínculo
          </span>
          {(["Lead", "Contato", "Oportunidade"] as Vinculo[]).map((v) => (
            <button
              key={v}
              onClick={() => toggleChip(vinculos, v, setVinculos)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                vinculos.includes(v)
                  ? "border-brand bg-brand/10 font-semibold text-brand"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        {prioridades.length || vinculos.length ? (
          <button
            onClick={() => {
              setPrioridades([]);
              setVinculos([]);
            }}
            className="text-xs text-muted-foreground underline hover:text-foreground"
          >
            Limpar filtros
          </button>
        ) : null}
      </div>

      {view === "calendario" ? (
        <ViewFade>
          <TarefasCalendario tarefas={filtrada} onSelect={(t) => setDetalhe(t)} />
        </ViewFade>
      ) : (
        <Panel title="Lista de tarefas">
          {isLoading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-11 w-full rounded-lg" />
              ))}
            </div>
          ) : porPrioridade.length === 0 ? (
            <EmptyState icon="✅" message="Nenhuma tarefa neste filtro" />
          ) : (
            <ul className="divide-y divide-border/60">
              {porPrioridade.map((t) => {
                const v = vinculoDe(t);
                const concluida = t.status === "Concluída";
                const atrasada = isAtrasada(t);
                return (
                  <li
                    key={String(t.id)}
                    onClick={() => setDetalhe(t)}
                    className="flex cursor-pointer items-center gap-3 px-1 py-2.5 transition-colors hover:bg-secondary/60"
                  >
                    <span onClick={(e) => e.stopPropagation()} className="flex items-center">
                      <Checkbox
                        checked={concluida}
                        onCheckedChange={() =>
                          concluida ? reabrir.mutate(t) : setAConcluir(t)
                        }
                        aria-label="Concluir tarefa"
                      />
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate text-sm",
                        concluida ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {t.titulo}
                    </span>
                    <span className="hidden w-40 shrink-0 truncate text-xs text-muted-foreground sm:block">
                      {v.nome ? `${v.nome}${v.tipo ? ` · ${v.tipo}` : ""}` : "—"}
                    </span>
                    <span
                      className={cn(
                        "hidden w-36 shrink-0 items-center gap-1 text-xs md:flex",
                        atrasada ? "text-danger" : "text-muted-foreground",
                      )}
                    >
                      {atrasada ? <AlertCircle className="size-3" /> : null}
                      {t.prazo ? formatDateTime(t.prazo) : "Sem prazo"}
                    </span>
                    <PriorityBadge prioridade={t.prioridade} />
                    <span onClick={(e) => e.stopPropagation()} className="flex shrink-0 gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditing(t);
                          setDialogOpen(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-danger hover:text-danger"
                        onClick={() => setAExcluir(t)}
                      >
                        Excluir
                      </Button>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      <TarefaDrawer
        tarefa={detalhe}
        vinculo={vinculoDe(detalhe)}
        atrasada={detalhe ? isAtrasada(detalhe) : false}
        onOpenChange={(o) => !o && setDetalhe(null)}
        onEditar={() => {
          setEditing(detalhe);
          setDetalhe(null);
          setDialogOpen(true);
        }}
        onConcluir={() => setAConcluir(detalhe)}
      />

      <ConcluirTarefaDialog
        tarefa={aConcluir}
        vinculoNome={vinculoDe(aConcluir).nome}
        onOpenChange={(o) => !o && setAConcluir(null)}
        onConcluida={() => setDetalhe(null)}
      />

      <ConfirmDeleteDialog
        open={Boolean(aExcluir)}
        onOpenChange={(o) => !o && setAExcluir(null)}
        title="Excluir tarefa?"
        description={`A tarefa "${aExcluir?.titulo ?? ""}" será removida permanentemente.`}
        loading={remove.isPending}
        onConfirm={() => {
          if (aExcluir) remove.mutate({ table: "crm_tarefas", id: String(aExcluir.id) });
          setAExcluir(null);
        }}
      />

      <TarefaDialog open={dialogOpen} onOpenChange={setDialogOpen} tarefa={editing} />
    </>
  );
}
