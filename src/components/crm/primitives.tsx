import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PRIORIDADES, type Prioridade } from "@/lib/crm-types";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder = "Selecione",
  allowEmpty = true,
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  options: { value: string; label: string; group?: string }[];
  placeholder?: string;
  allowEmpty?: boolean;
}) {
  const groups = [...new Set(options.map((o) => o.group ?? ""))];
  return (
    <Select
      value={value ?? "__none"}
      onValueChange={(v) => onChange(v === "__none" ? null : v)}
    >
      <SelectTrigger className="bg-background">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowEmpty ? (
          <SelectItem value="__none" className="text-muted-foreground">
            {placeholder}
          </SelectItem>
        ) : null}
        {groups.map((g) => (
          <div key={g || "root"}>
            {g ? (
              <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {g}
              </div>
            ) : null}
            {options
              .filter((o) => (o.group ?? "") === g)
              .map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}

export function enumOptions(values: readonly string[]) {
  return values.map((v) => ({ value: v, label: v }));
}

export function PriorityBadge({ prioridade }: { prioridade: Prioridade | null | undefined }) {
  const map: Record<Prioridade, string> = {
    Urgente: "bg-danger/20 text-danger",
    Alta: "bg-warning/20 text-warning",
    Média: "bg-info/20 text-info",
    Baixa: "bg-muted-foreground/20 text-muted-foreground",
  };
  const p = (prioridade && PRIORIDADES.includes(prioridade) ? prioridade : "Baixa") as Prioridade;
  return (
    <span
      className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", map[p])}
    >
      {p}
    </span>
  );
}

const ORIGIN_ICON: { match: string; icon: string }[] = [
  { match: "ADS", icon: "🎯" },
  { match: "Instagram", icon: "📸" },
  { match: "WPP", icon: "📱" },
  { match: "Indicação", icon: "🤝" },
  { match: "Prospecção", icon: "📞" },
];

export function OriginBadge({ origem }: { origem: string | null | undefined }) {
  if (!origem) return null;
  const icon = ORIGIN_ICON.find((o) => origem.includes(o.match))?.icon ?? "•";
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">
      <span aria-hidden>{icon}</span>
      {origem}
    </span>
  );
}

export function SoftBadge({
  children,
  color,
}: {
  children: ReactNode;
  color?: string | null;
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground"
      style={color ? { color, backgroundColor: `${color}22` } : undefined}
    >
      {color ? (
        <span className="size-1.5 rounded-full" style={{ backgroundColor: color }} aria-hidden />
      ) : null}
      {children}
    </span>
  );
}

export function EmptyState({ icon = "📭", message }: { icon?: string; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-4 py-8 text-center">
      <span className="text-2xl" aria-hidden>
        {icon}
      </span>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-5", className)}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

export function WhatsAppButton({ href }: { href: string | null }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex size-8 items-center justify-center rounded-lg bg-success/15 text-success transition-colors hover:bg-success/25"
      aria-label="Abrir WhatsApp"
    >
      📱
    </a>
  );
}
