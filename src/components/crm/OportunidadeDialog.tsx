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
import { Field, SelectField, enumOptions } from "./primitives";
import { ORIGENS, type Etapa, type Oportunidade } from "@/lib/crm-types";
import { usePessoas, useSaveRecord, useServicos } from "@/lib/crm-api";

type Form = {
  nome: string;
  pessoa_id: string | null;
  item_id: string | null;
  valor: string;
  origem: string | null;
  etapa_id: string | null;
  motivo_perda: string;
  data_fechamento: string;
};

const EMPTY: Form = {
  nome: "",
  pessoa_id: null,
  item_id: null,
  valor: "",
  origem: null,
  etapa_id: null,
  motivo_perda: "",
  data_fechamento: "",
};

export function OportunidadeDialog({
  open,
  onOpenChange,
  oportunidade,
  etapas,
  pessoaId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  oportunidade?: Oportunidade | null;
  etapas: Etapa[];
  pessoaId?: string | null;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const { data: pessoas = [] } = usePessoas();
  const { data: servicos = [] } = useServicos();
  const save = useSaveRecord(oportunidade ? "Oportunidade atualizada" : "Oportunidade criada");

  useEffect(() => {
    if (!open) return;
    setForm(
      oportunidade
        ? {
            nome: oportunidade.nome ?? "",
            pessoa_id: oportunidade.pessoa_id ? String(oportunidade.pessoa_id) : null,
            item_id: oportunidade.item_id != null ? String(oportunidade.item_id) : null,
            valor: oportunidade.valor != null ? String(oportunidade.valor) : "",
            origem: oportunidade.origem ?? null,
            etapa_id: oportunidade.etapa_id ? String(oportunidade.etapa_id) : (etapas[0]?.id ?? null),
            motivo_perda: oportunidade.motivo_perda ?? "",
            data_fechamento: oportunidade.data_fechamento
              ? String(oportunidade.data_fechamento).slice(0, 10)
              : "",
          }
        : { ...EMPTY, etapa_id: etapas[0]?.id ?? null, pessoa_id: pessoaId ?? null },
    );
  }, [open, oportunidade, etapas, pessoaId]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const etapaAtual = etapas.find((e) => String(e.id) === form.etapa_id);
  const perdido = etapaAtual?.tipo_final === "perdido";

  function submit() {
    if (!form.nome.trim()) return;
    save.mutate(
      {
        table: "crm_oportunidades",
        id: oportunidade?.id ? String(oportunidade.id) : null,
        values: {
          nome: form.nome.trim(),
          pessoa_id: form.pessoa_id,
          item_id: form.item_id ? Number(form.item_id) : null,
          valor: form.valor ? Number(form.valor.replace(",", ".")) : null,
          origem: form.origem,
          etapa_id: form.etapa_id,
          motivo_perda: perdido ? form.motivo_perda.trim() || null : null,
          data_fechamento: form.data_fechamento || null,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{oportunidade ? "Editar oportunidade" : "Nova oportunidade"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome da oportunidade *" className="sm:col-span-2">
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} autoFocus />
          </Field>
          <Field label="Cliente">
            <SelectField
              value={form.pessoa_id}
              onChange={(v) => set("pessoa_id", v)}
              options={pessoas.map((p) => ({ value: String(p.id), label: p.nome }))}
              placeholder="Selecione o cliente"
            />
          </Field>
          <Field label="Serviço">
            <SelectField
              value={form.item_id}
              onChange={(v) => set("item_id", v)}
              options={servicos.map((s) => ({
                value: String(s.id),
                label: s.nome,
                group: s.grupo_nome,
              }))}
              placeholder="Selecione o serviço"
            />
          </Field>
          <Field label="Valor (R$)">
            <Input
              inputMode="decimal"
              value={form.valor}
              onChange={(e) => set("valor", e.target.value)}
              placeholder="0,00"
            />
          </Field>
          <Field label="Origem">
            <SelectField
              value={form.origem}
              onChange={(v) => set("origem", v)}
              options={enumOptions(ORIGENS)}
            />
          </Field>
          <Field label="Etapa">
            <SelectField
              value={form.etapa_id}
              onChange={(v) => set("etapa_id", v)}
              allowEmpty={false}
              options={etapas.map((e) => ({ value: String(e.id), label: e.nome }))}
            />
          </Field>
          <Field label="Data de fechamento">
            <Input
              type="date"
              value={form.data_fechamento}
              onChange={(e) => set("data_fechamento", e.target.value)}
            />
          </Field>
          {perdido ? (
            <Field label="Motivo da perda" className="sm:col-span-2">
              <Input
                value={form.motivo_perda}
                onChange={(e) => set("motivo_perda", e.target.value)}
              />
            </Field>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={save.isPending || !form.nome.trim()}
            className="brand-gradient font-semibold text-brand-foreground"
          >
            {save.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
