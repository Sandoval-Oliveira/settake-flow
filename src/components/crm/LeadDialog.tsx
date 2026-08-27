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
import { useOpcoesLista } from "@/lib/crm-config";
import { ORIGENS, SEGMENTOS, type Etapa, type Lead } from "@/lib/crm-types";
import { useSaveRecord } from "@/lib/crm-api";
import { maskWhatsapp, normalizeInstagram } from "@/lib/format";

type Form = {
  nome: string;
  whatsapp: string;
  email: string;
  segmento: string | null;
  origem: string | null;
  quem_indicou: string;
  instagram: string;
  etapa_id: string | null;
  observacoes: string;
};

const EMPTY: Form = {
  nome: "",
  whatsapp: "",
  email: "",
  segmento: null,
  origem: null,
  quem_indicou: "",
  instagram: "",
  etapa_id: null,
  observacoes: "",
};

export function LeadDialog({
  open,
  onOpenChange,
  lead,
  etapas,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead?: Lead | null;
  etapas: Etapa[];
}) {
  const { data: optSegmentos } = useOpcoesLista("crm_config_segmentos");
  const { data: optOrigens } = useOpcoesLista("crm_config_origens");
  const [form, setForm] = useState<Form>(EMPTY);
  const save = useSaveRecord(lead ? "Lead atualizado" : "Lead criado");

  useEffect(() => {
    if (!open) return;
    setForm(
      lead
        ? {
            nome: lead.nome ?? "",
            whatsapp: lead.whatsapp ?? "",
            email: lead.email ?? "",
            segmento: lead.segmento ?? null,
            origem: lead.origem ?? null,
            quem_indicou: lead.quem_indicou ?? "",
            instagram: lead.instagram ?? "",
            etapa_id: lead.etapa_id ? String(lead.etapa_id) : (etapas[0]?.id ?? null),
            observacoes: lead.observacoes ?? "",
          }
        : { ...EMPTY, etapa_id: etapas[0]?.id ?? null },
    );
  }, [open, lead, etapas]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));
  const indicacao = (form.origem ?? "").includes("Indicação");

  function submit() {
    if (!form.nome.trim()) return;
    save.mutate(
      {
        table: "crm_leads",
        id: lead?.id ? String(lead.id) : null,
        values: {
          nome: form.nome.trim(),
          whatsapp: form.whatsapp.replace(/\D/g, "") || null,
          email: form.email.trim() || null,
          segmento: form.segmento,
          origem: form.origem,
          quem_indicou: indicacao ? form.quem_indicou.trim() || null : null,
          instagram: form.instagram ? normalizeInstagram(form.instagram) : null,
          etapa_id: form.etapa_id,
          observacoes: form.observacoes.trim() || null,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{lead ? "Editar lead" : "Novo lead"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome *" className="sm:col-span-2">
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} autoFocus />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={maskWhatsapp(form.whatsapp)}
              onChange={(e) => set("whatsapp", e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </Field>
          <Field label="E-mail">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Segmento">
            <SelectField
              value={form.segmento}
              onChange={(v) => set("segmento", v)}
              options={optSegmentos ?? enumOptions(SEGMENTOS)}
            />
          </Field>
          <Field label="Origem">
            <SelectField
              value={form.origem}
              onChange={(v) => set("origem", v)}
              options={optOrigens ?? enumOptions(ORIGENS)}
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
          <Field label="Instagram">
            <Input
              value={form.instagram}
              onChange={(e) => set("instagram", e.target.value)}
              placeholder="@perfil"
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
          <Field label="Observações" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
            />
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
