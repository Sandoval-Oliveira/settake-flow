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
import { Switch } from "@/components/ui/switch";
import { Field, SelectField, enumOptions } from "./primitives";
import { AREAS_ATUACAO, SEGMENTOS, TIPOS_PESSOA, type Etapa, type Lead } from "@/lib/crm-types";
import { useConverterLead, useEtapas, useServicos } from "@/lib/crm-api";
import { maskWhatsapp } from "@/lib/format";

export function ConverterLeadDialog({
  open,
  onOpenChange,
  lead,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  lead: Lead | null;
}) {
  const { data: etapasVendas = [] } = useEtapas("vendas");
  const { data: servicos = [] } = useServicos();
  const converter = useConverterLead();

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<string | null>("Cliente");
  const [whatsapp, setWhatsapp] = useState("");
  const [segmento, setSegmento] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [criarOportunidade, setCriarOportunidade] = useState(true);
  const [oppNome, setOppNome] = useState("");
  const [valor, setValor] = useState("");
  const [itemId, setItemId] = useState<string | null>(null);
  const [etapaId, setEtapaId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !lead) return;
    setNome(lead.nome ?? "");
    setTipo("Cliente");
    setWhatsapp(lead.whatsapp ?? "");
    setSegmento(lead.segmento ?? null);
    setArea(null);
    setCriarOportunidade(true);
    setOppNome(`Oportunidade — ${lead.nome ?? ""}`);
    setValor("");
    setItemId(null);
    setEtapaId((etapasVendas as Etapa[])[0]?.id ? String(etapasVendas[0]!.id) : null);
  }, [open, lead, etapasVendas]);

  if (!lead) return null;

  function submit() {
    converter.mutate(
      {
        lead: lead!,
        pessoa: {
          nome: nome.trim(),
          tipo,
          whatsapp: whatsapp.replace(/\D/g, "") || null,
          email: lead!.email ?? null,
          segmento,
          area_atuacao: area,
          origem: lead!.origem ?? null,
          quem_indicou: lead!.quem_indicou ?? null,
          instagram: lead!.instagram ?? null,
        },
        oportunidade: criarOportunidade
          ? {
              nome: oppNome.trim() || `Oportunidade — ${nome.trim()}`,
              etapa_id: etapaId,
              origem: lead!.origem ?? null,
              item_id: itemId ? Number(itemId) : null,
              valor: valor ? Number(valor.replace(",", ".")) : null,
            }
          : null,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Converter lead em cliente</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nome *" className="sm:col-span-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Field label="Tipo">
            <SelectField
              value={tipo}
              onChange={setTipo}
              allowEmpty={false}
              options={enumOptions(TIPOS_PESSOA)}
            />
          </Field>
          <Field label="WhatsApp">
            <Input value={maskWhatsapp(whatsapp)} onChange={(e) => setWhatsapp(e.target.value)} />
          </Field>
          <Field label="Segmento">
            <SelectField
              value={segmento}
              onChange={setSegmento}
              options={enumOptions(SEGMENTOS)}
            />
          </Field>
          <Field label="Área de atuação">
            <SelectField value={area} onChange={setArea} options={enumOptions(AREAS_ATUACAO)} />
          </Field>
        </div>

        <div className="mt-2 flex items-center justify-between rounded-lg border border-border bg-surface/50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-foreground">Criar oportunidade de venda</p>
            <p className="text-xs text-muted-foreground">
              Adiciona o cliente direto no funil de vendas.
            </p>
          </div>
          <Switch checked={criarOportunidade} onCheckedChange={setCriarOportunidade} />
        </div>

        {criarOportunidade ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da oportunidade" className="sm:col-span-2">
              <Input value={oppNome} onChange={(e) => setOppNome(e.target.value)} />
            </Field>
            <Field label="Serviço">
              <SelectField
                value={itemId}
                onChange={setItemId}
                options={servicos.map((s) => ({
                  value: String(s.id),
                  label: s.nome,
                  group: s.grupo_nome,
                }))}
              />
            </Field>
            <Field label="Valor (R$)">
              <Input
                inputMode="decimal"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
              />
            </Field>
            <Field label="Etapa do funil de vendas">
              <SelectField
                value={etapaId}
                onChange={setEtapaId}
                allowEmpty={false}
                options={etapasVendas.map((e) => ({ value: String(e.id), label: e.nome }))}
              />
            </Field>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={converter.isPending || !nome.trim()}
            className="brand-gradient font-semibold text-brand-foreground"
          >
            {converter.isPending ? "Convertendo..." : "Converter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
