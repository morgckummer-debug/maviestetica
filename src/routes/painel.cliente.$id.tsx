import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  AlertTriangle,
  Loader2,
  Camera,
  CameraOff,
  Check,
  ChevronRight,
  Trash2,
} from "lucide-react";
import { FICHAS, nomeTipo, nomeCurto } from "@/data/anamnese";
import { listarFichas, excluirFicha, type Ficha } from "@/lib/painel";
import { clientePorFichaId, type Cliente } from "@/lib/clientes";
import { mascaraTelefone } from "@/lib/mascaras";
import { HistoricoSessoes, type Procedimento } from "@/components/HistoricoSessoes";

export const Route = createFileRoute("/painel/cliente/$id")({
  component: PaginaCliente,
});

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function PaginaCliente() {
  const { id } = useParams({ from: "/painel/cliente/$id" });
  const navigate = useNavigate();
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [erroExcluir, setErroExcluir] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  useEffect(() => {
    listarFichas()
      .then(setFichas)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, []);

  const cliente: Cliente | null = useMemo(
    () => (fichas ? clientePorFichaId(fichas, id) : null),
    [fichas, id],
  );

  const excluirUmaFicha = async (f: Ficha) => {
    if (!window.confirm(`Excluir a ficha de ${nomeTipo(f.tipo)} desta cliente? Essa ação não pode ser desfeita.`))
      return;
    setExcluindoId(f.id);
    setErroExcluir(null);
    try {
      await excluirFicha(f.id);
      setFichas((prev) => (prev ?? []).filter((x) => x.id !== f.id));
      // Era a última ficha dessa cliente: não há mais o que mostrar aqui.
      if (cliente && cliente.fichas.length === 1) {
        navigate({ to: "/painel" });
      }
    } catch (e) {
      setErroExcluir(e instanceof Error ? e.message : "Erro ao excluir ficha.");
    } finally {
      setExcluindoId(null);
    }
  };

  // Alertas de todas as fichas, sem repetir.
  const alertas = useMemo(() => {
    if (!cliente) return [];
    const set = new Set<string>();
    cliente.fichas.forEach((f) => f.alertas?.forEach((a) => set.add(a)));
    return [...set];
  }, [cliente]);

  const procedimentos: Procedimento[] = useMemo(
    () =>
      cliente
        ? cliente.fichas.map((f) => ({ id: f.id, tipo: f.tipo, nome: f.nome, pacotes: f.pacotes ?? {} }))
        : [],
    [cliente],
  );

  if (!fichas && !erro) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="text-center py-16">
        <p className="text-destructive text-sm mb-4">{erro}</p>
        <Link to="/painel" className="text-primary underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Cliente não encontrada.</p>
        <Link to="/painel" className="text-primary underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  const bordaCard = cliente.algumMasculino ? "border-sky-400/50" : "border-border";

  return (
    <div>
      <Link
        to="/painel"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas as clientes
      </Link>

      {/* Cabeçalho da cliente */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {cliente.tipos.map((t) => (
            <span
              key={t}
              className="inline-block text-xs rounded-full bg-lavender-soft px-2.5 py-0.5 text-primary"
            >
              {FICHAS[t]?.emoji ?? ""} {nomeTipo(t)}
            </span>
          ))}
        </div>
        <h2 className="font-display text-3xl text-primary">{cliente.nome}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {cliente.telefone ? mascaraTelefone(cliente.telefone) : "sem telefone"}
          {" · "}
          {cliente.fichas.length} ficha(s)
        </p>
      </div>

      {alertas.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-rose/40 bg-rose/10 px-4 py-3.5 text-sm text-rose mb-6">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <ul className="space-y-1">
            {alertas.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Histórico de sessões unificado (o caderninho digital) */}
      <HistoricoSessoes fichas={procedimentos} nomeCliente={cliente.nome} />

      {/* Fichas da cliente — cada uma abre a ficha completa (anamnese/medidas) */}
      <div className="mt-8">
        <h3 className="font-display text-2xl text-primary mb-1">Fichas</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Abra a ficha para ver a anamnese completa e a avaliação.
        </p>
        {erroExcluir && <p className="text-sm text-destructive mb-4">{erroExcluir}</p>}
        <div className="space-y-3">
          {cliente.fichas.map((f) => (
            <div
              key={f.id}
              className={`flex items-center justify-between gap-4 rounded-2xl border ${bordaCard} bg-card px-5 py-4 transition-colors hover:border-primary/40`}
            >
              <Link to="/painel/$id" params={{ id: f.id }} className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs rounded-full bg-lavender-soft px-2 py-0.5 text-primary">
                    {FICHAS[f.tipo]?.emoji ?? ""} {nomeCurto(f.tipo)}
                  </span>
                  {f.arquivada && (
                    <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                      arquivada
                    </span>
                  )}
                  {f.alertas.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose/15 text-rose px-2 py-0.5 text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {f.alertas.length}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  enviada em {formatarData(f.created_at)}
                </p>
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`inline-flex items-center gap-1 text-xs ${
                    f.termo_aceito ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  Termo
                </span>
                {f.autoriza_foto ? (
                  <Camera className="h-4 w-4 text-lavender" />
                ) : (
                  <CameraOff className="h-4 w-4 text-muted-foreground/60" />
                )}
                <button
                  type="button"
                  onClick={() => excluirUmaFicha(f)}
                  disabled={excluindoId === f.id}
                  title="Excluir ficha"
                  className="text-muted-foreground/50 hover:text-destructive transition-colors disabled:opacity-40"
                >
                  {excluindoId === f.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
                <Link to="/painel/$id" params={{ id: f.id }} aria-label="Abrir ficha">
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
