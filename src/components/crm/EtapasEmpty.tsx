import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { Funil } from "@/lib/crm-types";

const DEFAULTS: Record<Funil, { nome: string; cor: string; tipo_final?: string }[]> = {
  leads: [
    { nome: "Novo Lead", cor: "#3b82f6" },
    { nome: "Contato Feito", cor: "#8b5cf6" },
    { nome: "Qualificando", cor: "#e8b800" },
    { nome: "Qualificado", cor: "#22c55e", tipo_final: "qualificado" },
    { nome: "Desqualificado", cor: "#ef4444", tipo_final: "desqualificado" },
  ],
  vendas: [
    { nome: "Proposta Enviada", cor: "#3b82f6" },
    { nome: "Negociação", cor: "#e8b800" },
    { nome: "Fechamento", cor: "#f5820a" },
    { nome: "Ganho", cor: "#22c55e", tipo_final: "ganho" },
    { nome: "Perdido", cor: "#ef4444", tipo_final: "perdido" },
  ],
  nutricao: [
    { nome: "Cliente Ativo", cor: "#22c55e" },
    { nome: "Acompanhamento", cor: "#3b82f6" },
    { nome: "Reativação", cor: "#e8b800" },
    { nome: "Inativo", cor: "#8b8fa8" },
  ],
};

export function EtapasEmpty({ funil }: { funil: Funil }) {
  const qc = useQueryClient();
  const criar = useMutation({
    mutationFn: async () => {
      const rows = DEFAULTS[funil].map((e, i) => ({
        funil,
        nome: e.nome,
        ordem: i + 1,
        cor: e.cor,
        tipo_final: e.tipo_final ?? null,
      }));
      const { error } = await supabase.from("crm_funil_etapas").insert(rows);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["etapas"] });
      toast.success("Etapas padrão criadas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <span className="text-3xl" aria-hidden>
        🧩
      </span>
      <h2 className="text-sm font-semibold text-foreground">Nenhuma etapa configurada</h2>
      <p className="max-w-md text-xs text-muted-foreground">
        Este funil ainda não tem etapas cadastradas em <code>crm_funil_etapas</code>. Crie as etapas
        padrão para começar a usar o quadro.
      </p>
      <Button
        onClick={() => criar.mutate()}
        disabled={criar.isPending}
        className="brand-gradient font-semibold text-brand-foreground"
      >
        {criar.isPending ? "Criando..." : "Criar etapas padrão"}
      </Button>
    </div>
  );
}
