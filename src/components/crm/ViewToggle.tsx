import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string; icon: LucideIcon };

export function ViewToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Option<T>[];
}) {
  return (
    <div className="flex rounded-lg border border-border bg-card p-1">
      {options.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === v
              ? "brand-gradient text-brand-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </button>
      ))}
    </div>
  );
}

export function ViewFade({ children }: { children: React.ReactNode }) {
  return <div className="crm-view-fade">{children}</div>;
}
