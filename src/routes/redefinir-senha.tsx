import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { mensagemAuthPtBr } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/crm/primitives";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — SetTake CRM" },
      { name: "description", content: "Defina uma nova senha para acessar o SetTake CRM." },
      { property: "og:title", content: "Redefinir senha — SetTake CRM" },
      { property: "og:description", content: "Crie uma nova senha de acesso ao SetTake CRM." },
    ],
  }),
  component: RedefinirSenhaPage,
});

function RedefinirSenhaPage() {
  const [pronto, setPronto] = useState(false);
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setPronto(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setPronto(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 8) {
      setErro("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== confirmacao) {
      setErro("As senhas não coincidem.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) {
      setErro(mensagemAuthPtBr(error.message));
      return;
    }
    toast.success("Senha atualizada.");
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-7 shadow-lg">
        <h1 className="text-lg font-semibold text-foreground">Nova senha</h1>
        {!pronto ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Abra esta página pelo link enviado no seu e-mail para definir uma nova senha.
          </p>
        ) : (
          <form onSubmit={salvar} className="mt-6 flex flex-col gap-4">
            <Field label="Nova senha">
              <Input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Mínimo 8 caracteres"
              />
            </Field>
            <Field label="Confirmar senha">
              <Input
                type="password"
                required
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
              />
            </Field>
            {erro ? (
              <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {erro}
              </p>
            ) : null}
            <Button type="submit" disabled={enviando} className="brand-gradient text-brand-foreground">
              {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
              {enviando ? "Salvando..." : "Salvar senha"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
