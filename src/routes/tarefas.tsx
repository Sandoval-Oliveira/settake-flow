import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarDays, List, Plus } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { TarefaDialog } from "@/components/crm/TarefaDialog";
import { TarefasCalendario } from "@/components/crm/TarefasCalendario";
import { ViewFade, ViewToggle } from "@/components/crm/ViewToggle";
import { EmptyState, Panel, PriorityBadge } from "@/components/crm/primitives";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useDeleteRecord, useSaveRecord, useTarefas } from "@/lib/crm-api";
import { PRIORIDADES, type Tarefa } from "@/lib/crm-types";
import { formatDateTime, toDate } from "@/lib/format";


export const Route = createFileRoute("/tarefas")({
  head: () => ({
    meta: [
      { title: "Tarefas | SetTake CRM" },
      {
        name: "description",
        content:
          "Tarefas do SetTake CRM organizadas por prazo e prioridade, vinculadas a leads, clientes e oportunidades.",
      },
      { property: "og:title", content: "Tarefas | SetTake CRM" },
      { property: "og:description", content: "Organize follow-ups por prazo e prioridade." },
    ],
  }),
  component: TarefasPage,
});

type Filtro = "Pendentes" | "Hoje" | "Atrasadas" | "Concluídas" | "Todas";

function isAtrasada(t: Tarefa) {
  const d = toDate(t.prazo);
  return Boolean(d && d.getTime() < Date.now() && t.status !== "Concluída");
}

function isHoje(t: Tarefa) {
  const d = toDate(t.prazo);
  if (!d) return false;
  const hoje = new Date();
  return d.toDateString() === hoje.toDateString();
}

function TarefasPage() {
  const { data: tarefas = [], isLoading } = useTarefas();
  const save = useSaveRecord("Tarefa atualizada");
  const remove = useDeleteRecord("Tarefa excluída");

  const [filtro, setFiltro] = useState<Filtro>("Pendentes");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tarefa | null>(null);

  const filtrada = tarefas.filter((t) => {
    if (filtro === "Todas") return true;
    if (filtro === "Concluídas") return t.status === "Concluída";
    if (filtro === "Atrasadas") return isAtrasada(t);
    if (filtro === "Hoje") return isHoje(t) && t.status !== "Concluída";
    return t.status !== "Concluída" && t.status !== "Cancelada";
  });

  const porPrioridade = [...filtrada].sort(
    (a, b) =>
      PRIORIDADES.indexOf((b.prioridade ?? "Baixa") as never) -
        PRIORIDADES.indexOf((a.prioridade ?? "Baixa") as never) ||
      (toDate(a.prazo)?.getTime() ?? Infinity) - (toDate(b.prazo)?.getTime() ?? Infinity),
  );

  function toggle(t: Tarefa) {
    const concluir = t.status !== "Concluída";
    save.mutate({
      table: "crm_tarefas",
      id: String(t.id),
      values: {
        status: concluir ? "Concluída" : "Pendente",
        concluida_em: concluir ? new Date().toISOString() : null,
      },
    });
  }

  return (
    <>
      <PageHeader
        title="Tarefas"
        subtitle={`${filtrada.length} tarefa(s) em "${filtro}"`}
        actions={
          <>
            <div className="flex flex-wrap rounded-lg border border-border bg-card p-1">
              {(["Pendentes", "Hoje", "Atrasadas", "Concluídas", "Todas"] as Filtro[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    filtro === f
                      ? "brand-gradient text-brand-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
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

      <Panel title="Lista de tarefas">
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : porPrioridade.length === 0 ? (
          <EmptyState icon="✅" message="Nenhuma tarefa neste filtro" />
        ) : (
          <ul className="space-y-2">
            {porPrioridade.map((t) => (
              <li
                key={String(t.id)}
                className="flex items-start gap-3 rounded-lg border border-border bg-surface/50 p-3"
              >
                <Checkbox
                  checked={t.status === "Concluída"}
                  onCheckedChange={() => toggle(t)}
                  className="mt-0.5"
                  aria-label="Concluir tarefa"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`text-sm font-medium ${
                      t.status === "Concluída"
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    }`}
                  >
                    {t.titulo}
                  </p>
                  {t.descricao ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.descricao}</p>
                  ) : null}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {isAtrasada(t) ? "⚠️ Atrasada · " : ""}
                    {t.prazo ? formatDateTime(t.prazo) : "Sem prazo"} · {t.status ?? "Pendente"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PriorityBadge prioridade={t.prioridade} />
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
                    onClick={() => remove.mutate({ table: "crm_tarefas", id: String(t.id) })}
                  >
                    Excluir
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <TarefaDialog open={dialogOpen} onOpenChange={setDialogOpen} tarefa={editing} />
    </>
  );
}
