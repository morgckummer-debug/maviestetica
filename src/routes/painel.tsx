import { useEffect, useState } from "react";
import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { Lock, LogOut, Loader2 } from "lucide-react";
import { SITE_URL } from "@/data/services";
import { supabaseConfigurado } from "@/lib/supabase";
import { entrar, sair, sessaoValida, type Sessao } from "@/lib/painel";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [{ title: "Painel | MAVI" }, { name: "robots", content: "noindex, nofollow" }],
    links: [{ rel: "canonical", href: `${SITE_URL}/painel` }],
  }),
  component: PainelLayout,
});

function LoginForm({ onEntrar }: { onEntrar: (s: Sessao) => void }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const s = await entrar(email.trim(), senha);
      onEntrar(s);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
      setCarregando(false);
    }
  };

  return (
    <section className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-lavender-soft p-3">
              <Lock className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h1 className="font-display text-3xl text-primary">Painel MAVI</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acesso restrito à Marina.</p>
        </div>

        {!supabaseConfigurado() && (
          <div className="mb-5 rounded-xl border border-rose/40 bg-rose/10 px-4 py-3 text-sm text-rose">
            Supabase ainda não configurado. Defina as variáveis de ambiente
            <code className="mx-1">VITE_SUPABASE_URL</code> e
            <code className="mx-1">VITE_SUPABASE_ANON_KEY</code>.
          </div>
        )}

        <form onSubmit={submeter} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {erro && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Entrar
          </button>
        </form>
      </div>
    </section>
  );
}

function PainelLayout() {
  const [estado, setEstado] = useState<"carregando" | "logado" | "deslogado">("carregando");
  const [email, setEmail] = useState<string | undefined>();
  const navigate = useNavigate();

  useEffect(() => {
    let ativo = true;
    sessaoValida().then((s) => {
      if (!ativo) return;
      if (s) {
        setEmail(s.email);
        setEstado("logado");
      } else {
        setEstado("deslogado");
      }
    });
    return () => {
      ativo = false;
    };
  }, []);

  if (estado === "carregando") {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (estado === "deslogado") {
    return (
      <LoginForm
        onEntrar={(s) => {
          setEmail(s.email);
          setEstado("logado");
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">
      <header className="flex items-center justify-between gap-4 mb-8 pb-5 border-b border-border">
        <Link to="/painel" className="font-display text-2xl text-primary">
          Painel <span className="italic">MAVI</span>
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {email && <span className="text-muted-foreground hidden sm:inline">{email}</span>}
          <button
            type="button"
            onClick={() => {
              sair();
              setEstado("deslogado");
              navigate({ to: "/painel" });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 font-medium text-foreground/70 hover:border-primary/40 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
