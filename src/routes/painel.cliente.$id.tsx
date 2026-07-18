import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useParams, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  AlertTriangle,
  Archive,
  FileSignature,
  Loader2,
  Send,
  Trash2,
} from "lucide-react";
import { TIPOS, getFicha, ehTipo, nomeTipo, nomeCurto, type Tipo } from "@/data/anamnese";
import { listarFichas, excluirFicha, excluirFichaDefinitivamente, type Ficha } from "@/lib/painel";
import { clientePorFichaId, type Cliente } from "@/lib/clientes";
import { mascaraTelefone } from "@/lib/mascaras";
import { HistoricoSessoes, type Procedimento } from "@/components/HistoricoSessoes";
import { EnviarFicha } from "@/components/EnviarFicha";
import { RamosWatermark } from "@/components/RamosWatermark";
import { PainelModal } from "@/components/PainelModal";

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
  const [enviandoFicha, setEnviandoFicha] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  // null = nada em andamento; senão, qual das duas opções está sendo salva.
  const [excluindo, setExcluindo] = useState<"arquivar" | "definitivo" | null>(null);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

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

  // A ficha de Cadastro não é procedimento — não entra no histórico de
  // sessões/pacotes (só as fichas de serviço mesmo).
  const procedimentos: Procedimento[] = useMemo(
    () =>
      cliente
        ? cliente.fichas
            .filter((f): f is Ficha & { tipo: Tipo } => ehTipo(f.tipo))
            .map((f) => ({
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

  // Excluir aqui vale pra cliente inteira: todas as fichas dela (laser,
  // facial, corporal...), não só uma. "Arquivar" é o soft delete de sempre
  // (some das listas, recuperável em "Fichas excluídas" — uma por uma,
  // como sempre foi); "Excluir definitivamente" apaga tudo pra sempre.
  const arquivarCliente = async () => {
    if (!cliente) return;
    setExcluindo("arquivar");
    setErroExclusao(null);
    try {
      await Promise.all(cliente.fichas.map((f) => excluirFicha(f.id)));
      navigate({ to: "/painel" });
    } catch (e) {
      setErroExclusao(e instanceof Error ? e.message : "Erro ao excluir.");
      setExcluindo(null);
      setConfirmandoExclusao(false);
    }
  };

  const excluirClienteDefinitivamente = async () => {
    if (!cliente) return;
    if (
      !window.confirm(
        `Excluir "${cliente.nome}" definitivamente — todas as fichas e sessões dela? Essa ação não pode ser desfeita.`,
      )
    ) {
      return;
    }
    setExcluindo("definitivo");
    setErroExclusao(null);
    try {
      await Promise.all(cliente.fichas.map((f) => excluirFichaDefinitivamente(f.id)));
      navigate({ to: "/painel" });
    } catch (e) {
      setErroExclusao(e instanceof Error ? e.message : "Erro ao excluir definitivamente.");
      setExcluindo(null);
      setConfirmandoExclusao(false);
    }
  };

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

  const bordaCard = "border-painel-border";
  const pillCliente = "bg-painel-badge-bg text-painel-title";

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
        <div className="relative -mx-4 sm:-mx-6 mb-6 overflow-hidden rounded-b-2xl bg-painel-hero-bg px-4 py-7 sm:px-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 92% 0%, rgba(179,146,76,.4), transparent 50%), radial-gradient(circle at 4% 100%, rgba(154,111,176,.5), transparent 55%)",
            }}
          />
          <div className="relative flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-4xl text-white">{cliente.nome}</h2>
              <p className="text-[13px] text-white/60 mt-2">
                {cliente.telefone ? mascaraTelefone(cliente.telefone) : "sem telefone"}
                {" · "}
                {cliente.fichas.length} ficha(s)
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/painel/contrato/$id"
                params={{ id }}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white hover:border-white/50 transition-colors"
              >
                <FileSignature className="h-4 w-4" />
                Gerar contrato
              </Link>
              {!confirmandoExclusao && (
                <button
                  type="button"
                  onClick={() => setConfirmandoExclusao(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-painel-alert-border px-4 py-2 text-sm font-medium text-painel-alert-text hover:bg-painel-alert-bg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              )}
            </div>
          </div>
        </div>

        {confirmandoExclusao && (
          <PainelModal
            onFechar={excluindo === null ? () => setConfirmandoExclusao(false) : undefined}
          >
            <div className="flex flex-col gap-3">
              <p className="text-sm text-white/80">
                Excluir <strong className="text-white">{cliente.nome}</strong>? São{" "}
                {cliente.fichas.length} ficha(s). Arquivar move todas para "Fichas excluídas" (dá
                pra restaurar depois); excluir definitivamente apaga tudo — fichas e sessões — pra
                sempre.
              </p>
              {erroExclusao && <p className="text-sm text-rose-300">{erroExclusao}</p>}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmandoExclusao(false)}
                  disabled={excluindo !== null}
                  className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/70 hover:border-white/40 transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={arquivarCliente}
                  disabled={excluindo !== null}
                  className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/40 px-4 py-2 text-sm font-medium text-rose-300 hover:bg-white/5 transition-colors disabled:opacity-40"
                >
                  {excluindo === "arquivar" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                  Arquivar
                </button>
                <button
                  type="button"
                  onClick={excluirClienteDefinitivamente}
                  disabled={excluindo !== null}
                  className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 text-white px-4 py-2 text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-40"
                >
                  {excluindo === "definitivo" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Excluir definitivamente
                </button>
              </div>
            </div>
          </PainelModal>
        )}

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
                <span>{getFicha(f.tipo)?.emoji ?? ""}</span>
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
