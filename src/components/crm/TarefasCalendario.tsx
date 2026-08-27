import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Tarefa } from "@/lib/crm-types";
import { toDate } from "@/lib/format";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: ptBR }),
  getDay,
  locales: { "pt-BR": ptBR },
});

type Evento = { id: string; title: string; start: Date; end: Date; tarefa: Tarefa };

const CORES: Record<string, string> = {
  Urgente: "#EF4444",
  Alta: "#F59E0B",
  Média: "#E8B800",
  Baixa: "#8B8FA8",
};

export function TarefasCalendario({
  tarefas,
  onSelect,
}: {
  tarefas: Tarefa[];
  onSelect: (tarefa: Tarefa) => void;
}) {
  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  const eventos = useMemo<Evento[]>(
    () =>
      tarefas
        .map((t) => {
          const start = toDate(t.prazo);
          if (!start) return null;
          const end = new Date(start.getTime() + 60 * 60 * 1000);
          return { id: String(t.id), title: t.titulo ?? "Tarefa", start, end, tarefa: t };
        })
        .filter((e): e is Evento => e !== null),
    [tarefas],
  );

  return (
    <div className="crm-calendar rounded-xl border border-border bg-card p-3">
      <Calendar<Evento>
        localizer={localizer}
        culture="pt-BR"
        events={eventos}
        date={date}
        onNavigate={setDate}
        view={view}
        onView={setView}
        views={["month", "week", "day", "agenda"]}
        startAccessor="start"
        endAccessor="end"
        style={{ height: "calc(100vh - 260px)" }}
        onSelectEvent={(e) => onSelect(e.tarefa)}
        popup
        messages={{
          today: "Hoje",
          previous: "Anterior",
          next: "Próximo",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Tarefa",
          noEventsInRange: "Nenhuma tarefa neste período",
          showMore: (n: number) => `+${n} mais`,
        }}
        eventPropGetter={(e) => {
          const cor = CORES[e.tarefa.prioridade ?? "Baixa"] ?? "#8B8FA8";
          const concluida = e.tarefa.status === "Concluída";
          return {
            style: {
              backgroundColor: concluida ? "#2A2D3E" : cor,
              color: concluida ? "#8B8FA8" : "#0F1117",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              textDecoration: concluida ? "line-through" : "none",
            },
          };
        }}
      />
    </div>
  );
}
