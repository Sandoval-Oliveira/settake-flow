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
import { Switch } from "@/components/ui/switch";
import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { cn } from "@/lib/utils";
import {
  useAtualizarItemLista,
  useCriarItemLista,
  useExcluirItemLista,
  useLista,
  useReordenarLista,
  type ItemLista,
  type ListaTabela,
} from "@/lib/crm-config";

type Props = {
  tabela: ListaTabela;
  titulo: string;
  descricao: string;
  rotuloItem: string;
};

export function GerenciadorLista({ tabela, titulo, descricao, rotuloItem }: Props) {
  const { data, isLoading } = useLista(tabela);
  const criar = useCriarItemLista(tabela);
  const atualizar = useAtualizarItemLista(tabela);
  const excluir = useExcluirItemLista(tabela);
  const reordenar = useReordenarLista(tabela);

  const [itens, setItens] = useState<ItemLista[]>([]);
  const [adicionando, setAdicionando] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [aExcluir, setAExcluir] = useState<ItemLista | null>(null);

  useEffect(() => {
    if (data) setItens(data);
  }, [data]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function duplicado(nome: string, ignoreId?: number) {
    return itens.some(
      (i) => i.id !== ignoreId && i.nome.trim().toLowerCase() === nome.trim().toLowerCase(),
    );
  }

  function salvarNovo() {
    const nome = novoNome.trim();
    if (!nome) return setErro("Informe um nome");
    if (duplicado(nome)) return setErro("Já existe um item com este nome");
    const ordem = Math.max(0, ...itens.map((i) => i.ordem)) + 1;
    criar.mutate({ nome, ordem });
    setNovoNome("");
    setErro(null);
    setAdicionando(false);
  }

  function salvarEdicao(item: ItemLista, nome: string) {
    const limpo = nome.trim();
    if (!limpo || limpo === item.nome) return setEditandoId(null);
    if (duplicado(limpo, item.id)) {
      setErro("Já existe um item com este nome");
      return;
    }
    atualizar.mutate({ id: item.id, nome: limpo });
    setErro(null);
    setEditandoId(null);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = itens.findIndex((i) => String(i.id) === String(active.id));
    const to = itens.findIndex((i) => String(i.id) === String(over.id));
    const next = arrayMove(itens, from, to);
    setItens(next);
    reordenar.mutate(next.map((i) => i.id));
  }

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-6 py-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">{titulo}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>
        </div>
        <Button
          onClick={() => {
            setAdicionando(true);
            setErro(null);
          }}
          className="brand-gradient text-brand-foreground"
        >
          <Plus className="size-4" /> Adicionar {rotuloItem}
        </Button>
      </header>

      <div>
        {adicionando ? (
          <div className="border-b border-border px-6 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                autoFocus
                value={novoNome}
                placeholder={`Nome do novo ${rotuloItem}...`}
                onChange={(e) => {
                  setNovoNome(e.target.value);
                  setErro(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") salvarNovo();
                  if (e.key === "Escape") setAdicionando(false);
                }}
                className="max-w-sm focus-visible:border-brand"
              />
              <Button size="sm" onClick={salvarNovo} className="brand-gradient text-brand-foreground">
                Salvar
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAdicionando(false);
                  setNovoNome("");
                  setErro(null);
                }}
              >
                Cancelar
              </Button>
            </div>
            {erro ? <p className="mt-1.5 text-xs text-danger">{erro}</p> : null}
          </div>
        ) : null}

        {isLoading ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Carregando…</p>
        ) : itens.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">Nenhum item cadastrado.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext
              items={itens.map((i) => String(i.id))}
              strategy={verticalListSortingStrategy}
            >
              {itens.map((item) => (
                <LinhaLista
                  key={item.id}
                  item={item}
                  editando={editandoId === item.id}
                  erro={editandoId === item.id ? erro : null}
                  onEditar={() => {
                    setEditandoId(item.id);
                    setErro(null);
                  }}
                  onCancelar={() => {
                    setEditandoId(null);
                    setErro(null);
                  }}
                  onSalvar={(nome) => salvarEdicao(item, nome)}
                  onToggle={(ativo) => atualizar.mutate({ id: item.id, ativo })}
                  onExcluir={() => setAExcluir(item)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      <ConfirmDeleteDialog
        open={!!aExcluir}
        onOpenChange={(o) => !o && setAExcluir(null)}
        title="Excluir item?"
        description={`Leads e contatos que usam "${aExcluir?.nome ?? ""}" manterão o valor salvo, mas ele não estará disponível em novos cadastros.`}
        loading={excluir.isPending}
        onConfirm={() => {
          if (aExcluir) excluir.mutate(aExcluir.id);
          setAExcluir(null);
        }}
      />
    </section>
  );
}

function LinhaLista({
  item,
  editando,
  erro,
  onEditar,
  onCancelar,
  onSalvar,
  onToggle,
  onExcluir,
}: {
  item: ItemLista;
  editando: boolean;
  erro: string | null;
  onEditar: () => void;
  onCancelar: () => void;
  onSalvar: (nome: string) => void;
  onToggle: (ativo: boolean) => void;
  onExcluir: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(item.id),
  });
  const [valor, setValor] = useState(item.nome);

  useEffect(() => {
    if (editando) setValor(item.nome);
  }, [editando, item.nome]);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 border-b border-border/60 px-6 py-3 transition-colors hover:bg-secondary/60",
        !item.ativo && !isDragging && "opacity-50",
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
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              autoFocus
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSalvar(valor);
                if (e.key === "Escape") onCancelar();
              }}
              className="max-w-sm focus-visible:border-brand"
            />
            <Button
              size="sm"
              onClick={() => onSalvar(valor)}
              className="brand-gradient text-brand-foreground"
            >
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={onCancelar}>
              Cancelar
            </Button>
          </div>
          {erro ? <p className="text-xs text-danger">{erro}</p> : null}
        </div>
      ) : (
        <span className="flex-1 truncate text-sm text-foreground">{item.nome}</span>
      )}

      <div className="flex items-center gap-2">
        <Switch checked={item.ativo} onCheckedChange={onToggle} aria-label="Ativo" />
        <span className="inline-flex w-16 items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn("size-1.5 rounded-full", item.ativo ? "bg-success" : "bg-muted-foreground")}
            aria-hidden
          />
          {item.ativo ? "Ativo" : "Inativo"}
        </span>
      </div>

      {!editando ? (
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={onEditar} aria-label="Editar">
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={onExcluir}
            aria-label="Excluir"
            className="text-danger hover:text-danger"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
