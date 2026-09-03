import { AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { InteracoesPanel } from "./InteracoesPanel";
import { PriorityBadge, SoftBadge, WhatsAppButton } from "./primitives";
import { formatDateTime, formatMoney, whatsappLink } from "@/lib/format";
import type { Tarefa } from "@/lib/crm-types";

export type VinculoInfo = {
  nome: string | null;
  tipo: "Lead" | "Contato" | "Oportunidade" | null;
  whatsapp: string | null;
  segmento: string | null;
  origem: string | null;
  oportunidadeNome: string | null;
  oportunidadeValor: number | null;
};

function Row({ icon, label, children }: { icon: string; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 text-xs">
      <span aria-hidden>{icon}</span>
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-foreground">{children}</span>
    </div>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-border pt-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

export function TarefaDrawer({
  tarefa,
  vinculo,
  atrasada,
  onOpenChange,
  onEditar,
  onConcluir,
}: {
  tarefa: Tarefa | null;
  vinculo: VinculoInfo;
  atrasada: boolean;
  onOpenChange: (v: boolean) => void;
  onEditar: () => void;
  onConcluir: () => void;
}) {
  const concluida = tarefa?.status === "Concluída";
  return (
    <Sheet open={Boolean(tarefa)} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-[480px]">
        <SheetHeader>
          <SheetTitle className={concluida ? "line-through" : undefined}>
            {tarefa?.titulo}
          </SheetTitle>
        </SheetHeader>
        {tarefa ? (
          <div className="space-y-5 px-4 pb-8">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge prioridade={tarefa.prioridade} />
              <SoftBadge>{tarefa.status ?? "Pendente"}</SoftBadge>
              <div className="ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={onEditar}>
                  Editar
                </Button>
                {!concluida ? (
                  <Button
                    size="sm"
                    onClick={onConcluir}
                    className="brand-gradient font-semibold text-brand-foreground"
                  >
                    Concluir
                  </Button>
                ) : null}
              </div>
            </div>

            <Secao titulo="Detalhes">
              <div className="space-y-2">
                <Row icon="📅" label="Prazo">
                  <span className={atrasada ? "inline-flex items-center gap-1 text-danger" : undefined}>
                    {tarefa.prazo ? formatDateTime(tarefa.prazo) : "Sem prazo"}
                    {atrasada ? (
                      <>
                        <AlertCircle className="size-3" /> Atrasada
                      </>
                    ) : null}
                  </span>
                </Row>
                <Row icon="👤" label="Vínculo">
                  {vinculo.nome ? `${vinculo.nome}${vinculo.tipo ? ` (${vinculo.tipo})` : ""}` : "—"}
                </Row>
                <Row icon="📂" label="Oportunidade">
                  {vinculo.oportunidadeNome
                    ? `${vinculo.oportunidadeNome}${
                        vinculo.oportunidadeValor
                          ? ` — ${formatMoney(vinculo.oportunidadeValor)}`
                          : ""
                      }`
                    : "—"}
                </Row>
                <Row icon="🏷" label="Prioridade">
                  {tarefa.prioridade ?? "—"}
                </Row>
              </div>
            </Secao>

            {tarefa.descricao ? (
              <Secao titulo="Descrição">
                <p className="whitespace-pre-wrap text-sm text-foreground">{tarefa.descricao}</p>
              </Secao>
            ) : null}

            {vinculo.nome ? (
              <Secao titulo={`Contexto do ${vinculo.tipo ?? "vínculo"}`}>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">{vinculo.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {[vinculo.segmento, vinculo.origem].filter(Boolean).join(" · ") || "—"}
                  </p>
                  {vinculo.whatsapp ? (
                    <div className="flex items-center gap-2 text-xs text-foreground">
                      📱 {vinculo.whatsapp}
                      <WhatsAppButton href={whatsappLink(vinculo.whatsapp)} />
                    </div>
                  ) : null}
                </div>
              </Secao>
            ) : null}

            {tarefa.lead_id || tarefa.pessoa_id || tarefa.oportunidade_id ? (
              <Secao titulo="Interações recentes">
                <InteracoesPanel
                  target={{
                    lead_id: tarefa.lead_id ? String(tarefa.lead_id) : null,
                    pessoa_id: tarefa.pessoa_id ? String(tarefa.pessoa_id) : null,
                    oportunidade_id: tarefa.oportunidade_id
                      ? String(tarefa.oportunidade_id)
                      : null,
                  }}
                />
              </Secao>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
