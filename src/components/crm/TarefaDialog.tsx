import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, SelectField, enumOptions } from "./primitives";
import { PRIORIDADES, STATUS_TAREFA, type Tarefa } from "@/lib/crm-types";
import { useLeads, useOportunidades, usePessoas, useSaveRecord } from "@/lib/crm-api";

type Vinculo = { lead_id?: string | null; pessoa_id?: string | null; oportunidade_id?: string | null };

type Form = {
  titulo: string;
  descricao: string;
  prioridade: string | null;
  status: string | null;
  prazo: string;
  lead_id: string | null;
  pessoa_id: string | null;
  oportunidade_id: string | null;
};

const EMPTY: Form = {
  titulo: "",
  descricao: "",
  prioridade: "Média",
  status: "Pendente",
  prazo: "",
  lead_id: null,
  pessoa_id: null,
  oportunidade_id: null,
};

export function TarefaDialog({
  open,
  onOpenChange,
  tarefa,
  vinculo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tarefa?: Tarefa | null;
  vinculo?: Vinculo;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const { data: leads = [] } = useLeads();
  const { data: pessoas = [] } = usePessoas();
  const { data: oportunidades = [] } = useOportunidades();
  const save = useSaveRecord(tarefa ? "Tarefa atualizada" : "Tarefa criada");

  useEffect(() => {
    if (!open) return;
    setForm(
      tarefa
        ? {
            titulo: tarefa.titulo ?? "",
            descricao: tarefa.descricao ?? "",
            prioridade: tarefa.prioridade ?? "Média",
            status: tarefa.status ?? "Pendente",
            prazo: tarefa.prazo ? String(tarefa.prazo).slice(0, 16) : "",
            lead_id: tarefa.lead_id ? String(tarefa.lead_id) : null,
            pessoa_id: tarefa.pessoa_id ? String(tarefa.pessoa_id) : null,
            oportunidade_id: tarefa.oportunidade_id ? String(tarefa.oportunidade_id) : null,
          }
        : {
            ...EMPTY,
            lead_id: vinculo?.lead_id ?? null,
            pessoa_id: vinculo?.pessoa_id ?? null,
            oportunidade_id: vinculo?.oportunidade_id ?? null,
          },
    );
  }, [open, tarefa, vinculo]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    if (!form.titulo.trim()) return;
    save.mutate(
      {
        table: "crm_tarefas",
        id: tarefa?.id ? String(tarefa.id) : null,
        values: {
          titulo: form.titulo.trim(),
          descricao: form.descricao.trim() || null,
          prioridade: form.prioridade,
          status: form.status,
          prazo: form.prazo ? new Date(form.prazo).toISOString() : null,
          lead_id: form.lead_id,
          pessoa_id: form.pessoa_id,
          oportunidade_id: form.oportunidade_id,
          concluida_em: form.status === "Concluída" ? new Date().toISOString() : null,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tarefa ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Título *" className="sm:col-span-2">
            <Input value={form.titulo} onChange={(e) => set("titulo", e.target.value)} autoFocus />
          </Field>
          <Field label="Prioridade">
            <SelectField
              value={form.prioridade}
              onChange={(v) => set("prioridade", v)}
              allowEmpty={false}
              options={enumOptions(PRIORIDADES)}
            />
          </Field>
          <Field label="Status">
            <SelectField
              value={form.status}
              onChange={(v) => set("status", v)}
              allowEmpty={false}
              options={enumOptions(STATUS_TAREFA)}
            />
          </Field>
          <Field label="Prazo">
            <Input
              type="datetime-local"
              value={form.prazo}
              onChange={(e) => set("prazo", e.target.value)}
            />
          </Field>
          <Field label="Lead vinculado">
            <SelectField
              value={form.lead_id}
              onChange={(v) => set("lead_id", v)}
              options={leads.map((l) => ({ value: String(l.id), label: l.nome }))}
              placeholder="Nenhum"
            />
          </Field>
          <Field label="Contato vinculado">
            <SelectField
              value={form.pessoa_id}
              onChange={(v) => set("pessoa_id", v)}
              options={pessoas.map((p) => ({ value: String(p.id), label: p.nome }))}
              placeholder="Nenhum"
            />
          </Field>
          <Field label="Oportunidade vinculada">
            <SelectField
              value={form.oportunidade_id}
              onChange={(v) => set("oportunidade_id", v)}
              options={oportunidades.map((o) => ({ value: String(o.id), label: o.nome }))}
              placeholder="Nenhuma"
            />
          </Field>
          <Field label="Descrição" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.descricao}
              onChange={(e) => set("descricao", e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={save.isPending || !form.titulo.trim()}
            className="brand-gradient font-semibold text-brand-foreground"
          >
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
