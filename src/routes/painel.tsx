import { useEffect, useRef, useState } from "react";
import { createFileRoute, Outlet, useNavigate, Link } from "@tanstack/react-router";
import { Lock, LogOut, Loader2, KeyRound, Check, X, ChevronDown } from "lucide-react";
import { SITE_URL } from "@/data/services";
import { supabaseConfigurado } from "@/lib/supabase";
import { entrar, sair, sessaoValida, trocarSenha, type Sessao } from "@/lib/painel";

// Deriva um nome de exibição a partir do e-mail de login (ex.:
// "marina.figueiredo@..." → "Marina Figueiredo"), já que o login continua
// sendo por e-mail mas o cabeçalho fica mais pessoal mostrando um nome.
function nomeExibicao(email?: string): string {
  const local = email?.split("@")[0] ?? "";
  const partes = local
    .replace(/[._-]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return "Usuária";
  return partes.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [{ title: "Painel | MAVI" }, { name: "robots", content: "noindex, nofollow" }],
    links: [{ rel: "canonical", href: `${SITE_URL}/painel` }],
  }),
  component: PainelLayout,
});

function LoginForm({ onEntrar }: { onEntrar: (s: Sessao) => void }) {
  const USUARIAS = [
    { nome: "Morgana", email: "morgckummer@gmail.com" },
    { nome: "Marina", email: "morganamavi26@gmail.com" },
  ] as const;
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!email) {
      setErro("Selecione a usuária.");
      return;
    }
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
            <label className="block text-sm font-medium mb-2">Usuária</label>
            <select
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>')] bg-no-repeat bg-[right_1rem_center] pr-10"
            >
              <option value="" disabled>
                Selecione…
              </option>
              {USUARIAS.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              autoComplete="current-password"
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
            disabled={carregando || !email}
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

function TrocarSenhaForm({ onFechar }: { onFechar: () => void }) {
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const submeter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As senhas não coincidem.");
      return;
    }
    setSalvando(true);
    try {
      await trocarSenha(senha);
      setSucesso(true);
      setSenha("");
      setConfirmar("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível trocar a senha.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="rounded-2xl border border-lavender/50 bg-lavender-soft/40 p-5 mb-8">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-primary">Trocar senha</h3>
        </div>
        <button
          type="button"
          onClick={onFechar}
          title="Fechar"
          className="text-muted-foreground/60 hover:text-primary transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {sucesso ? (
        <p className="text-sm text-primary">Senha alterada com sucesso.</p>
      ) : (
        <form onSubmit={submeter} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Nova senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Confirmar nova senha
            </label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar
            </button>
            <button
              type="button"
              onClick={onFechar}
              disabled={salvando}
              className="rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/70 hover:border-primary/40 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function MenuUsuario({
  nome,
  onTrocarSenha,
  onSair,
}: {
  nome: string;
  onTrocarSenha: () => void;
  onSair: () => void;
}) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const fechar = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fechar);
    return () => document.removeEventListener("mousedown", fechar);
  }, [aberto]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1.5 sm:px-4 sm:py-2 text-sm font-medium text-foreground/70 hover:border-primary/40 transition-colors"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lavender-soft text-xs font-semibold text-primary">
          {nome.charAt(0).toUpperCase()}
        </span>
        <span className="hidden sm:inline">{nome}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`} />
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-card shadow-lg py-1.5 z-10">
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              onTrocarSenha();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground/80 hover:bg-lavender-soft/40 transition-colors"
          >
            <KeyRound className="h-4 w-4" />
            Trocar senha
          </button>
          <button
            type="button"
            onClick={() => {
              setAberto(false);
              onSair();
            }}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

function PainelLayout() {
  const [estado, setEstado] = useState<"carregando" | "logado" | "deslogado">("carregando");
  const [email, setEmail] = useState<string | undefined>();
  const [trocandoSenha, setTrocandoSenha] = useState(false);
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
        <div className="flex items-center gap-3 text-sm">
          <MenuUsuario
            nome={nomeExibicao(email)}
            onTrocarSenha={() => setTrocandoSenha(true)}
            onSair={() => {
              sair();
              setEstado("deslogado");
              navigate({ to: "/painel" });
            }}
          />
        </div>
      </header>
      {trocandoSenha && <TrocarSenhaForm onFechar={() => setTrocandoSenha(false)} />}
      <Outlet />
    </div>
  );
}
