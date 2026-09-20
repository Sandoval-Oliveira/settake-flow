import type { ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  defaultDropAnimationSideEffects,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { useCallback, useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EmptyState } from "./primitives";

export type KanbanColumn = {
  id: string;
  nome: string;
  cor: string | null;
  subtitle?: ReactNode;
};

type Props<T> = {
  columns: KanbanColumn[];
  items: T[];
  getId: (item: T) => string;
  getColumnId: (item: T) => string | null;
  renderCard: (item: T) => ReactNode;
  onMove: (itemId: string, columnId: string) => void;
  loading?: boolean;
  emptyMessage?: string;
};

const DROP_ANIMATION: DropAnimation = {
  duration: 220,
  easing: "cubic-bezier(0.2, 0, 0, 1)",
  sideEffects: defaultDropAnimationSideEffects({
    styles: { active: { opacity: "0.35" } },
  }),
};

function Card({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab touch-none select-none transition-[opacity,transform] duration-200 ease-out will-change-transform active:cursor-grabbing",
        isDragging ? "scale-[0.98] opacity-30" : "hover:-translate-y-0.5",
      )}
    >
      {children}
    </div>
  );
}

function Column({
  column,
  count,
  children,
}: {
  column: KanbanColumn;
  count: number;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <div className="flex w-[290px] shrink-0 flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: column.cor ?? "#8B8FA8" }}
          aria-hidden
        />
        <span className="text-sm font-semibold text-foreground">{column.nome}</span>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
          {count}
        </span>
        {column.subtitle ? (
          <span className="ml-auto text-xs font-semibold text-brand">{column.subtitle}</span>
        ) : null}
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "scroll-slim flex max-h-[calc(100vh-260px)] min-h-40 flex-col gap-3 overflow-y-auto rounded-xl border border-border/60 bg-surface/40 p-2 transition-[background-color,border-color,box-shadow] duration-200 ease-out",
          isOver && "border-brand/60 bg-brand/5 shadow-[inset_0_0_0_1px_hsl(var(--brand)/0.25)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function KanbanBoard<T>({
  columns,
  items,
  getId,
  getColumnId,
  renderCard,
  onMove,
  loading,
  emptyMessage = "Nenhum card nesta etapa",
}: Props<T>) {
  const [dragging, setDragging] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const byColumn = useMemo(() => {
    const map = new Map<string, T[]>();
    for (const c of columns) map.set(c.id, []);
    for (const item of items) {
      const col = getColumnId(item);
      if (col && map.has(col)) map.get(col)!.push(item);
    }
    return map;
  }, [columns, items, getColumnId]);

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      setDragging(null);
      const target = e.over?.id ? String(e.over.id) : null;
      if (!target) return;
      const item = items.find((i) => getId(i) === String(e.active.id));
      if (!item || getColumnId(item) === target) return;
      onMove(String(e.active.id), target);
    },
    [items, getId, getColumnId, onMove],
  );

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-[290px] shrink-0 space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const activeItem = items.find((i) => getId(i) === dragging);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setDragging(String(e.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="scroll-slim flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const colItems = byColumn.get(column.id) ?? [];
          return (
            <Column key={column.id} column={column} count={colItems.length}>
              {colItems.length === 0 ? (
                <EmptyState message={emptyMessage} />
              ) : (
                colItems.map((item) => (
                  <Card key={getId(item)} id={getId(item)}>
                    {renderCard(item)}
                  </Card>
                ))
              )}
            </Column>
          );
        })}
      </div>
      <DragOverlay dropAnimation={DROP_ANIMATION} zIndex={60}>
        {activeItem ? (
          <div className="w-[274px] rotate-[1.5deg] scale-[1.03] cursor-grabbing drop-shadow-2xl">
            {renderCard(activeItem)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
