import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, AlertTriangle, Loader2, Camera, CameraOff, Inbox } from "lucide-react";
import { listarFichas, type Ficha } from "@/lib/painel";
import { agruparClientes, digitos, type Cliente } from "@/lib/clientes";
import { TIPOS, FICHAS, nomeCurto, type Tipo } from "@/data/anamnese";
import { EnviarFicha } from "@/components/EnviarFicha";

export const Route = createFileRoute("/painel/")({
  component: ListaFichas,
});

function ListaFichas() {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<Tipo | "todas">("todas");

  useEffect(() => {
    listarFichas()
      .then(setFichas)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));

    // Auto-refresh: atualiza a lista sozinha a cada 20s (ex.: nova ficha
    // preenchida pela cliente), sem precisar recarregar a página. Falhas
    // aqui ficam em silêncio — não interrompe quem já está com a lista
    // carregada só por causa de uma soneca de rede.
    const intervalo = setInterval(() => {
      listarFichas()
        .then(setFichas)
        .catch(() => {});
    }, 20000);
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

  return (
    <div>
      {/* Busca principal — encontrar a cliente por nome ou CPF */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar cliente por nome ou CPF"
          className="w-full rounded-full border border-border bg-background pl-12 pr-4 py-3.5 text-base focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <EnviarFicha />

      <div className="mb-4">
        <h2 className="font-display text-3xl text-primary">Clientes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {fichas
            ? busca || filtroTipo !== "todas"
              ? `${filtrados.length} de ${clientes.length} cliente(s)`
              : `${clientes.length} cliente(s) · ${fichas.length} ficha(s)`
            : "Carregando..."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(["todas", ...TIPOS] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFiltroTipo(t)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              filtroTipo === t
                ? "bg-lavender-soft border-lavender text-primary font-medium"
                : "bg-card border-border text-foreground/60 hover:border-primary/40",
            ].join(" ")}
          >
            {t === "todas" ? "Todas" : `${FICHAS[t].emoji} ${nomeCurto(t)}`}
          </button>
        ))}
      </div>

      {erro && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {erro}
        </div>
      )}

      {!fichas && !erro && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {fichas && filtrados.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mb-3 opacity-50" />
          <p>
            {busca || filtroTipo !== "todas"
              ? "Nenhuma cliente encontrada."
              : "Ainda não há clientes registradas."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtrados.map((c: Cliente) => (
          <Link
            key={c.id}
            to="/painel/cliente/$id"
            params={{ id: c.id }}
            className={[
              "flex items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-4 transition-colors",
              c.algumMasculino
                ? "border-sky-400/60 hover:border-sky-500"
                : "border-border hover:border-primary/40",
            ].join(" ")}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground truncate">{c.nome}</span>
                {c.tipos.map((t) => (
                  <span
                    key={t}
                    className="text-xs rounded-full bg-lavender-soft px-2 py-0.5 text-primary"
                  >
                    {FICHAS[t]?.emoji ?? ""} {nomeCurto(t)}
                  </span>
                ))}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {c.telefone || "sem telefone"}
                {c.fichas.length > 1 ? ` · ${c.fichas.length} fichas` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {c.autorizaFoto ? (
                <span title="Autorizou uso de imagem">
                  <Camera className="h-4 w-4 text-lavender" />
                </span>
              ) : (
                <span title="Não autorizou uso de imagem">
                  <CameraOff className="h-4 w-4 text-muted-foreground/60" />
                </span>
              )}
              {c.alertas > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose/15 text-rose px-2.5 py-1 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {c.alertas}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
