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
  Settings,
  UserCog,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PAPEL_LABEL, useAuth, type Papel } from "@/lib/auth";
import { cn } from "@/lib/utils";

type Item = { to: string; label: string; icon: LucideIcon; papeis?: Papel[] };

const ITENS_PRINCIPAIS: Item[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/vendas", label: "Vendas", icon: Briefcase },
  { to: "/nutricao", label: "Nutrição", icon: Sprout },
  { to: "/contatos", label: "Contatos", icon: Contact },
  { to: "/tarefas", label: "Tarefas", icon: CheckSquare },
];

const ITENS_GESTAO: Item[] = [
  { to: "/configuracoes", label: "Configurações", icon: Settings, papeis: ["admin", "socio"] },
  { to: "/usuarios", label: "Usuários", icon: UserCog, papeis: ["admin"] },
];

const LINK_CLASS =
  "group flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:brand-gradient data-[status=active]:font-semibold data-[status=active]:text-brand-foreground";

export function AppSidebar() {
  const [collapsed, setCollapsed] = useLocalStorage("crm-sidebar-collapsed", false);
  const { profile, user, role, signOut } = useAuth();

  useEffect(() => {
    document.documentElement.style.setProperty("--sidebar-w", collapsed ? "60px" : "240px");
  }, [collapsed]);

  const podeVer = (item: Item) => !item.papeis || (role !== null && item.papeis.includes(role));
  const itensGestao = ITENS_GESTAO.filter(podeVer);

  const nome = profile?.nome?.trim() || user?.email?.split("@")[0] || "Usuário";
  const iniciais = nome
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const renderLink = ({ to, label, icon: Icon }: Item) => {
    const link = (
      <Link
        key={to}
        to={to}
        activeOptions={{ exact: to === "/" }}
        aria-label={label}
        className={cn(LINK_CLASS, collapsed ? "justify-center px-2" : "px-3")}
      >
        <Icon className="size-[18px] shrink-0" />
        {!collapsed ? <span className="flex-1 truncate">{label}</span> : null}
      </Link>
    );
    if (!collapsed) return link;
    return (
      <Tooltip key={to}>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside
        className="fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-in-out"
        style={{ width: collapsed ? "60px" : "240px" }}
      >
        <div className={cn("flex items-center gap-3 py-5", collapsed ? "justify-center px-2" : "px-5")}>
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
          {ITENS_PRINCIPAIS.map(renderLink)}
        </nav>

        {itensGestao.length > 0 ? (
          <div className={cn("flex flex-col gap-1 border-t border-border py-2", collapsed ? "px-2" : "px-3")}>
            {itensGestao.map(renderLink)}
          </div>
        ) : null}

        <div className={cn("border-t border-border py-3", collapsed ? "px-2" : "px-3")}>
          <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "px-1")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
                  {iniciais || "?"}
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">
                {nome}
                {role ? ` · ${PAPEL_LABEL[role]}` : ""}
              </TooltipContent>
            </Tooltip>
            {!collapsed ? (
              <span className="flex min-w-0 flex-1 flex-col leading-tight">
                <span className="truncate text-sm font-medium text-foreground">{nome}</span>
                {role ? (
                  <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {PAPEL_LABEL[role]}
                  </span>
                ) : null}
              </span>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  aria-label="Sair"
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <LogOut className="size-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Sair</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          className="absolute -right-3 top-6 flex size-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <ChevronLeft className={cn("size-3.5 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
    </TooltipProvider>
  );
}
