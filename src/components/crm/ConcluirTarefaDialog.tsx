import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useConcluirTarefa } from "@/lib/crm-tarefas";
import type { Tarefa } from "@/lib/crm-types";

export function ConcluirTarefaDialog({
  tarefa,
  vinculoNome,
  onOpenChange,
  onConcluida,
}: {
  tarefa: Tarefa | null;
  vinculoNome?: string | null;
  onOpenChange: (v: boolean) => void;
  onConcluida?: () => void;
}) {
  const [nota, setNota] = useState("");
  const concluir = useConcluirTarefa();

  useEffect(() => {
    if (tarefa) setNota("");
  }, [tarefa]);

  return (
    <Dialog open={Boolean(tarefa)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Concluir tarefa</DialogTitle>
          <DialogDescription>
            “{tarefa?.titulo}
            {vinculoNome ? ` — ${vinculoNome}` : ""}”
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Registrar uma nota sobre o resultado (opcional)
          </p>
          <Textarea
            autoFocus
            rows={4}
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ex: Cliente confirmou interesse no Plano Full. Agendou reunião para sexta-feira..."
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={concluir.isPending || !tarefa}
            onClick={() => {
              if (!tarefa) return;
              concluir.mutate(
                { tarefa, nota },
                {
                  onSuccess: () => {
                    onOpenChange(false);
                    onConcluida?.();
                  },
                },
              );
            }}
            className="brand-gradient font-semibold text-brand-foreground"
          >
            ✓ Concluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
