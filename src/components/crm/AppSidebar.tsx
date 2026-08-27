import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Sprout,
  Contact,
  CheckSquare,
  ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { usePipelineLeads, usePipelineVendas, useTarefasPendentesView } from "@/lib/crm-api";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { formatMoney } from "@/lib/format";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: LucideIcon; badge?: string; danger?: boolean };

export function AppSidebar() {
  const { data: leads = [] } = usePipelineLeads();
  const { data: vendas = [] } = usePipelineVendas();
  const { data: tarefas = [] } = useTarefasPendentesView();
  const [collapsed, setCollapsed] = useLocalStorage("crm-sidebar-collapsed", false);

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "60px" : "240px");
  }, [collapsed]);

  const leadsAtivos = leads.filter((l) => !l.convertido).length;
  const pipeline = vendas
    .filter((o) => !o.resultado)
    .reduce((sum, o) => sum + Number(o.valor ?? 0), 0);
  const atrasadas = tarefas.filter((t) => t.atrasada).length;

  const items: Item[] = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/leads", label: "Leads", icon: Users, badge: leadsAtivos ? String(leadsAtivos) : "" },
    {
      to: "/vendas",
      label: "Vendas",
      icon: Briefcase,
      badge: pipeline ? formatMoney(pipeline) : "",
    },
    { to: "/nutricao", label: "Nutrição", icon: Sprout },
    { to: "/contatos", label: "Contatos", icon: Contact },
    {
      to: "/tarefas",
      label: "Tarefas",
      icon: CheckSquare,
      badge: atrasadas ? String(atrasadas) : "",
      danger: true,
    },
  ];

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-in-out"
        style={{ width: collapsed ? "60px" : "240px" }}
      >
        <div
          className={cn(
            "flex items-center gap-3 py-5",
            collapsed ? "justify-center px-2" : "px-5",
          )}
        >
          <span className="brand-gradient flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-brand-foreground">
            SC
          </span>
          {!collapsed ? (
            <span className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">SetTake</span>
              <span className="text-xs text-muted-foreground">CRM</span>
            </span>
          ) : null}
        </div>

        <nav className={cn("flex flex-1 flex-col gap-1", collapsed ? "px-2" : "px-3")}>
          {items.map(({ to, label, icon: Icon, badge, danger }) => {
            const link = (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                aria-label={label}
                className={cn(
                  "group flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:brand-gradient data-[status=active]:font-semibold data-[status=active]:text-brand-foreground",
                  collapsed ? "justify-center px-2" : "px-3",
                )}
              >
                <Icon className="size-[18px] shrink-0" />
                {!collapsed ? <span className="flex-1 truncate">{label}</span> : null}
                {!collapsed && badge ? (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      danger
                        ? "bg-danger/20 text-danger"
                        : "bg-secondary text-muted-foreground group-data-[status=active]:bg-brand-foreground/15 group-data-[status=active]:text-brand-foreground",
                    )}
                  >
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
            if (!collapsed) return link;
            return (
              <Tooltip key={to}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">
                  {label}
                  {badge ? ` · ${badge}` : ""}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="flex w-full items-center justify-center gap-2 border-t border-border px-3 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft
            className={cn("size-4 transition-transform duration-200", collapsed && "rotate-180")}
          />
          {!collapsed ? <span>Recolher</span> : null}
        </button>
      </aside>
    </TooltipProvider>
  );
}
