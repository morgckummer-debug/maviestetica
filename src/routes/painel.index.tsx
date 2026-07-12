import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, AlertTriangle, Loader2, Camera, Inbox } from "lucide-react";
import { listarFichas, type Ficha } from "@/lib/painel";

export const Route = createFileRoute("/painel/")({
  component: ListaFichas,
});

function formatarData(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function ListaFichas() {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    listarFichas()
      .then(setFichas)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, []);

  const filtradas = useMemo(() => {
    if (!fichas) return [];
    const q = busca.trim().toLowerCase();
    if (!q) return fichas;
    return fichas.filter(
      (f) => f.nome.toLowerCase().includes(q) || (f.telefone ?? "").toLowerCase().includes(q),
    );
  }, [fichas, busca]);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-3xl text-primary">Fichas dos pacientes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {fichas ? `${fichas.length} ficha(s) registrada(s)` : "Carregando..."}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou telefone"
            className="w-full rounded-full border border-border bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
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

      {fichas && filtradas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mb-3 opacity-50" />
          <p>{busca ? "Nenhuma ficha encontrada." : "Ainda não há fichas registradas."}</p>
        </div>
      )}

      <div className="space-y-3">
        {filtradas.map((f) => (
          <Link
            key={f.id}
            to="/painel/$id"
            params={{ id: f.id }}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 hover:border-primary/40 transition-colors"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground truncate">{f.nome}</span>
                {f.arquivada && (
                  <span className="text-xs rounded-full bg-muted px-2 py-0.5 text-muted-foreground">
                    arquivada
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {f.telefone || "sem telefone"} · {formatarData(f.created_at)}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {f.autoriza_foto && (
                <span title="Autorizou uso de imagem">
                  <Camera className="h-4 w-4 text-lavender" />
                </span>
              )}
              {f.alertas.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose/15 text-rose px-2.5 py-1 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {f.alertas.length}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
