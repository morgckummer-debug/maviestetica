import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, Loader2, Send } from "lucide-react";
import { FICHAS, TIPOS, nomeTipo, nomeCurto } from "@/data/anamnese";
import { listarFichas, type Ficha } from "@/lib/painel";
import { clientePorFichaId, type Cliente } from "@/lib/clientes";
import { mascaraTelefone } from "@/lib/mascaras";
import { HistoricoSessoes, type Procedimento } from "@/components/HistoricoSessoes";
import { EnviarFicha } from "@/components/EnviarFicha";
import { RamosWatermark } from "@/components/RamosWatermark";

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
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
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
        ? cliente.fichas.map((f) => ({
            id: f.id,
            tipo: f.tipo,
            nome: f.nome,
            pacotes: f.pacotes ?? {},
          }))
        : [],
    [cliente],
  );

  // Sugere de cara um procedimento que a cliente ainda não tem ficha,
  // caso ela se interesse por outro tratamento.
  const tipoSugerido = cliente
    ? (TIPOS.find((t) => !cliente.tipos.includes(t)) ?? TIPOS[0])
    : TIPOS[0];

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

  const bordaCard = cliente.algumMasculino ? "border-sky-600" : "border-painel-border";
  const pillCliente = cliente.algumMasculino
    ? "bg-sky-600 text-white"
    : "bg-painel-badge-bg text-painel-primary";

  return (
    <div>
      <RamosWatermark className="fixed -right-14 top-24 hidden h-[75vh] max-h-[640px] w-auto opacity-[0.05] sm:block" />
      <div className="relative z-10">
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
                className={`inline-block text-[11px] rounded-full px-3 py-0.5 ${pillCliente}`}
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

        {/* Fichas da cliente — cada uma abre a ficha completa (anamnese/medidas) */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
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

          <div
            className={`flex flex-wrap gap-2 rounded-[14px] border ${bordaCard} bg-white p-5 sm:p-6`}
          >
            {cliente.fichas.map((f) => (
              <Link
                key={f.id}
                to="/painel/$id"
                params={{ id: f.id }}
                title={`${nomeTipo(f.tipo)} · enviada em ${formatarData(f.created_at)}`}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-90 ${pillCliente} ${
                  f.arquivada ? "opacity-60" : ""
                }`}
              >
                <span>{FICHAS[f.tipo]?.emoji ?? ""}</span>
                <span>{nomeCurto(f.tipo)}</span>
                <span className="opacity-70">{formatarData(f.created_at).slice(0, 5)}</span>
                {f.alertas.length > 0 && (
                  <span className="inline-flex items-center justify-center h-4 min-w-4 rounded-full bg-white/90 px-1 text-[10px] font-bold text-painel-alert-text">
                    {f.alertas.length}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Histórico de sessões unificado (o caderninho digital) */}
        <div className="mt-8">
          <HistoricoSessoes
            fichas={procedimentos}
            nomeCliente={cliente.nome}
            telefoneCliente={cliente.telefone}
          />
        </div>
      </div>
    </div>
  );
}
