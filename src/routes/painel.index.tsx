import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  AlertTriangle,
  Archive,
  ArchiveRestore,
  Loader2,
  Camera,
  CameraOff,
  Inbox,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Send,
} from "lucide-react";
import { listarFichas, listarFichasExcluidas, restaurarFicha, type Ficha } from "@/lib/painel";
import { agruparClientes, digitos, type Cliente } from "@/lib/clientes";
import { TIPOS, FICHAS, nomeCurto, nomeTipo, type Tipo } from "@/data/anamnese";
import { EnviarFicha } from "@/components/EnviarFicha";
import { RamosWatermark } from "@/components/RamosWatermark";

export const Route = createFileRoute("/painel/")({
  component: ListaFichas,
});

const POR_PAGINA = 20;
const CINCO_MINUTOS_MS = 5 * 60 * 1000;

function ListaFichas() {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<Tipo | "todas">("todas");
  const [pagina, setPagina] = useState(1);
  const [enviandoFicha, setEnviandoFicha] = useState(false);

  // "Fichas excluídas": carregada só quando a seção é aberta pela primeira
  // vez — é um recurso raro, não vale buscar sempre que a lista carrega.
  const [mostrarExcluidas, setMostrarExcluidas] = useState(false);
  const [fichasExcluidas, setFichasExcluidas] = useState<Ficha[] | null>(null);
  const [erroExcluidas, setErroExcluidas] = useState<string | null>(null);
  const [restaurandoId, setRestaurandoId] = useState<string | null>(null);
  const [erroRestaurar, setErroRestaurar] = useState<string | null>(null);

  useEffect(() => {
    listarFichas()
      .then(setFichas)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));

    // Auto-refresh: atualiza a lista sozinha a cada 5min (ex.: nova ficha
    // preenchida pela cliente), sem precisar recarregar a página. Falhas
    // aqui ficam em silêncio — não interrompe quem já está com a lista
    // carregada só por causa de uma soneca de rede.
    const intervalo = setInterval(() => {
      listarFichas()
        .then(setFichas)
        .catch(() => {});
    }, CINCO_MINUTOS_MS);
    return () => clearInterval(intervalo);
  }, []);

  // Agrupa as fichas por pessoa (mesma cliente = mesmo WhatsApp/CPF).
  const clientes = useMemo(() => (fichas ? agruparClientes(fichas) : []), [fichas]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const qDigitos = q.replace(/\D/g, ""); // só números (para CPF/telefone)
    return clientes.filter((c) => {
      if (filtroTipo !== "todas" && !c.tipos.includes(filtroTipo)) return false;
      if (!q) return true;
      if (c.nome.toLowerCase().includes(q)) return true;
      if (qDigitos) {
        if (digitos(c.telefone).includes(qDigitos)) return true;
        if (c.fichas.some((f) => digitos(f.respostas?.cpf as string).includes(qDigitos)))
          return true;
      }
      return false;
    });
  }, [clientes, busca, filtroTipo]);

  // Volta para a primeira página sempre que a busca ou o filtro mudam o
  // resultado — senão a cliente pode ficar "presa" numa página vazia.
  useEffect(() => {
    setPagina(1);
  }, [busca, filtroTipo]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const paginados = filtrados.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  const alternarExcluidas = () => {
    const abrindo = !mostrarExcluidas;
    setMostrarExcluidas(abrindo);
    if (abrindo && fichasExcluidas === null) {
      setErroExcluidas(null);
      listarFichasExcluidas()
        .then(setFichasExcluidas)
        .catch((e) => setErroExcluidas(e instanceof Error ? e.message : "Erro ao carregar."));
    }
  };

  const restaurar = async (f: Ficha) => {
    setRestaurandoId(f.id);
    setErroRestaurar(null);
    try {
      await restaurarFicha(f.id);
      setFichasExcluidas((prev) => (prev ?? []).filter((x) => x.id !== f.id));
      setFichas((prev) => (prev ? [f, ...prev] : [f]));
    } catch (e) {
      setErroRestaurar(e instanceof Error ? e.message : "Erro ao restaurar ficha.");
    } finally {
      setRestaurandoId(null);
    }
  };

  return (
    <div>
      <RamosWatermark className="fixed left-1/2 top-1/2 hidden h-[70vh] max-h-[600px] w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.05] sm:block" />
      <div className="relative z-10">
        {/* Busca principal — encontrar a cliente por nome ou CPF */}
        <div className="relative mb-7">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-painel-muted" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente por nome ou CPF"
            className="w-full rounded-full border border-painel-border bg-white pl-[52px] pr-5 py-4 text-[15px] text-painel-title placeholder:text-painel-muted-2 focus:outline-none focus:ring-2 focus:ring-painel-primary/40"
          />
        </div>

        <div className="mb-7 flex justify-end">
          <button
            type="button"
            onClick={() => setEnviandoFicha(true)}
            className="inline-flex items-center gap-2 rounded-full bg-painel-primary text-white px-5 py-3 text-sm font-semibold hover:bg-painel-primary/90 transition-colors"
          >
            <Send className="h-4 w-4" />
            Enviar ficha
          </button>
        </div>

        {enviandoFicha && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-8"
            onClick={() => setEnviandoFicha(false)}
          >
            <div
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <EnviarFicha convitePadrao onFechar={() => setEnviandoFicha(false)} />
            </div>
          </div>
        )}

        <div className="mb-5 flex items-baseline justify-between gap-3">
          <h2 className="font-display text-[34px] text-painel-title">Clientes</h2>
          <p className="text-[13px] text-painel-muted">
            {fichas
              ? busca || filtroTipo !== "todas"
                ? `${filtrados.length} de ${clientes.length} cliente(s)`
                : `${clientes.length} cliente(s) · ${fichas.length} ficha(s)`
              : "Carregando..."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-7">
          {(["todas", ...TIPOS] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setFiltroTipo(t)}
              className={[
                "rounded-full border px-4 py-2 text-xs transition-colors",
                filtroTipo === t
                  ? "bg-painel-primary border-painel-primary text-white font-semibold"
                  : "bg-white border-painel-border text-painel-chip-text hover:border-painel-primary/40",
              ].join(" ")}
            >
              {t === "todas" ? "Todas" : `${FICHAS[t].emoji} ${nomeCurto(t)}`}
            </button>
          ))}
        </div>

        {erro && (
          <div className="rounded-xl border border-painel-alert-border bg-painel-alert-bg px-4 py-3 text-sm text-painel-alert-text">
            {erro}
          </div>
        )}

        {!fichas && !erro && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-painel-muted" />
          </div>
        )}

        {fichas && filtrados.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-painel-muted">
            <Inbox className="h-10 w-10 mb-3 opacity-50" />
            <p>
              {busca || filtroTipo !== "todas"
                ? "Nenhuma cliente encontrada."
                : "Ainda não há clientes registradas."}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {paginados.map((c: Cliente) => (
            <Link
              key={c.id}
              to="/painel/cliente/$id"
              params={{ id: c.id }}
              className={[
                "flex items-center justify-between gap-4 rounded-[14px] border bg-white px-6 py-5 transition-colors",
                c.algumMasculino
                  ? "border-sky-600 hover:border-sky-700"
                  : "border-painel-border hover:border-painel-primary/40",
              ].join(" ")}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                  <span className="text-[15px] text-painel-title truncate">{c.nome}</span>
                  {c.tipos.map((t) => (
                    <span
                      key={t}
                      className={[
                        "text-[11px] rounded-full px-2.5 py-0.5",
                        c.algumMasculino
                          ? "bg-sky-600 text-white"
                          : "bg-painel-badge-bg text-painel-primary",
                      ].join(" ")}
                    >
                      {FICHAS[t]?.emoji ?? ""} {nomeCurto(t)}
                    </span>
                  ))}
                </div>
                <p className="text-[13px] text-painel-muted-2 truncate">
                  {c.telefone || "sem telefone"}
                  {c.fichas.length > 1 ? ` · ${c.fichas.length} fichas` : ""}
                </p>
              </div>
              <div className="flex items-center gap-3.5 shrink-0">
                {c.autorizaFoto ? (
                  <span title="Autorizou uso de imagem">
                    <Camera className="h-4 w-4 text-painel-gold" />
                  </span>
                ) : (
                  <span title="Não autorizou uso de imagem">
                    <CameraOff className="h-4 w-4 text-painel-icon-muted" />
                  </span>
                )}
                {c.alertas > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-painel-alert-bg text-painel-alert-text px-3 py-1.5 text-xs font-semibold">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {c.alertas}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {filtrados.length > POR_PAGINA && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="inline-flex items-center gap-1 rounded-full border border-painel-border px-3 py-1.5 text-sm text-painel-chip-text hover:border-painel-primary/40 disabled:opacity-40 disabled:hover:border-painel-border"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>
            <span className="text-sm text-painel-muted">
              Página {paginaAtual} de {totalPaginas}
            </span>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="inline-flex items-center gap-1 rounded-full border border-painel-border px-3 py-1.5 text-sm text-painel-chip-text hover:border-painel-primary/40 disabled:opacity-40 disabled:hover:border-painel-border"
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-painel-border">
          <button
            type="button"
            onClick={alternarExcluidas}
            className="flex items-center gap-1.5 text-sm text-painel-muted hover:text-painel-primary transition-colors"
          >
            {mostrarExcluidas ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
            <Archive className="h-3.5 w-3.5" />
            Fichas excluídas{fichasExcluidas ? ` (${fichasExcluidas.length})` : ""}
          </button>

          {mostrarExcluidas && (
            <div className="mt-3">
              {erroExcluidas && <p className="text-sm text-painel-alert-text">{erroExcluidas}</p>}
              {erroRestaurar && <p className="text-sm text-painel-alert-text">{erroRestaurar}</p>}
              {fichasExcluidas === null && !erroExcluidas && (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-painel-muted" />
                </div>
              )}
              {fichasExcluidas && fichasExcluidas.length === 0 && (
                <p className="text-sm text-painel-muted">Nenhuma ficha excluída.</p>
              )}
              {fichasExcluidas && fichasExcluidas.length > 0 && (
                <ul className="space-y-1.5">
                  {fichasExcluidas.map((f) => (
                    <li key={f.id} className="flex items-center gap-2 text-sm text-painel-muted-2">
                      <span className="truncate">
                        {f.nome} · {FICHAS[f.tipo]?.emoji ?? ""} {nomeTipo(f.tipo)}
                        {f.telefone ? ` · ${f.telefone}` : ""}
                      </span>
                      <button
                        type="button"
                        onClick={() => restaurar(f)}
                        disabled={restaurandoId === f.id}
                        title="Restaurar ficha"
                        className="ml-auto shrink-0 inline-flex items-center gap-1 text-xs text-painel-primary hover:opacity-80 transition-colors disabled:opacity-40"
                      >
                        {restaurandoId === f.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <ArchiveRestore className="h-3.5 w-3.5" />
                        )}
                        Restaurar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
