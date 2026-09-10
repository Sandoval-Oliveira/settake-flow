import { createFileRoute } from "@tanstack/react-router";
import { RequirePapel } from "@/components/crm/AuthGate";
import { useState } from "react";
import { PageHeader } from "@/components/crm/PageHeader";
import { GerenciadorLista } from "@/components/crm/GerenciadorLista";
import { GerenciadorEtapas } from "@/components/crm/GerenciadorEtapas";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — SetTake CRM" },
      {
        name: "description",
        content:
          "Personalize segmentos, áreas de atuação, origens e as etapas dos funis do SetTake CRM.",
      },
      { property: "og:title", content: "Configurações — SetTake CRM" },
      {
        property: "og:description",
        content: "Gerencie listas de referência e etapas dos funis do SetTake CRM.",
      },
    ],
  }),
  component: ConfiguracoesPageProtegida,
});

type SecaoId =
  | "segmentos"
  | "areas"
  | "origens"
  | "funil-leads"
  | "funil-vendas"
  | "funil-nutricao";

const GRUPOS: { label: string; itens: { id: SecaoId; label: string }[] }[] = [
  {
    label: "Listas de referência",
    itens: [
      { id: "segmentos", label: "Segmentos" },
      { id: "areas", label: "Áreas de Atuação" },
      { id: "origens", label: "Origens" },
    ],
  },
  {
    label: "Funis",
    itens: [
      { id: "funil-leads", label: "Funil de Leads" },
      { id: "funil-vendas", label: "Funil de Vendas" },
      { id: "funil-nutricao", label: "Funil de Nutrição" },
    ],
  },
];

function ConfiguracoesPageProtegida() {
  return (
    <RequirePapel papeis={["admin", "socio"]}>
      <ConfiguracoesPage />
    </RequirePapel>
  );
}

function ConfiguracoesPage() {
  const [secao, setSecao] = useState<SecaoId>("segmentos");

  return (
    <div>
      <PageHeader
        title="Configurações"
        subtitle="Personalize segmentos, origens, funis e outras opções do sistema"
      />

      <div className="flex flex-col gap-6 lg:flex-row">
        <nav className="w-full shrink-0 rounded-xl border border-border bg-card py-3 lg:w-[200px]">
          {GRUPOS.map((grupo) => (
            <div key={grupo.label} className="mb-2">
              <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {grupo.label}
              </p>
              {grupo.itens.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSecao(item.id)}
                  className={cn(
                    "flex w-full items-center border-l-[3px] px-4 py-2 text-left text-sm transition-colors",
                    secao === item.id
                      ? "border-brand bg-brand/[0.06] font-semibold text-brand"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {secao === "segmentos" ? (
            <GerenciadorLista
              tabela="crm_config_segmentos"
              titulo="Segmentos"
              descricao="Gerencie os segmentos disponíveis nos formulários do CRM"
              rotuloItem="segmento"
            />
          ) : null}
          {secao === "areas" ? (
            <GerenciadorLista
              tabela="crm_config_areas_atuacao"
              titulo="Áreas de Atuação"
              descricao="Gerencie as áreas de atuação disponíveis nos formulários do CRM"
              rotuloItem="área"
            />
          ) : null}
          {secao === "origens" ? (
            <GerenciadorLista
              tabela="crm_config_origens"
              titulo="Origens"
              descricao="Gerencie as origens de captação disponíveis nos formulários do CRM"
              rotuloItem="origem"
            />
          ) : null}
          {secao === "funil-leads" ? (
            <GerenciadorEtapas
              funil="leads"
              titulo="Funil de Leads"
              descricao="Configure as etapas do kanban de leads"
            />
          ) : null}
          {secao === "funil-vendas" ? (
            <GerenciadorEtapas
              funil="vendas"
              titulo="Funil de Vendas"
              descricao="Configure as etapas do kanban de vendas"
            />
          ) : null}
          {secao === "funil-nutricao" ? (
            <GerenciadorEtapas
              funil="nutricao"
              titulo="Funil de Nutrição"
              descricao="Configure as etapas do funil de nutrição"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
