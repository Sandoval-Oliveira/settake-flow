import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { ConfirmDeleteDialog } from "@/components/crm/ConfirmDeleteDialog";
import { EmptyState, Field, SelectField, SoftBadge, WhatsAppButton } from "@/components/crm/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteRecord, usePessoas, usePromotoresResumo, useSaveRecord } from "@/lib/crm-api";
import { useAuth } from "@/lib/auth";
import type { Promotor, PromotorResumo } from "@/lib/crm-types";
import { formatDate, formatMoney, initials, maskWhatsapp, whatsappLink } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/promotores")({
  head: () => ({
    meta: [
      { title: "Promotores | SetTake CRM" },
      {
        name: "description",
        content: "Programa de indicação: promotores, metas, prazos e receita gerada pelas indicações.",
      },
    ],
  }),
  component: PromotoresPage,
});

/* --------------------------------- helpers -------------------------------- */

type Filtro = "ativos" | "todos" | "inativos";

function statusPromotor(p: PromotorResumo): { label: string; tone: "ok" | "warn" | "danger" | "muted" } {
  if (!p.ativo) return { label: "Inativo", tone: "muted" };
  const pct = Number(p.pct_meta ?? 0);
  if (p.meta_indicacoes > 0 && pct >= 100) return { label: "Meta atingida", tone: "ok" };
  if (p.dias_restantes != null && p.dias_restantes < 0) return { label: "Prazo vencido", tone: "danger" };
  if (p.dias_restantes != null && p.dias_restantes <= 15) return { label: `${p.dias_restantes}d restantes`, tone: "warn" };
  return { label: "Em andamento", tone: "ok" };
}

const TONE: Record<string, string> = {
  ok: "border-success/30 bg-success/10 text-success",
  warn: "border-amber-300 bg-amber-50 text-amber-800",
  danger: "border-danger/30 bg-danger/10 text-danger",
  muted: "border-border bg-secondary text-muted-foreground",
};

function Progresso({ pct, tone }: { pct: number; tone: string }) {
  const w = Math.min(100, Math.max(pct, 0));
  return (
    <div className="h-2 overflow-hidden rounded-full bg-secondary">
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500 ease-out",
          tone === "ok" ? "brand-gradient" : tone === "danger" ? "bg-danger" : tone === "warn" ? "bg-amber-400" : "bg-border",
        )}
        style={{ width: `${Math.max(w, 2)}%` }}
      />
    </div>
  );
}

/* ------------------------------ card do promotor --------------------------- */

function PromotorCard({
  p,
  isGestao,
  onEdit,
  onDelete,
}: {
  p: PromotorResumo;
  isGestao: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const st = statusPromotor(p);
  const pct = Number(p.pct_meta ?? 0);
  const indic = p.indicacoes ?? 0;
  const conv = p.clientes_convertidos ?? 0;

  return (
    <article
      className={cn(
        "group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md",
        !p.ativo && "opacity-70",
      )}
    >
      <header className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-foreground">
          {initials(p.nome)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">{p.nome}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {p.empresa ? `${p.empresa} · ` : ""}
            {p.prazo_fim ? `até ${formatDate(p.prazo_fim)}` : "sem prazo definido"}
          </p>
        </div>
        <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium", TONE[st.tone])}>
          {st.label}
        </span>
      </header>

      <div>
        <div className="mb-1.5 flex items-baseline justify-between text-xs">
          <span className="text-muted-foreground">Indicações</span>
          <span className="font-semibold text-foreground">
            {indic}
            {p.meta_indicacoes > 0 ? (
              <span className="text-muted-foreground"> / {p.meta_indicacoes}</span>
            ) : null}
            {p.meta_indicacoes > 0 ? <span className="ml-2 text-brand">{pct.toFixed(0)}%</span> : null}
          </span>
        </div>
        <Progresso pct={p.meta_indicacoes > 0 ? pct : 0} tone={st.tone} />
        {p.meta_indicacoes > 0 && (p.faltam ?? 0) > 0 ? (
          <p className="mt-1 text-[11px] text-muted-foreground">Faltam {p.faltam} para a meta</p>
        ) : null}
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg bg-secondary/60 px-2 py-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Convertidos</dt>
          <dd className="text-sm font-bold text-foreground">{conv}</dd>
        </div>
        <div className="rounded-lg bg-secondary/60 px-2 py-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Receita</dt>
          <dd className="text-sm font-bold text-success" title="Receitas concluídas dos clientes indicados">
            {formatMoney(p.receita_gerada ?? 0)}
          </dd>
        </div>
        <div className="rounded-lg bg-secondary/60 px-2 py-2">
          <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">Previsto</dt>
          <dd className="text-sm font-bold text-brand" title="Oportunidades abertas de clientes indicados">
            {formatMoney(p.receita_prevista ?? 0)}
          </dd>
        </div>
      </dl>

      <footer className="flex items-center gap-2">
        <WhatsAppButton href={whatsappLink(p.whatsapp)} />
        {p.email ? (
          <a href={`mailto:${p.email}`} className="truncate text-xs text-muted-foreground hover:text-foreground">
            {p.email}
          </a>
        ) : null}
        <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button variant="ghost" size="icon" className="size-8" onClick={onEdit} aria-label="Editar">
            <Pencil className="size-4" />
          </Button>
          {isGestao ? (
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-danger hover:text-danger"
              onClick={onDelete}
              aria-label="Excluir"
            >
              <Trash2 className="size-4" />
            </Button>
          ) : null}
        </div>
      </footer>
    </article>
  );
}

/* ---------------------------------- dialog -------------------------------- */

type Form = {
  nome: string;
  whatsapp: string;
  email: string;
  pessoa_id: string | null;
  meta_indicacoes: string;
  prazo_inicio: string;
  prazo_fim: string;
  ativo: boolean;
  observacoes: string;
};

const EMPTY: Form = {
  nome: "",
  whatsapp: "",
  email: "",
  pessoa_id: null,
  meta_indicacoes: "10",
  prazo_inicio: new Date().toISOString().slice(0, 10),
  prazo_fim: "",
  ativo: true,
  observacoes: "",
};

function PromotorDialog({
  open,
  onOpenChange,
  promotor,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  promotor?: Promotor | null;
}) {
  const [form, setForm] = useState<Form>(EMPTY);
  const { data: pessoas = [] } = usePessoas();
  const save = useSaveRecord(promotor ? "Promotor atualizado" : "Promotor cadastrado");

  useEffect(() => {
    if (!open) return;
    setForm(
      promotor
        ? {
            nome: promotor.nome,
            whatsapp: maskWhatsapp(promotor.whatsapp ?? ""),
            email: promotor.email ?? "",
            pessoa_id: promotor.pessoa_id != null ? String(promotor.pessoa_id) : null,
            meta_indicacoes: String(promotor.meta_indicacoes ?? 0),
            prazo_inicio: promotor.prazo_inicio ?? EMPTY.prazo_inicio,
            prazo_fim: promotor.prazo_fim ?? "",
            ativo: promotor.ativo,
            observacoes: promotor.observacoes ?? "",
          }
        : EMPTY,
    );
  }, [open, promotor]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const clientes = useMemo(
    () => pessoas.filter((p) => p.tipo === "Cliente").map((p) => ({ value: String(p.id), label: p.nome })),
    [pessoas],
  );

  function vincularCliente(v: string | null) {
    set("pessoa_id", v);
    const pessoa = pessoas.find((p) => String(p.id) === v);
    if (pessoa && !form.nome.trim()) {
      setForm((f) => ({
        ...f,
        pessoa_id: v,
        nome: pessoa.nome,
        whatsapp: pessoa.whatsapp ? maskWhatsapp(pessoa.whatsapp) : f.whatsapp,
        email: pessoa.email ?? f.email,
      }));
    }
  }

  function submit() {
    if (!form.nome.trim()) return;
    save.mutate(
      {
        table: "crm_promotores",
        id: promotor?.id ? String(promotor.id) : null,
        values: {
          nome: form.nome.trim(),
          whatsapp: form.whatsapp.replace(/\D/g, "") || null,
          email: form.email.trim() || null,
          pessoa_id: form.pessoa_id ? Number(form.pessoa_id) : null,
          meta_indicacoes: Math.max(0, Number(form.meta_indicacoes) || 0),
          prazo_inicio: form.prazo_inicio || EMPTY.prazo_inicio,
          prazo_fim: form.prazo_fim || null,
          ativo: form.ativo,
          observacoes: form.observacoes.trim() || null,
        },
      },
      { onSuccess: () => onOpenChange(false) },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{promotor ? "Editar promotor" : "Novo promotor"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente vinculado (opcional)" className="sm:col-span-2">
            <SelectField value={form.pessoa_id} onChange={vincularCliente} options={clientes} />
          </Field>
          <Field label="Nome *" className="sm:col-span-2">
            <Input value={form.nome} onChange={(e) => set("nome", e.target.value)} />
          </Field>
          <Field label="WhatsApp">
            <Input
              value={form.whatsapp}
              onChange={(e) => set("whatsapp", maskWhatsapp(e.target.value))}
              placeholder="(00) 00000-0000"
            />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </Field>
          <Field label="Meta de indicações">
            <Input
              type="number"
              min={0}
              value={form.meta_indicacoes}
              onChange={(e) => set("meta_indicacoes", e.target.value)}
            />
          </Field>
          <Field label="Ativo">
            <div className="flex h-10 items-center gap-3">
              <Switch checked={form.ativo} onCheckedChange={(v) => set("ativo", v)} />
              <span className="text-sm text-muted-foreground">{form.ativo ? "Participando" : "Pausado"}</span>
            </div>
          </Field>
          <Field label="Início do prazo">
            <Input type="date" value={form.prazo_inicio} onChange={(e) => set("prazo_inicio", e.target.value)} />
          </Field>
          <Field label="Fim do prazo">
            <Input type="date" value={form.prazo_fim} onChange={(e) => set("prazo_fim", e.target.value)} />
          </Field>
          <Field label="Observações" className="sm:col-span-2">
            <Textarea
              rows={3}
              value={form.observacoes}
              onChange={(e) => set("observacoes", e.target.value)}
              placeholder="Combinado de recompensa, contexto da parceria…"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={submit}
            disabled={save.isPending || !form.nome.trim()}
            className="brand-gradient font-semibold text-brand-foreground"
          >
            {promotor ? "Salvar" : "Cadastrar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ----------------------------------- page --------------------------------- */

function PromotoresPage() {
  const { role } = useAuth();
  const isGestao = role === "admin" || role === "socio";
  const { data: lista = [], isLoading } = usePromotoresResumo();
  const excluir = useDeleteRecord("Promotor excluído");

  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("ativos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PromotorResumo | null>(null);
  const [remover, setRemover] = useState<PromotorResumo | null>(null);

  const items = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista
      .filter((p) => (filtro === "todos" ? true : filtro === "ativos" ? p.ativo : !p.ativo))
      .filter((p) => !q || p.nome.toLowerCase().includes(q) || (p.empresa ?? "").toLowerCase().includes(q));
  }, [lista, busca, filtro]);

  const totais = useMemo(() => {
    const ativos = lista.filter((p) => p.ativo);
    return {
      ativos: ativos.length,
      indicacoes: ativos.reduce((s, p) => s + (p.indicacoes ?? 0), 0),
      convertidos: ativos.reduce((s, p) => s + (p.clientes_convertidos ?? 0), 0),
      receita: ativos.reduce((s, p) => s + Number(p.receita_gerada ?? 0), 0),
      metaBatida: ativos.filter((p) => p.meta_indicacoes > 0 && Number(p.pct_meta ?? 0) >= 100).length,
    };
  }, [lista]);

  return (
    <>
      <PageHeader
        title="Promotores"
        subtitle="Programa de indicação — quem indica, quanto falta para a meta e o que já virou receita."
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar promotor"
                className="w-56 pl-9"
              />
            </div>
            <div className="flex rounded-lg border border-border bg-card p-0.5 text-xs">
              {(["ativos", "todos", "inativos"] as Filtro[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFiltro(f)}
                  className={cn(
                    "rounded-md px-3 py-1.5 capitalize transition-colors",
                    filtro === f ? "bg-secondary font-semibold text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
            <Button
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
              className="brand-gradient font-semibold text-brand-foreground"
            >
              <Plus className="size-4" /> Novo promotor
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Promotores ativos" value={String(totais.ativos)} hint={`${totais.metaBatida} com meta atingida`} />
        <Kpi label="Indicações" value={String(totais.indicacoes)} hint="leads + clientes indicados" />
        <Kpi
          label="Convertidos"
          value={String(totais.convertidos)}
          hint={totais.indicacoes ? `${Math.round((totais.convertidos / totais.indicacoes) * 100)}% de conversão` : undefined}
          tone="accent"
        />
        <Kpi label="Receita gerada" value={formatMoney(totais.receita)} hint="receitas concluídas" tone="positivo" />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10">
          <EmptyState
            icon="📣"
            message={
              lista.length === 0
                ? "Nenhum promotor cadastrado. Cadastre quem indica clientes para acompanhar metas e receita."
                : "Nenhum promotor encontrado com esse filtro."
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((p) => (
            <PromotorCard
              key={p.id}
              p={p}
              isGestao={isGestao}
              onEdit={() => {
                setEditing(p);
                setDialogOpen(true);
              }}
              onDelete={() => setRemover(p)}
            />
          ))}
        </div>
      )}

      <PromotorDialog open={dialogOpen} onOpenChange={setDialogOpen} promotor={editing} />

      <ConfirmDeleteDialog
        open={Boolean(remover)}
        onOpenChange={(v) => !v && setRemover(null)}
        title="Excluir promotor?"
        description={`"${remover?.nome ?? ""}" será removido. Leads e clientes indicados por ele continuam existindo, apenas perdem o vínculo com o promotor.`}
        loading={excluir.isPending}
        onConfirm={() => {
          if (!remover) return;
          excluir.mutate(
            { table: "crm_promotores", id: String(remover.id) },
            { onSuccess: () => setRemover(null) },
          );
        }}
      />
    </>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone = "neutro",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutro" | "accent" | "positivo";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold",
          tone === "accent" ? "text-brand" : tone === "positivo" ? "text-success" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
