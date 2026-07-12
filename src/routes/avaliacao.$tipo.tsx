import { useState } from "react";
import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { SITE_URL } from "@/data/services";
import {
  getFicha,
  TERMO_TEXTO,
  AUTORIZACAO_FOTO_TEXTO,
  calcularAlertas,
  type Campo,
  type Respostas,
} from "@/data/anamnese";
import { salvarFicha } from "@/lib/api/fichas.functions";
import { aplicarMascara } from "@/lib/mascaras";

export const Route = createFileRoute("/avaliacao/$tipo")({
  head: () => ({
    meta: [
      { title: "Ficha de Avaliação | MAVI Centro de Estética" },
      {
        name: "description",
        content:
          "Responda antes do seu atendimento na MAVI. Leva poucos minutos e ajuda a gente a te receber com mais cuidado e segurança.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/avaliacao` }],
  }),
  component: FichaPage,
});

function Chip({
  label,
  selected,
  onClick,
  alert,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  alert?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-4 py-2 text-sm transition-colors",
        selected
          ? alert
            ? "bg-rose/15 border-rose text-rose"
            : "bg-lavender-soft border-lavender text-primary font-medium"
          : "bg-card border-border text-foreground/70 hover:border-primary/40",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function YesNo({
  value,
  onChange,
  alertOnYes,
}: {
  value: boolean | null | undefined;
  onChange: (v: boolean) => void;
  alertOnYes?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <Chip
        label="Sim"
        selected={value === true}
        onClick={() => onChange(true)}
        alert={alertOnYes}
      />
      <Chip label="Não" selected={value === false} onClick={() => onChange(false)} />
    </div>
  );
}

const inputBase =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function CampoView({
  campo,
  respostas,
  set,
  compacto,
}: {
  campo: Campo;
  respostas: Respostas;
  set: (id: string, v: string | boolean | null) => void;
  compacto?: boolean;
}) {
  if (campo.tipo === "texto") {
    return (
      <div>
        <label className="block text-sm font-medium mb-2">{campo.label}</label>
        {campo.multiline ? (
          <textarea
            value={(respostas[campo.id] as string) ?? ""}
            onChange={(e) => set(campo.id, e.target.value)}
            placeholder={campo.placeholder}
            rows={3}
            className={inputBase}
          />
        ) : (
          <input
            type={campo.inputMode === "date" ? "date" : "text"}
            inputMode={
              campo.inputMode === "tel"
                ? "tel"
                : campo.inputMode === "email"
                  ? "email"
                  : campo.inputMode === "numeric"
                    ? "numeric"
                    : undefined
            }
            value={(respostas[campo.id] as string) ?? ""}
            onChange={(e) => set(campo.id, aplicarMascara(campo.mascara, e.target.value))}
            placeholder={campo.placeholder}
            className={inputBase}
          />
        )}
      </div>
    );
  }

  if (campo.tipo === "selecao") {
    const val = (respostas[campo.id] as string) ?? "";
    return (
      <div>
        <label className="block text-sm font-medium mb-2">{campo.label}</label>
        <div className="flex flex-wrap gap-2">
          {campo.opcoes.map((op) => (
            <Chip
              key={op}
              label={op}
              selected={val === op}
              onClick={() => set(campo.id, val === op ? null : op)}
            />
          ))}
        </div>
        {campo.especifique && val && (
          <textarea
            value={(respostas[`${campo.id}__detalhe`] as string) ?? ""}
            onChange={(e) => set(`${campo.id}__detalhe`, e.target.value)}
            placeholder={campo.especifiquePlaceholder ?? "Especifique"}
            rows={2}
            className={`${inputBase} mt-3`}
          />
        )}
      </div>
    );
  }

  if (campo.tipo === "multi") {
    const atual = String(respostas[campo.id] ?? "")
      .split(", ")
      .filter(Boolean);
    const toggle = (op: string) => {
      const novo = atual.includes(op) ? atual.filter((x) => x !== op) : [...atual, op];
      set(campo.id, novo.join(", "));
    };
    return (
      <div>
        <label className="block text-sm font-medium mb-2">{campo.label}</label>
        <div className="flex flex-wrap gap-2">
          {campo.opcoes.map((op) => (
            <Chip key={op} label={op} selected={atual.includes(op)} onClick={() => toggle(op)} />
          ))}
        </div>
      </div>
    );
  }

  // simnao
  const valor = respostas[campo.id] as boolean | null | undefined;
  return (
    <div className={compacto ? "flex items-center justify-between gap-3" : ""}>
      <label className={compacto ? "text-sm font-medium" : "block text-sm font-medium mb-2"}>
        {campo.label}
      </label>
      <YesNo
        value={valor}
        onChange={(v) => set(campo.id, v)}
        alertOnYes={Boolean(campo.alertaSeSim)}
      />
      {!compacto && campo.especifique && valor === true && (
        <textarea
          value={(respostas[`${campo.id}__detalhe`] as string) ?? ""}
          onChange={(e) => set(`${campo.id}__detalhe`, e.target.value)}
          placeholder={campo.especifiquePlaceholder ?? "Especifique"}
          rows={2}
          className={`${inputBase} mt-3`}
        />
      )}
    </div>
  );
}

function FichaPage() {
  const { tipo } = useParams({ from: "/avaliacao/$tipo" });
  const def = getFicha(tipo);

  const [step, setStep] = useState(0);
  const [respostas, setRespostas] = useState<Respostas>({});
  const [termoAceito, setTermoAceito] = useState(false);
  const [autorizaFoto, setAutorizaFoto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!def) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl text-primary mb-3">Ficha não encontrada</h1>
          <p className="text-muted-foreground mb-6">Este link de ficha não é válido.</p>
          <Link to="/avaliacao" className="text-primary underline">
            Ver as fichas disponíveis
          </Link>
        </div>
      </section>
    );
  }

  const etapas = def.etapas;
  const totalEtapas = etapas.length + 1; // + termo
  const stepLabels = [...etapas.map((e) => e.titulo), "Termo"];

  const set = (id: string, v: string | boolean | null) => setRespostas((r) => ({ ...r, [id]: v }));

  const alertas = calcularAlertas(tipo, respostas);
  const naTermo = step === etapas.length;

  const podeAvancar = (() => {
    if (naTermo) return termoAceito && !enviando;
    return etapas[step].campos.every((c) => {
      if (c.tipo === "texto" && c.obrigatorio) {
        return String(respostas[c.id] ?? "").trim().length > 0;
      }
      if (c.tipo === "selecao" && c.obrigatorio) {
        return String(respostas[c.id] ?? "").trim().length > 0;
      }
      return true;
    });
  })();

  const enviar = async () => {
    setErro(null);
    setEnviando(true);
    try {
      await salvarFicha({
        data: {
          tipo: def.tipo,
          nome: String(respostas.nome ?? "").trim(),
          telefone: String(respostas.whatsapp ?? "").trim(),
          respostas,
          alertas,
          termo_aceito: termoAceito,
          autoriza_foto: autorizaFoto,
        },
      });
      navigate({ to: "/obrigado" });
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Não foi possível enviar. Tente novamente em instantes.",
      );
      setEnviando(false);
    }
  };

  return (
    <section className="min-h-[80vh] py-14 lg:py-20">
      <div className="mx-auto max-w-2xl px-6">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">
            Antes do seu atendimento
          </p>
          <h1 className="font-display text-4xl lg:text-5xl text-primary leading-tight">
            {def.emoji} Ficha{" "}
            <em className="italic font-normal">
              {def.nome.replace(/^Anamnese\s*/i, "").toLowerCase() || def.nome}
            </em>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed">
            Leva poucos minutos. Isso nos ajuda a te receber com mais cuidado e segurança.
          </p>
        </div>

        <div className="flex gap-2 mb-2">
          {stepLabels.map((_, i) => (
            <div
              key={i}
              className={[
                "h-1.5 flex-1 rounded-full transition-colors",
                i < step ? "bg-lavender" : i === step ? "bg-rose" : "bg-border",
              ].join(" ")}
            />
          ))}
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-8">
          Etapa {step + 1} de {totalEtapas} — {stepLabels[step]}
        </p>

        <div className="relative overflow-hidden bg-card border border-border rounded-[2rem] p-6 sm:p-8 lg:p-10 min-h-[420px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="flex-1"
            >
              {!naTermo && (
                <div>
                  {etapas[step].descricao && (
                    <p className="text-sm text-muted-foreground mb-6">{etapas[step].descricao}</p>
                  )}
                  {etapas[step].layout === "grid" ? (
                    <div className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
                      {etapas[step].campos.map((c) => (
                        <div key={c.id} className="border-b border-border/50 pb-3">
                          <CampoView campo={c} respostas={respostas} set={set} compacto />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {etapas[step].campos.map((c) => (
                        <CampoView key={c.id} campo={c} respostas={respostas} set={set} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {naTermo && (
                <div className="space-y-5">
                  <label className="flex gap-3 rounded-xl border border-border bg-background px-4 py-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termoAceito}
                      onChange={(e) => setTermoAceito(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                    />
                    <span className="text-sm text-foreground/80 leading-relaxed">
                      <strong className="text-foreground">Termo de responsabilidade.</strong>{" "}
                      {TERMO_TEXTO}
                    </span>
                  </label>

                  <label className="flex gap-3 rounded-xl border border-border bg-background px-4 py-4 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autorizaFoto}
                      onChange={(e) => setAutorizaFoto(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 accent-[var(--primary)]"
                    />
                    <span className="text-sm text-foreground/80 leading-relaxed">
                      <strong className="text-foreground">Autorização de imagem (opcional).</strong>{" "}
                      {AUTORIZACAO_FOTO_TEXTO}
                    </span>
                  </label>

                  {alertas.length > 0 && (
                    <div className="flex gap-3 rounded-xl border border-rose/40 bg-rose/10 px-4 py-3.5 text-sm text-rose">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <ul className="space-y-1">
                        {alertas.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3 rounded-xl border border-lavender/40 bg-lavender-soft/50 px-4 py-3.5 text-sm text-primary">
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>Ao enviar, sua ficha fica salva com segurança para a Marina te atender.</p>
                  </div>

                  {erro && (
                    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {erro}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8 pt-6 border-t border-border/60">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                disabled={enviando}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground/70 hover:border-primary/40 transition-colors disabled:opacity-40"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
            {!naTermo ? (
              <button
                type="button"
                disabled={!podeAvancar}
                onClick={() => setStep((s) => s + 1)}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={!podeAvancar}
                onClick={enviar}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-rose text-accent-foreground px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {enviando ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    Enviar ficha
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
