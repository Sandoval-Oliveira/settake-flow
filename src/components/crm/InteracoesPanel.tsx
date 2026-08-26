import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, Field, SelectField, enumOptions } from "./primitives";
import { TIPOS_INTERACAO } from "@/lib/crm-types";
import { useInteracoes, useSaveRecord } from "@/lib/crm-api";
import { formatDateTime } from "@/lib/format";

type Target = {
  lead_id?: string | null;
  pessoa_id?: string | null;
  oportunidade_id?: string | null;
};

export function InteracoesPanel({ target }: { target: Target }) {
  const { data: interacoes = [], isLoading } = useInteracoes(target);
  const [tipo, setTipo] = useState<string | null>("Nota");
  const [descricao, setDescricao] = useState("");
  const save = useSaveRecord("Interação registrada");

  function submit() {
    if (!descricao.trim()) return;
    save.mutate(
      {
        table: "crm_interacoes",
        values: {
          tipo: tipo ?? "Nota",
          descricao: descricao.trim(),
          lead_id: target.lead_id ?? null,
          pessoa_id: target.pessoa_id ?? null,
          oportunidade_id: target.oportunidade_id ?? null,
        },
      },
      { onSuccess: () => setDescricao("") },
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <Field label="Tipo">
          <SelectField
            value={tipo}
            onChange={setTipo}
            allowEmpty={false}
            options={enumOptions(TIPOS_INTERACAO)}
          />
        </Field>
        <Field label="Descrição">
          <Textarea
            rows={2}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="O que aconteceu?"
          />
        </Field>
      </div>
      <Button
        size="sm"
        onClick={submit}
        disabled={save.isPending || !descricao.trim()}
        className="brand-gradient font-semibold text-brand-foreground"
      >
        {save.isPending ? "Registrando..." : "Registrar interação"}
      </Button>

      <div className="space-y-3 border-t border-border pt-4">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Carregando...</p>
        ) : interacoes.length === 0 ? (
          <EmptyState icon="💬" message="Nenhuma interação registrada" />
        ) : (
          interacoes.map((i) => (
            <div key={String(i.id)} className="rounded-lg border border-border bg-surface/50 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-brand">{i.tipo}</span>
                <span className="text-[11px] text-muted-foreground">
                  {formatDateTime(i.criado_em)}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{i.descricao}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
