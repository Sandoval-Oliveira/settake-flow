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
import {
  AREAS_ATUACAO,
  ORIGENS,
  SEGMENTOS,
  TIPOS_PESSOA,
  type Etapa,
  type Pessoa,
} from "@/lib/crm-types";
import { useSaveRecord } from "@/lib/crm-api";
import { maskWhatsapp, normalizeInstagram } from "@/lib/format";

type Form = {
  nome: string;
  tipo: string | null;
  whatsapp: string;
  email: string;
  segmento: string | null;
  area_atuacao: string | null;
  origem: string | null;
  quem_indicou: string;
  instagram: string;
  endereco: string;
  cpf_cnpj: string;
  aniversario: string;
  etapa_nutricao_id: string | null;
};

const EMPTY: Form = {
  nome: "",
  tipo: "Cliente",
  whatsapp: "",
  email: "",
  segmento: null,
  area_atuacao: null,
  origem: null,
  quem_indicou: "",
  instagram: "",
  endereco: "",
  cpf_cnpj: "",
  aniversario: "",
  etapa_nutricao_id: null,
};

export function ContatoDialog({
  open,
  onOpenChange,
  pessoa,
  etapasNutricao,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pessoa?: Pessoa | null;
  etapasNutricao: Etapa[];
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const save = useSaveRecord(pessoa ? "Contato atualizado" : "Contato criado");

  useEffect(() => {
    if (!open) return;
    setForm(
      pessoa
        ? {
            nome: pessoa.nome ?? "",
            tipo: pessoa.tipo ?? "Cliente",
            whatsapp: pessoa.whatsapp ?? "",
            email: pessoa.email ?? "",
            segmento: pessoa.segmento ?? null,
            area_atuacao: pessoa.area_atuacao ?? null,
            origem: pessoa.origem ?? null,
            quem_indicou: pessoa.quem_indicou ?? "",
            instagram: pessoa.instagram ?? "",
            endereco: pessoa.endereco ?? "",
            cpf_cnpj: pessoa.cpf_cnpj ?? "",
            aniversario: pessoa.aniversario ? String(pessoa.aniversario).slice(0, 10) : "",
            etapa_nutricao_id: pessoa.etapa_nutricao_id ? String(pessoa.etapa_nutricao_id) : null,
          }
        : EMPTY,
    );
  }, [open, pessoa]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const indicacao = (form.origem ?? "").includes("Indicação");

  function submit() {
    if (!form.nome.trim()) return;
    save.mutate(
      {
        table: "pessoas",
        id: pessoa?.id ? String(pessoa.id) : null,
        values: {
          nome: form.nome.trim(),
          tipo: form.tipo,
          whatsapp: form.whatsapp.replace(/\D/g, "") || null,
          email: form.email.trim() || null,
          segmento: form.segmento,
          area_atuacao: form.area_atuacao,
          origem: form.origem,
          quem_indicou: indicacao ? form.quem_indicou.trim() || null : null,
          instagram: form.instagram ? normalizeInstagram(form.instagram) : null,
          endereco: form.endereco.trim() || null,
          cpf_cnpj: form.cpf_cnpj.trim() || null,
          aniversario: form.aniversario || null,
          etapa_nutricao_id: form.etapa_nutricao_id,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{pessoa ? "Editar contato" : "Novo contato"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome *" className="sm:col-span-2">
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} autoFocus />
          </Field>
          <Field label="Tipo">
            <SelectField
              value={form.tipo}
              onChange={(v) => set("tipo", v)}
              allowEmpty={false}
              options={enumOptions(TIPOS_PESSOA)}
            />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={maskWhatsapp(form.whatsapp)}
              onChange={(e) => set("whatsapp", e.target.value)}
            />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Instagram">
            <Input value={form.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </Field>
          <Field label="Segmento">
            <SelectField
              value={form.segmento}
              onChange={(v) => set("segmento", v)}
              options={enumOptions(SEGMENTOS)}
            />
          </Field>
          <Field label="Área de atuação">
            <SelectField
              value={form.area_atuacao}
              onChange={(v) => set("area_atuacao", v)}
              options={enumOptions(AREAS_ATUACAO)}
            />
          </Field>
          <Field label="Origem">
            <SelectField
              value={form.origem}
              onChange={(v) => set("origem", v)}
              options={enumOptions(ORIGENS)}
            />
          </Field>
          {indicacao ? (
            <Field label="Quem indicou">
              <Input
                value={form.quem_indicou}
                onChange={(e) => set("quem_indicou", e.target.value)}
              />
            </Field>
          ) : null}
          <Field label="CPF / CNPJ">
            <Input value={form.cpf_cnpj} onChange={(e) => set("cpf_cnpj", e.target.value)} />
          </Field>
          <Field label="Aniversário">
            <Input
              type="date"
              value={form.aniversario}
              onChange={(e) => set("aniversario", e.target.value)}
            />
          </Field>
          <Field label="Etapa de nutrição">
            <SelectField
              value={form.etapa_nutricao_id}
              onChange={(v) => set("etapa_nutricao_id", v)}
              options={etapasNutricao.map((e) => ({ value: String(e.id), label: e.nome }))}
            />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <Input value={form.endereco} onChange={(e) => set("endereco", e.target.value)} />
          </Field>
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
