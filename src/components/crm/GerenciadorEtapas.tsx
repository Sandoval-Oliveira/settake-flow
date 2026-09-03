import { useEffect, useState } from "react";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { cn } from "@/lib/utils";
import type { Etapa, Funil } from "@/lib/crm-types";
import {
  useAtualizarEtapa,
  useCriarEtapa,
  useEtapasFunil,
  useExcluirEtapa,
  useReordenarEtapas,
} from "@/lib/crm-config";

type TipoFinal = Etapa["tipo_final"];

const TIPOS: { value: string; label: string }[] = [
  { value: "__none", label: "— (nenhum)" },
  { value: "ganho", label: "ganho" },
  { value: "perdido", label: "perdido" },
  { value: "desqualificado", label: "desqualificado" },
];

function TipoFinalBadge({ tipo }: { tipo: TipoFinal }) {
  if (!tipo) return <span className="text-xs text-muted-foreground">—</span>;
  const map: Record<string, string> = {
    ganho: "bg-success/20 text-success",
    qualificado: "bg-success/20 text-success",
    perdido: "bg-danger/20 text-danger",
    desqualificado: "bg-muted-foreground/20 text-muted-foreground",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", map[tipo])}>
      {tipo}
    </span>
  );
}

function TipoFinalSelect({
  value,
  onChange,
}: {
  value: TipoFinal;
  onChange: (v: TipoFinal) => void;
}) {
  return (
    <Select
      value={value ?? "__none"}
      onValueChange={(v) => onChange(v === "__none" ? null : (v as TipoFinal))}
    >
      <SelectTrigger className="w-[170px] bg-background">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIPOS.map((t) => (
          <SelectItem key={t.value} value={t.value}>
            {t.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ColorDot({ value, onChange }: { value: string; onChange?: (v: string) => void }) {
  if (!onChange) {
    return (
      <span
        className="size-5 shrink-0 rounded-full border border-border"
        style={{ backgroundColor: value }}
        aria-hidden
      />
    );
  }
  return (
    <label className="relative size-5 shrink-0 cursor-pointer">
      <span
        className="block size-5 rounded-full border border-border"
        style={{ backgroundColor: value }}
      />
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Cor da etapa"
        className="absolute inset-0 size-5 cursor-pointer opacity-0"
      />
    </label>
  );
}

export function GerenciadorEtapas({
  funil,
  titulo,
  descricao,
}: {
  funil: Funil;
  titulo: string;
  descricao: string;
}) {
  const { data, isLoading } = useEtapasFunil(funil);
  const criar = useCriarEtapa(funil);
  const atualizar = useAtualizarEtapa(funil);
  const excluir = useExcluirEtapa(funil);
  const reordenar = useReordenarEtapas(funil);

  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [adicionando, setAdicionando] = useState(false);
  const [novo, setNovo] = useState<{ nome: string; cor: string; tipo_final: TipoFinal }>({
    nome: "",
    cor: "#6B7280",
    tipo_final: null,
  });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [aExcluir, setAExcluir] = useState<Etapa | null>(null);

  useEffect(() => {
    if (data) setEtapas(data);
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = etapas.findIndex((e) => e.id === active.id);
    const to = etapas.findIndex((e) => e.id === over.id);
    const next = arrayMove(etapas, from, to);
    setEtapas(next);
    reordenar.mutate(next.map((e) => e.id));
  }

  function salvarNova() {
    const nome = novo.nome.trim();
    if (!nome) return;
    const ordem = Math.max(0, ...etapas.map((e) => e.ordem)) + 1;
    criar.mutate({ nome, cor: novo.cor, tipo_final: novo.tipo_final, ordem });
    setNovo({ nome: "", cor: "#6B7280", tipo_final: null });
    setAdicionando(false);
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
        </div>
        <Button
          onClick={() => setAdicionando(true)}
          className="brand-gradient text-brand-foreground"
        >
          <Plus className="size-4" /> Adicionar etapa
        </Button>
      </header>

      {isLoading ? (
        <p className="px-6 py-8 text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={etapas.map((e) => e.id)} strategy={verticalListSortingStrategy}>
            {etapas.map((etapa) => (
              <LinhaEtapa
                key={etapa.id}
                etapa={etapa}
                funil={funil}
                editando={editandoId === etapa.id}
                onEditar={() => setEditandoId(etapa.id)}
                onCancelar={() => setEditandoId(null)}
                onSalvar={(patch) => {
                  atualizar.mutate({ id: etapa.id, ...patch });
                  setEditandoId(null);
                }}
                onProbabilidade={(valor) =>
                  atualizar.mutate({ id: etapa.id, probabilidade_fechamento: valor })
                }
                onExcluir={() => setAExcluir(etapa)}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      {adicionando ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border px-6 py-3">
          <Input
            autoFocus
            value={novo.nome}
            placeholder="Nome da etapa..."
            onChange={(e) => setNovo((n) => ({ ...n, nome: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter") salvarNova();
              if (e.key === "Escape") setAdicionando(false);
            }}
            className="max-w-xs focus-visible:border-brand"
          />
          <ColorDot value={novo.cor} onChange={(cor) => setNovo((n) => ({ ...n, cor }))} />
          <TipoFinalSelect
            value={novo.tipo_final}
            onChange={(tipo_final) => setNovo((n) => ({ ...n, tipo_final }))}
          />
          <Button size="sm" onClick={salvarNova} className="brand-gradient text-brand-foreground">
            Salvar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setAdicionando(false)}>
            Cancelar
          </Button>
        </div>
      ) : null}

      <ConfirmDeleteDialog
        open={!!aExcluir}
        onOpenChange={(o) => !o && setAExcluir(null)}
        title="Excluir etapa?"
        description={`A etapa "${aExcluir?.nome ?? ""}" será removida do funil. Etapas com registros ativos não podem ser excluídas.`}
        loading={excluir.isPending}
        onConfirm={() => {
          if (aExcluir) excluir.mutate(aExcluir.id);
          setAExcluir(null);
        }}
      />
    </section>
  );
}

function LinhaEtapa({
  etapa,
  funil,
  editando,
  onEditar,
  onCancelar,
  onSalvar,
  onProbabilidade,
  onExcluir,
}: {
  etapa: Etapa;
  funil: Funil;
  editando: boolean;
  onEditar: () => void;
  onCancelar: () => void;
  onSalvar: (patch: { nome: string; cor: string; tipo_final: TipoFinal }) => void;
  onProbabilidade: (valor: number | null) => void;
  onExcluir: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: etapa.id,
  });
  const [form, setForm] = useState({
    nome: etapa.nome,
    cor: etapa.cor ?? "#6B7280",
    tipo_final: etapa.tipo_final,
  });

  useEffect(() => {
    if (editando) {
      setForm({ nome: etapa.nome, cor: etapa.cor ?? "#6B7280", tipo_final: etapa.tipo_final });
    }
  }, [editando, etapa]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 border-b border-border/60 px-6 py-3 transition-colors hover:bg-secondary/60",
        isDragging && "rounded-lg border border-brand bg-secondary shadow-md",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Reordenar"
        className="cursor-grab text-border transition-colors hover:text-muted-foreground"
      >
        <GripVertical className="size-4" />
      </button>

      {editando ? (
        <>
          <ColorDot value={form.cor} onChange={(cor) => setForm((f) => ({ ...f, cor }))} />
          <Input
            autoFocus
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && form.nome.trim()) onSalvar({ ...form, nome: form.nome.trim() });
              if (e.key === "Escape") onCancelar();
            }}
            className="max-w-xs focus-visible:border-brand"
          />
          <TipoFinalSelect
            value={form.tipo_final}
            onChange={(tipo_final) => setForm((f) => ({ ...f, tipo_final }))}
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => form.nome.trim() && onSalvar({ ...form, nome: form.nome.trim() })}
              className="brand-gradient text-brand-foreground"
            >
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelar}>
              Cancelar
            </Button>
          </div>
        </>
      ) : (
        <>
          <ColorDot value={etapa.cor ?? "#6B7280"} />
          <span className="flex-1 truncate text-sm text-foreground">{etapa.nome}</span>
          <TipoFinalBadge tipo={etapa.tipo_final} />
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={onEditar} aria-label="Editar etapa">
              <Pencil className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={onExcluir}
              aria-label="Excluir etapa"
              className="text-danger hover:text-danger"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
