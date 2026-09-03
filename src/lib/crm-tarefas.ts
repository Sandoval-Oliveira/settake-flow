import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase, isSupabaseConfigured } from "./supabase";
import type { Tarefa } from "./crm-types";

export function useConcluirTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tarefa, nota }: { tarefa: Tarefa; nota?: string }) => {
      if (!isSupabaseConfigured) throw new Error("Banco não conectado.");
      const { error } = await supabase
        .from("crm_tarefas")
        .update({ status: "Concluída", concluida_em: new Date().toISOString() })
        .eq("id", String(tarefa.id));
      if (error) throw new Error(error.message);

      if (nota?.trim()) {
        const { error: e2 } = await supabase.from("crm_interacoes").insert({
          tipo: "Nota",
          descricao: `[Conclusão de tarefa] ${nota.trim()}`,
          lead_id: tarefa.lead_id ?? null,
          pessoa_id: tarefa.pessoa_id ?? null,
          oportunidade_id: tarefa.oportunidade_id ?? null,
        });
        if (e2) throw new Error(e2.message);
      }
      return true;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tarefas"] });
      void qc.invalidateQueries({ queryKey: ["tarefas_pendentes"] });
      void qc.invalidateQueries({ queryKey: ["interacoes"] });
      toast.success("Tarefa concluída!");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReabrirTarefa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tarefa: Tarefa) => {
      if (!isSupabaseConfigured) throw new Error("Banco não conectado.");
      const { error } = await supabase
        .from("crm_tarefas")
        .update({ status: "Pendente", concluida_em: null })
        .eq("id", String(tarefa.id));
      if (error) throw new Error(error.message);
      return true;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tarefas"] });
      void qc.invalidateQueries({ queryKey: ["tarefas_pendentes"] });
      toast.success("Tarefa reaberta");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
