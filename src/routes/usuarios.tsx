import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Copy, KeyRound, Loader2, Pencil, Plus, RefreshCw, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/crm/PageHeader";
import { Field } from "@/components/crm/primitives";
import { ConfirmDeleteDialog } from "@/components/crm/ConfirmDeleteDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PAPEL_LABEL, useAuth, type Papel } from "@/lib/auth";
import {
  alterarStatusUsuario,
  atualizarUsuario,
  criarUsuario,
  definirSenhaTemporaria,
  enviarEmailRedefinicao,
  listarUsuarios,
} from "@/lib/usuarios.functions";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — SetTake CRM" },
      {
        name: "description",
        content: "Gestão de usuários, papéis e acessos do SetTake CRM (somente administradores).",
      },
      { property: "og:title", content: "Usuários — SetTake CRM" },
      { property: "og:description", content: "Crie e administre acessos ao SetTake CRM." },
    ],
  }),
  component: UsuariosPage,
});

type UsuarioRow = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criado_em: string | null;
  role: Papel | null;
};

function gerarSenha(tamanho = 12) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint32Array(tamanho);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    toast.success("Copiado.");
  } catch {
    toast.error("Não foi possível copiar.");
  }
}

const PAPEIS: Papel[] = ["vendedor", "socio", "admin"];

function PapelBadge({ role }: { role: Papel | null }) {
  if (!role) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
        role === "admin" && "bg-brand/15 text-brand",
        role === "socio" && "bg-success/15 text-success",
        role === "vendedor" && "bg-secondary text-muted-foreground",
      )}
    >
      {PAPEL_LABEL[role]}
    </span>
  );
}

function UsuariosPage() {
  const { isAdmin, user, loading } = useAuth();
  const qc = useQueryClient();
  const listar = useServerFn(listarUsuarios);
  const criar = useServerFn(criarUsuario);
  const atualizar = useServerFn(atualizarUsuario);
  const status = useServerFn(alterarStatusUsuario);
  const senhaTemp = useServerFn(definirSenhaTemporaria);
  const emailReset = useServerFn(enviarEmailRedefinicao);

  const usuarios = useQuery({
    queryKey: ["usuarios"],
    queryFn: () => listar() as Promise<UsuarioRow[]>,
    enabled: isAdmin,
  });

  const [novo, setNovo] = useState(false);
  const [editar, setEditar] = useState<UsuarioRow | null>(null);
  const [desativar, setDesativar] = useState<UsuarioRow | null>(null);
  const [senhaGerada, setSenhaGerada] = useState<string | null>(null);

  const invalidar = () => qc.invalidateQueries({ queryKey: ["usuarios"] });

  const mCriar = useMutation({
    mutationFn: (v: { nome: string; email: string; role: Papel; senha: string }) =>
      criar({ data: v }),
    onSuccess: () => {
      toast.success("Usuário criado.");
      setNovo(false);
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mEditar = useMutation({
    mutationFn: (v: { id: string; nome: string; role: Papel }) => atualizar({ data: v }),
    onSuccess: () => {
      toast.success("Usuário atualizado.");
      setEditar(null);
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mStatus = useMutation({
    mutationFn: (v: { id: string; ativo: boolean }) => status({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(v.ativo ? "Usuário reativado." : "Usuário desativado.");
      invalidar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const mSenha = useMutation({
    mutationFn: (v: { id: string; senha: string }) => senhaTemp({ data: v }),
    onSuccess: (_d, v) => setSenhaGerada(v.senha),
    onError: (e: Error) => toast.error(e.message),
  });

  const mEmail = useMutation({
    mutationFn: (v: { email: string }) =>
      emailReset({ data: { email: v.email, origem: window.location.origin } }),
    onSuccess: () => toast.success("E-mail de redefinição enviado."),
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => usuarios.data ?? [], [usuarios.data]);

  if (loading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  if (!isAdmin) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <h1 className="text-lg font-semibold text-foreground">Sem permissão</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Apenas administradores podem gerenciar usuários.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Usuários"
        subtitle="Crie acessos, defina papéis e controle quem usa o CRM."
        action={
          <Button onClick={() => setNovo(true)} className="brand-gradient text-brand-foreground">
            <Plus className="size-4" /> Novo usuário
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Nome</th>
              <th className="px-4 py-2.5 text-left font-medium">E-mail</th>
              <th className="px-4 py-2.5 text-left font-medium">Papel</th>
              <th className="px-4 py-2.5 text-left font-medium">Status</th>
              <th className="px-4 py-2.5 text-left font-medium">Criado em</th>
              <th className="px-4 py-2.5 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto size-4 animate-spin" />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="px-4 py-2.5 font-medium text-foreground">{u.nome || "—"}</td>
                  <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-2.5">
                    <PapelBadge role={u.role} />
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("text-xs font-medium", u.ativo ? "text-success" : "text-danger")}>
                      {u.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">
                    {u.criado_em ? formatDateTime(u.criado_em) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Ações
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => setEditar(u)}>
                          <Pencil className="size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => mSenha.mutate({ id: u.id, senha: gerarSenha() })}
                        >
                          <KeyRound className="size-4" /> Gerar senha temporária
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => mEmail.mutate({ email: u.email })}>
                          <RefreshCw className="size-4" /> Enviar e-mail de redefinição
                        </DropdownMenuItem>
                        {u.ativo ? (
                          <DropdownMenuItem
                            className="text-danger focus:text-danger"
                            disabled={u.id === user?.id}
                            onClick={() => setDesativar(u)}
                          >
                            <ShieldOff className="size-4" /> Desativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => mStatus.mutate({ id: u.id, ativo: true })}>
                            <ShieldOff className="size-4" /> Reativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <NovoUsuarioDialog
        open={novo}
        onOpenChange={setNovo}
        salvando={mCriar.isPending}
        onSave={(v) => mCriar.mutate(v)}
      />

      <EditarUsuarioDialog
        usuario={editar}
        souEu={editar?.id === user?.id}
        salvando={mEditar.isPending}
        onOpenChange={(o) => !o && setEditar(null)}
        onSave={(v) => mEditar.mutate(v)}
      />

      <ConfirmDeleteDialog
        open={Boolean(desativar)}
        onOpenChange={(o) => !o && setDesativar(null)}
        title="Desativar usuário?"
        description={`${desativar?.nome || desativar?.email || "O usuário"} perderá o acesso ao CRM imediatamente.`}
        confirmLabel="Desativar"
        onConfirm={() => {
          if (desativar) mStatus.mutate({ id: desativar.id, ativo: false });
          setDesativar(null);
        }}
      />

      <Dialog open={Boolean(senhaGerada)} onOpenChange={(o) => !o && setSenhaGerada(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Senha temporária</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Copie e envie a senha ao usuário. Ela não será exibida novamente.
          </p>
          <div className="flex items-center gap-2">
            <Input readOnly value={senhaGerada ?? ""} className="font-mono" />
            <Button variant="secondary" onClick={() => senhaGerada && copiar(senhaGerada)}>
              <Copy className="size-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setSenhaGerada(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PapelSelect({ value, onChange }: { value: Papel; onChange: (v: Papel) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as Papel)}>
      <SelectTrigger className="bg-background">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PAPEIS.map((p) => (
          <SelectItem key={p} value={p}>
            {PAPEL_LABEL[p]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NovoUsuarioDialog({
  open,
  onOpenChange,
  onSave,
  salvando,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (v: { nome: string; email: string; role: Papel; senha: string }) => void;
  salvando: boolean;
}) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Papel>("vendedor");
  const [senha, setSenha] = useState(() => gerarSenha());

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setNome("");
          setEmail("");
          setRole("vendedor");
          setSenha(gerarSenha());
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Nome">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Field label="E-mail">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Papel">
            <PapelSelect value={role} onChange={setRole} />
          </Field>
          <Field label="Senha inicial">
            <div className="flex items-center gap-2">
              <Input value={senha} onChange={(e) => setSenha(e.target.value)} className="font-mono" />
              <Button type="button" variant="secondary" onClick={() => setSenha(gerarSenha())}>
                <RefreshCw className="size-4" />
              </Button>
              <Button type="button" variant="secondary" onClick={() => copiar(senha)}>
                <Copy className="size-4" />
              </Button>
            </div>
          </Field>
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="brand-gradient text-brand-foreground"
            disabled={salvando || nome.trim().length < 2 || !email.includes("@") || senha.length < 8}
            onClick={() => onSave({ nome, email, role, senha })}
          >
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null} Criar usuário
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditarUsuarioDialog({
  usuario,
  souEu,
  onOpenChange,
  onSave,
  salvando,
}: {
  usuario: UsuarioRow | null;
  souEu: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (v: { id: string; nome: string; role: Papel }) => void;
  salvando: boolean;
}) {
  const [nome, setNome] = useState("");
  const [role, setRole] = useState<Papel>("vendedor");
  const [carregado, setCarregado] = useState<string | null>(null);

  if (usuario && carregado !== usuario.id) {
    setCarregado(usuario.id);
    setNome(usuario.nome);
    setRole(usuario.role ?? "vendedor");
  }

  return (
    <Dialog open={Boolean(usuario)} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field label="Nome">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Field label="Papel">
            <PapelSelect value={role} onChange={setRole} />
          </Field>
          {souEu ? (
            <p className="text-xs text-muted-foreground">
              Você não pode alterar o seu próprio papel de administrador.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="brand-gradient text-brand-foreground"
            disabled={salvando || nome.trim().length < 2 || (souEu && role !== "admin")}
            onClick={() => usuario && onSave({ id: usuario.id, nome, role })}
          >
            {salvando ? <Loader2 className="size-4 animate-spin" /> : null} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
