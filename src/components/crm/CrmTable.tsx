import { useMemo, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnSizingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Columns3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

export type CrmColumn<T> = {
  id: string;
  header: string;
  cell: (row: T) => ReactNode;
  size?: number;
  required?: boolean;
  defaultHidden?: boolean;
};

type Props<T> = {
  /** prefixo do localStorage, ex.: "crm-leads" */
  storageKey: string;
  columns: CrmColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  toolbar?: ReactNode;
};

export function ColumnsButton({ children }: { children: ReactNode }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Columns3 className="size-3.5" /> Colunas
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-2">
        {children}
      </PopoverContent>
    </Popover>
  );
}

export function CrmTable<T>({
  storageKey,
  columns,
  rows,
  getRowId,
  onRowClick,
  loading,
  emptyMessage = "Nenhum registro encontrado",
  toolbar,
}: Props<T>) {
  const defaultVisibility = useMemo(() => {
    const v: VisibilityState = {};
    for (const c of columns) if (c.defaultHidden) v[c.id] = false;
    return v;
  }, [columns]);

  const [columnVisibility, setColumnVisibility] = useLocalStorage<VisibilityState>(
    `${storageKey}-col-visibility`,
    defaultVisibility,
  );
  const [columnSizing, setColumnSizing] = useLocalStorage<ColumnSizingState>(
    `${storageKey}-col-sizing`,
    {},
  );

  const tableColumns = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((c) => ({
        id: c.id,
        header: c.header,
        size: c.size ?? 160,
        minSize: 80,
        enableHiding: !c.required,
        cell: ({ row }) => c.cell(row.original),
      })),
    [columns],
  );

  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    state: { columnVisibility, columnSizing },
    onColumnVisibilityChange: (updater) =>
      setColumnVisibility((prev) => (typeof updater === "function" ? updater(prev) : updater)),
    onColumnSizingChange: (updater) =>
      setColumnSizing((prev) => (typeof updater === "function" ? updater(prev) : updater)),
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => getRowId(row),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {toolbar}
        <div className="ml-auto">
          <ColumnsButton>
            <div className="space-y-1">
              {table.getAllLeafColumns().map((col) => {
                const def = columns.find((c) => c.id === col.id);
                return (
                  <label
                    key={col.id}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-foreground",
                      def?.required ? "opacity-60" : "cursor-pointer hover:bg-secondary",
                    )}
                  >
                    <Checkbox
                      checked={col.getIsVisible()}
                      disabled={Boolean(def?.required)}
                      onCheckedChange={(v) => col.toggleVisibility(Boolean(v))}
                    />
                    {def?.header ?? col.id}
                  </label>
                );
              })}
            </div>
          </ColumnsButton>
        </div>
      </div>

      <div className="scroll-slim overflow-x-auto rounded-xl border border-border">
        {loading ? (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </div>
        ) : (
          <table className="crm-table" style={{ width: table.getTotalSize() }}>
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => (
                    <th key={header.id} style={{ width: header.getSize() }}>
                      <span className="truncate">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                      <span
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn("crm-resizer", header.column.getIsResizing() && "is-resizing")}
                        aria-hidden
                      />
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={table.getVisibleLeafColumns().length} className="py-10 text-center">
                    <span className="text-sm text-muted-foreground">{emptyMessage}</span>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    className={onRowClick ? "cursor-pointer" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ width: cell.column.getSize() }}>
                        <span className="block truncate">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
