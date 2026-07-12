import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  AlertTriangle,
  Loader2,
  Camera,
  CameraOff,
  Inbox,
  Send,
  Copy,
  Check,
  MessageCircle,
} from "lucide-react";
import { listarFichas, type Ficha } from "@/lib/painel";
import { TIPOS, FICHAS, nomeTipo, nomeCurto, type Tipo } from "@/data/anamnese";

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

function EnviarFicha() {
  const [origin, setOrigin] = useState("");
  const [tipo, setTipo] = useState<Tipo>("corporal");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = `${origin}/avaliacao/${tipo}`;
  const mensagem = `Oi! Antes do seu atendimento na MAVI, preencha sua ficha de ${FICHAS[tipo].nome.toLowerCase()} (leva poucos minutos): ${link}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="rounded-2xl border border-lavender/50 bg-lavender-soft/40 p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Send className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-primary">Enviar ficha para a cliente</h3>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {TIPOS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={[
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              tipo === t
                ? "bg-primary border-primary text-primary-foreground font-medium"
                : "bg-card border-border text-foreground/70 hover:border-primary/40",
            ].join(" ")}
          >
            {FICHAS[t].emoji} {nomeCurto(t)}
            {FICHAS[t].emConstrucao ? " (em breve)" : ""}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={link}
          className="min-w-0 flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground"
        />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground/80 hover:border-primary/40 transition-colors"
          >
            {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiado ? "Copiado" : "Copiar"}
          </button>
          <a
            href={whatsapp}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}

function ListaFichas() {
  const [fichas, setFichas] = useState<Ficha[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<Tipo | "todas">("todas");

  useEffect(() => {
    listarFichas()
      .then(setFichas)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, []);

  const filtradas = useMemo(() => {
    if (!fichas) return [];
    const q = busca.trim().toLowerCase();
    const qDigitos = q.replace(/\D/g, ""); // só números (para CPF/telefone)
    return fichas.filter((f) => {
      if (filtroTipo !== "todas" && f.tipo !== filtroTipo) return false;
      if (!q) return true;
      if (f.nome.toLowerCase().includes(q)) return true;
      if (qDigitos) {
        const cpf = String(f.respostas?.cpf ?? "").replace(/\D/g, "");
        const tel = (f.telefone ?? "").replace(/\D/g, "");
        if (cpf.includes(qDigitos) || tel.includes(qDigitos)) return true;
      }
      return false;
    });
  }, [fichas, busca, filtroTipo]);

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
        <h2 className="font-display text-3xl text-primary">Fichas dos pacientes</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {fichas
            ? busca || filtroTipo !== "todas"
              ? `${filtradas.length} de ${fichas.length} ficha(s)`
              : `${fichas.length} ficha(s) registrada(s)`
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

      {fichas && filtradas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <Inbox className="h-10 w-10 mb-3 opacity-50" />
          <p>
            {busca || filtroTipo !== "todas"
              ? "Nenhuma ficha encontrada."
              : "Ainda não há fichas registradas."}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filtradas.map((f) => {
          const masculino = f.respostas?.sexo === "Masculino";
          return (
          <Link
            key={f.id}
            to="/painel/$id"
            params={{ id: f.id }}
            className={[
              "flex items-center justify-between gap-4 rounded-2xl border bg-card px-5 py-4 transition-colors",
              masculino
                ? "border-sky-400/60 hover:border-sky-500"
                : "border-border hover:border-primary/40",
            ].join(" ")}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-foreground truncate">{f.nome}</span>
                <span className="text-xs rounded-full bg-lavender-soft px-2 py-0.5 text-primary">
                  {FICHAS[f.tipo]?.emoji ?? ""} {nomeTipo(f.tipo)}
                </span>
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
              {f.autoriza_foto ? (
                <span title="Autorizou uso de imagem">
                  <Camera className="h-4 w-4 text-lavender" />
                </span>
              ) : (
                <span title="Não autorizou uso de imagem">
                  <CameraOff className="h-4 w-4 text-muted-foreground/60" />
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
          );
        })}
      </div>
    </div>
  );
}
