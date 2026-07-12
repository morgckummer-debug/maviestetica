import { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, AlertTriangle, Loader2, Camera, Check, Archive } from "lucide-react";
import { ETAPAS, CAMPOS_MEDIDAS } from "@/data/anamnese";
import { obterFicha, atualizarFicha, type Ficha } from "@/lib/painel";

export const Route = createFileRoute("/painel/$id")({
  component: DetalheFicha,
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

function valorResposta(v: string | boolean | null | undefined): string | null {
  if (v === true) return "Sim";
  if (v === false) return "Não";
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

function DetalheFicha() {
  const { id } = useParams({ from: "/painel/$id" });
  const [ficha, setFicha] = useState<Ficha | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [naoEncontrada, setNaoEncontrada] = useState(false);

  const [medidas, setMedidas] = useState<Record<string, string>>({});
  const [relatorio, setRelatorio] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    obterFicha(id)
      .then((f) => {
        if (!f) {
          setNaoEncontrada(true);
          return;
        }
        setFicha(f);
        setMedidas(f.medidas ?? {});
        setRelatorio(f.relatorio ?? "");
      })
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar."));
  }, [id]);

  const salvar = async () => {
    setSalvando(true);
    setSalvo(false);
    setErro(null);
    try {
      await atualizarFicha(id, { medidas, relatorio });
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const arquivar = async () => {
    if (!ficha) return;
    const novo = !ficha.arquivada;
    try {
      await atualizarFicha(id, { arquivada: novo });
      setFicha({ ...ficha, arquivada: novo });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao arquivar.");
    }
  };

  if (naoEncontrada) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">Ficha não encontrada.</p>
        <Link to="/painel" className="text-primary underline">
          Voltar à lista
        </Link>
      </div>
    );
  }

  if (!ficha) {
    return (
      <div className="flex justify-center py-16">
        {erro ? (
          <p className="text-destructive text-sm">{erro}</p>
        ) : (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        )}
      </div>
    );
  }

  const r = ficha.respostas ?? {};

  return (
    <div>
      <Link
        to="/painel"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Todas as fichas
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-3xl text-primary">{ficha.nome}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {ficha.telefone || "sem telefone"} · enviada em {formatarData(ficha.created_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={arquivar}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground/70 hover:border-primary/40 transition-colors"
        >
          <Archive className="h-4 w-4" />
          {ficha.arquivada ? "Desarquivar" : "Arquivar"}
        </button>
      </div>

      {ficha.alertas.length > 0 && (
        <div className="flex gap-3 rounded-xl border border-rose/40 bg-rose/10 px-4 py-3.5 text-sm text-rose mb-6">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <ul className="space-y-1">
            {ficha.alertas.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-8 text-sm">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
            ficha.termo_aceito ? "bg-lavender-soft text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Check className="h-3.5 w-3.5" />
          Termo {ficha.termo_aceito ? "aceito" : "não aceito"}
        </span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 ${
            ficha.autoriza_foto ? "bg-lavender-soft text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          <Camera className="h-3.5 w-3.5" />
          {ficha.autoriza_foto ? "Autorizou imagem" : "Não autorizou imagem"}
        </span>
      </div>

      {/* Respostas da anamnese */}
      <div className="space-y-6 mb-10">
        {ETAPAS.map((etapa) => {
          const linhas = etapa.campos
            .map((c) => {
              const val = valorResposta(r[c.id]);
              if (val === null) return null;
              const detalhe = c.tipo === "simnao" ? valorResposta(r[`${c.id}__detalhe`]) : null;
              return { id: c.id, label: c.label, val, detalhe };
            })
            .filter(
              (x): x is { id: string; label: string; val: string; detalhe: string | null } =>
                x !== null,
            );

          if (linhas.length === 0) return null;

          return (
            <div key={etapa.titulo} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-medium text-primary mb-3">{etapa.titulo}</h3>
              <dl className="divide-y divide-border/60">
                {linhas.map((l) => (
                  <div key={l.id} className="flex justify-between gap-4 py-2 text-sm">
                    <dt className="text-muted-foreground">{l.label}</dt>
                    <dd className="text-right text-foreground font-medium">
                      {l.val}
                      {l.detalhe && (
                        <span className="block text-muted-foreground font-normal">{l.detalhe}</span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          );
        })}
      </div>

      {/* Medidas + relatório (preenchidos pela Marina) */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-display text-2xl text-primary mb-1">Medidas e relatório</h3>
        <p className="text-sm text-muted-foreground mb-5">Preenchido no atendimento.</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {CAMPOS_MEDIDAS.map((m) => (
            <div key={m.id}>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                {m.label}
              </label>
              <input
                value={medidas[m.id] ?? ""}
                onChange={(e) => setMedidas((prev) => ({ ...prev, [m.id]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          ))}
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium mb-2">Relatório</label>
          <textarea
            value={relatorio}
            onChange={(e) => setRelatorio(e.target.value)}
            rows={4}
            placeholder="Procedimento realizado, observações, evolução..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {erro && <p className="text-sm text-destructive mb-3">{erro}</p>}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar
          </button>
          {salvo && (
            <span className="inline-flex items-center gap-1.5 text-sm text-primary">
              <Check className="h-4 w-4" />
              Salvo!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
