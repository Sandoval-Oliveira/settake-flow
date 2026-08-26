import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Sprout,
  Contact,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";
import { usePipelineLeads, usePipelineVendas, useTarefasPendentesView } from "@/lib/crm-api";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: LucideIcon; badge?: string; danger?: boolean };

export function AppSidebar() {
  const { data: leads = [] } = usePipelineLeads();
  const { data: vendas = [] } = usePipelineVendas();
  const { data: tarefas = [] } = useTarefasPendentesView();

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
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[72px] flex-col border-r border-border bg-sidebar lg:w-[240px]">
      <div className="flex items-center gap-3 px-4 py-5 lg:px-5">
        <span className="brand-gradient flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold text-brand-foreground">
          SC
        </span>
        <span className="hidden flex-col leading-tight lg:flex">
          <span className="text-sm font-semibold text-foreground">SetTake</span>
          <span className="text-xs text-muted-foreground">CRM</span>
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2 lg:px-3">
        {items.map(({ to, label, icon: Icon, badge, danger }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/" }}
            className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:brand-gradient data-[status=active]:font-semibold data-[status=active]:text-brand-foreground"
          >
            <Icon className="size-[18px] shrink-0" />
            <span className="hidden flex-1 truncate lg:block">{label}</span>
            {badge ? (
              <span
                className={cn(
                  "hidden rounded-full px-2 py-0.5 text-[11px] font-semibold lg:block",
                  danger
                    ? "bg-danger/20 text-danger"
                    : "bg-secondary text-muted-foreground group-data-[status=active]:bg-brand-foreground/15 group-data-[status=active]:text-brand-foreground",
                )}
              >
                {badge}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <div className="hidden px-5 py-4 text-xs text-muted-foreground lg:block">SetTake CRM</div>
    </aside>
  );
}
