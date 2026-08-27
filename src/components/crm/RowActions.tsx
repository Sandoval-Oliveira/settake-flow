import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Props = {
  onEdit: () => void;
  onDelete: () => void;
  deleteLabel?: string;
  /** exibe apenas no hover do card kanban */
  floating?: boolean;
};

export function RowActions({
  onEdit,
  onDelete,
  deleteLabel = "Excluir",
  floating = false,
}: Props) {
  return (
    <div
      className={cn(
        floating &&
          "card-actions absolute right-2 top-2 opacity-0 transition-opacity duration-150",
      )}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Ações"
            className="flex size-6 items-center justify-center rounded-md bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <MoreHorizontal className="size-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="size-4" /> Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-danger focus:text-danger">
            <Trash2 className="size-4" /> {deleteLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
