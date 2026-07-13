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
  Send,
  Trash2,
} from "lucide-react";
import { FICHAS, TIPOS, nomeTipo, nomeCurto } from "@/data/anamnese";
import { listarFichas, excluirFicha, type Ficha } from "@/lib/painel";
import { clientePorFichaId, type Cliente } from "@/lib/clientes";
import { mascaraTelefone } from "@/lib/mascaras";
import { HistoricoSessoes, type Procedimento } from "@/components/HistoricoSessoes";
import { EnviarFicha } from "@/components/EnviarFicha";

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
  const [enviandoFicha, setEnviandoFicha] = useState(false);

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

  // Sugere de cara um procedimento que a cliente ainda não tem ficha,
  // caso ela se interesse por outro tratamento.
  const tipoSugerido = cliente ? (TIPOS.find((t) => !cliente.tipos.includes(t)) ?? TIPOS[0]) : TIPOS[0];

  if (!fichas && !erro) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-painel-muted" />
      </div>
    );
  }

  if (erro) {
    return (
      <div className="text-center py-16">
        <p className="text-painel-alert-text text-sm mb-4">{erro}</p>
        <Link to="/painel" className="text-painel-primary underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-16">
        <p className="text-painel-muted mb-4">Cliente não encontrada.</p>
        <Link to="/painel" className="text-painel-primary underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  const bordaCard = cliente.algumMasculino ? "border-sky-400/50" : "border-painel-border";

  return (
    <div>
      <Link
        to="/painel"
        className="inline-flex items-center gap-2 text-[13px] text-painel-muted hover:text-painel-primary mb-7"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Todas as clientes
      </Link>

      {/* Cabeçalho da cliente */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2.5">
          {cliente.tipos.map((t) => (
            <span
              key={t}
              className="inline-block text-[11px] rounded-full bg-painel-badge-bg px-3 py-0.5 text-painel-primary"
            >
              {FICHAS[t]?.emoji ?? ""} {nomeTipo(t)}
            </span>
          ))}
        </div>
        <h2 className="font-display text-4xl text-painel-title">{cliente.nome}</h2>
        <p className="text-[13px] text-painel-muted mt-2">
          {cliente.telefone ? mascaraTelefone(cliente.telefone) : "sem telefone"}
          {" · "}
          {cliente.fichas.length} ficha(s)
        </p>
      </div>

      {alertas.length > 0 && (
        <div className="flex gap-3 rounded-[14px] border border-painel-alert-border bg-painel-alert-bg px-[22px] py-[18px] text-sm text-painel-alert-text mb-8">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <ul className="space-y-1">
            {alertas.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Histórico de sessões unificado (o caderninho digital) */}
      <HistoricoSessoes
        fichas={procedimentos}
        nomeCliente={cliente.nome}
        telefoneCliente={cliente.telefone}
      />

      {/* Fichas da cliente — cada uma abre a ficha completa (anamnese/medidas) */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="font-display text-2xl text-painel-title">Fichas</h3>
          {!enviandoFicha && (
            <button
              type="button"
              onClick={() => setEnviandoFicha(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-painel-primary text-white px-[18px] py-2.5 text-sm font-semibold hover:bg-painel-primary/90 transition-colors"
            >
              <Send className="h-4 w-4" />
              Enviar ficha
            </button>
          )}
        </div>
        <p className="text-sm text-painel-muted mb-4">
          Abra a ficha para ver a anamnese completa e a avaliação. Interessou por outro
          procedimento? Envie uma nova ficha pra ela preencher.
        </p>

        {enviandoFicha && (
          <EnviarFicha
            nomeInicial={cliente.nome}
            celularInicial={cliente.telefone}
            tipoInicial={tipoSugerido}
            convitePadrao
            onFechar={() => setEnviandoFicha(false)}
          />
        )}

        {erroExcluir && <p className="text-sm text-painel-alert-text mb-4">{erroExcluir}</p>}
        <div className="space-y-3">
          {cliente.fichas.map((f) => (
            <div
              key={f.id}
              className={`flex items-center justify-between gap-4 rounded-[14px] border ${bordaCard} bg-white px-6 py-5 transition-colors hover:border-painel-primary/40`}
            >
              <Link to="/painel/$id" params={{ id: f.id }} className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] rounded-full bg-painel-badge-bg px-2.5 py-0.5 text-painel-primary">
                    {FICHAS[f.tipo]?.emoji ?? ""} {nomeCurto(f.tipo)}
                  </span>
                  {f.arquivada && (
                    <span className="text-xs rounded-full bg-painel-badge-bg px-2 py-0.5 text-painel-muted">
                      arquivada
                    </span>
                  )}
                  {f.alertas.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-painel-alert-bg text-painel-alert-text px-2 py-0.5 text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" />
                      {f.alertas.length}
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-painel-muted-2 mt-1.5">
                  enviada em {formatarData(f.created_at)}
                </p>
              </Link>
              <div className="flex items-center gap-3.5 shrink-0">
                <span
                  className={`inline-flex items-center gap-1 text-xs ${
                    f.termo_aceito ? "text-painel-primary" : "text-painel-muted"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  Termo
                </span>
                {f.autoriza_foto ? (
                  <Camera className="h-4 w-4 text-painel-gold" />
                ) : (
                  <CameraOff className="h-4 w-4 text-painel-icon-muted" />
                )}
                <button
                  type="button"
                  onClick={() => excluirUmaFicha(f)}
                  disabled={excluindoId === f.id}
                  title="Excluir ficha"
                  className="text-painel-icon-muted hover:text-painel-alert-text transition-colors disabled:opacity-40"
                >
                  {excluindoId === f.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
                <Link to="/painel/$id" params={{ id: f.id }} aria-label="Abrir ficha">
                  <ChevronRight className="h-4 w-4 text-painel-icon-muted" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
