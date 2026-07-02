import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ArrowRight, AlertTriangle, Sparkles } from "lucide-react";
import { WHATSAPP_BASE_URL, SITE_URL, services } from "@/data/services";

export const Route = createFileRoute("/avaliacao")({
  head: () => ({
    meta: [
      { title: "Ficha de Avaliação | MAVI Centro de Estética" },
      {
        name: "description",
        content:
          "Responda antes do seu atendimento na MAVI. Leva menos de 3 minutos e ajuda a gente a te receber com mais cuidado e segurança.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/avaliacao` }],
  }),
  component: Avaliacao,
});

type FormState = {
  nome: string;
  telefone: string;
  procedimentos: string[];
  objetivo: string;
  temCirurgia: boolean | null;
  cirurgias: string;
  condicoes: string[];
  gravidez: boolean | null;
  temAlergia: boolean | null;
  alergias: string;
  usaMedicamento: boolean | null;
  medicamentos: string;
  isotretinoina: boolean | null;
  anticoagulante: boolean | null;
  exposicaoSolar: boolean | null;
  observacoes: string;
};

const initialState: FormState = {
  nome: "",
  telefone: "",
  procedimentos: [],
  objetivo: "",
  temCirurgia: null,
  cirurgias: "",
  condicoes: [],
  gravidez: null,
  temAlergia: null,
  alergias: "",
  usaMedicamento: null,
  medicamentos: "",
  isotretinoina: null,
  anticoagulante: null,
  exposicaoSolar: null,
  observacoes: "",
};

const CONDICOES = [
  "Diabetes",
  "Doença de tireoide",
  "Doença autoimune",
  "Doença de pele (psoríase, vitiligo, dermatite)",
  "Herpes recorrente",
  "Histórico de câncer",
  "Marca-passo ou metal implantado",
];

const STEP_LABELS = ["Seus dados", "O que você busca", "Sua saúde", "Medicamentos", "Revisão"];

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
        "rounded-full border px-4 py-2.5 text-sm transition-colors text-left",
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
  value: boolean | null;
  onChange: (v: boolean) => void;
  alertOnYes?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <Chip label="Sim" selected={value === true} onClick={() => onChange(true)} alert={alertOnYes} />
      <Chip label="Não" selected={value === false} onClick={() => onChange(false)} />
    </div>
  );
}

function Avaliacao() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const navigate = useNavigate();

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleFromList = (key: "procedimentos" | "condicoes", value: string) => {
    setForm((f) => {
      const list = f[key];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...f, [key]: next };
    });
  };

  const flags: string[] = [];
  if (form.gravidez === true) flags.push("Gestante ou amamentando — confirmar contraindicação do procedimento.");
  if (form.isotretinoina === true) flags.push("Uso recente de isotretinoína — avaliar antes de limpeza de pele/peeling.");
  if (form.anticoagulante === true) flags.push("Uso de anticoagulante — atenção redobrada em procedimentos com extração.");
  if (form.exposicaoSolar === true) flags.push("Exposição solar recente na área — reavaliar segurança da depilação a laser.");
  if (form.condicoes.includes("Marca-passo ou metal implantado"))
    flags.push("Marca-passo ou metal implantado — contraindicação possível para Power Redux (radiofrequência).");

  const buildMessage = () => {
    const lines = [
      `Olá! Preenchi minha ficha de avaliação antes da consulta 🌸`,
      ``,
      `${form.nome || "—"}`,
      `${form.telefone || "—"}`,
      ``,
      `*Procedimento de interesse*`,
      form.procedimentos.join(", ") || "—",
      `Queixa principal: ${form.objetivo || "—"}`,
      ``,
      `*Saúde*`,
      `Cirurgias prévias: ${form.temCirurgia ? form.cirurgias || "sim, sem detalhe" : "não"}`,
      `Condições: ${form.condicoes.join(", ") || "nenhuma informada"}`,
      `Gestante/amamentando: ${form.gravidez === true ? "sim" : form.gravidez === false ? "não" : "—"}`,
      `Alergias: ${form.temAlergia ? form.alergias || "sim, sem detalhe" : "não"}`,
      ``,
      `*Medicamentos*`,
      `Em uso: ${form.usaMedicamento ? form.medicamentos || "sim, sem detalhe" : "não"}`,
      `Isotretinoína (6 meses): ${form.isotretinoina === true ? "sim" : form.isotretinoina === false ? "não" : "—"}`,
      `Anticoagulante/AAS: ${form.anticoagulante === true ? "sim" : form.anticoagulante === false ? "não" : "—"}`,
      `Sol/bronzeador recente: ${form.exposicaoSolar === true ? "sim" : form.exposicaoSolar === false ? "não" : "—"}`,
      ``,
      `Observações: ${form.observacoes || "—"}`,
    ];
    return lines.join("\n");
  };

  const handleFinish = () => {
    const text = encodeURIComponent(buildMessage());
    window.open(`${WHATSAPP_BASE_URL}?text=${text}`, "_blank", "noreferrer");
    navigate({ to: "/obrigado" });
  };

  const canAdvance = step !== 0 || form.nome.trim().length > 0;

  return (
    <section className="min-h-[80vh] py-14 lg:py-20">
      <div className="mx-auto max-w-2xl px-6">
        <div className="text-center mb-10">
          <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-4">Antes do seu atendimento</p>
          <h1 className="font-display text-4xl lg:text-5xl text-primary leading-tight">
            Ficha de <em className="italic font-normal">avaliação</em>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-md mx-auto leading-relaxed">
            Leva menos de 3 minutos. Isso nos ajuda a te receber com mais cuidado e segurança.
          </p>
        </div>

        <div className="flex gap-2 mb-2">
          {STEP_LABELS.map((_, i) => (
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
          Etapa {step + 1} de {STEP_LABELS.length} — {STEP_LABELS[step]}
        </p>

        <div className="relative bg-card border border-border rounded-[2rem] p-8 lg:p-10 min-h-[420px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="flex-1"
            >
              {step === 0 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Nome completo</label>
                    <input
                      value={form.nome}
                      onChange={(e) => set("nome", e.target.value)}
                      placeholder="Seu nome"
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">WhatsApp para contato</label>
                    <input
                      value={form.telefone}
                      onChange={(e) => set("telefone", e.target.value)}
                      placeholder="(31) 9....-...."
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-3">O que você veio buscar? (pode marcar mais de uma)</label>
                    <div className="flex flex-wrap gap-2.5">
                      {services.map((s) => (
                        <Chip
                          key={s.slug}
                          label={s.name}
                          selected={form.procedimentos.includes(s.name)}
                          onClick={() => toggleFromList("procedimentos", s.name)}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Conte sobre sua queixa principal
                      <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                        O que te incomoda, há quanto tempo, o que espera do resultado
                      </span>
                    </label>
                    <textarea
                      value={form.objetivo}
                      onChange={(e) => set("objetivo", e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Já fez alguma cirurgia?</label>
                    <YesNo value={form.temCirurgia} onChange={(v) => set("temCirurgia", v)} />
                    {form.temCirurgia && (
                      <textarea
                        value={form.cirurgias}
                        onChange={(e) => set("cirurgias", e.target.value)}
                        placeholder="Qual(is) e quando?"
                        rows={2}
                        className="w-full mt-3 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-3">Você tem alguma destas condições?</label>
                    <div className="flex flex-wrap gap-2.5">
                      {CONDICOES.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          selected={form.condicoes.includes(c)}
                          onClick={() => toggleFromList("condicoes", c)}
                          alert
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Está grávida ou amamentando?</label>
                    <YesNo value={form.gravidez} onChange={(v) => set("gravidez", v)} alertOnYes />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Alguma alergia (produtos, látex, medicamentos)?</label>
                    <YesNo value={form.temAlergia} onChange={(v) => set("temAlergia", v)} />
                    {form.temAlergia && (
                      <textarea
                        value={form.alergias}
                        onChange={(e) => set("alergias", e.target.value)}
                        placeholder="Quais?"
                        rows={2}
                        className="w-full mt-3 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">Usa algum medicamento contínuo no momento?</label>
                    <YesNo value={form.usaMedicamento} onChange={(v) => set("usaMedicamento", v)} />
                    {form.usaMedicamento && (
                      <textarea
                        value={form.medicamentos}
                        onChange={(e) => set("medicamentos", e.target.value)}
                        placeholder="Quais medicamentos?"
                        rows={2}
                        className="w-full mt-3 rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Usou isotretinoína (Roacutan) nos últimos 6 meses?</label>
                    <YesNo value={form.isotretinoina} onChange={(v) => set("isotretinoina", v)} alertOnYes />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Usa anticoagulante ou AAS regularmente?</label>
                    <YesNo value={form.anticoagulante} onChange={(v) => set("anticoagulante", v)} alertOnYes />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Tomou sol/bronzeador na área nos últimos 15 dias?</label>
                    <YesNo value={form.exposicaoSolar} onChange={(v) => set("exposicaoSolar", v)} alertOnYes />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">Mais alguma coisa que a Marina precise saber?</label>
                    <textarea
                      value={form.observacoes}
                      onChange={(e) => set("observacoes", e.target.value)}
                      rows={2}
                      placeholder="Fique à vontade..."
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  {flags.length > 0 && (
                    <div className="flex gap-3 rounded-xl border border-rose/40 bg-rose/10 px-4 py-3.5 text-sm text-rose">
                      <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                      <ul className="space-y-1">
                        {flags.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3 rounded-xl border border-lavender/40 bg-lavender-soft/50 px-4 py-3.5 text-sm text-primary">
                    <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                    <p>Ao confirmar, vamos abrir o WhatsApp com sua ficha já preenchida pronta pra enviar.</p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-3 mt-8 pt-6 border-t border-border/60">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground/70 hover:border-primary/40 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </button>
            )}
            {step < STEP_LABELS.length - 1 ? (
              <button
                type="button"
                disabled={!canAdvance}
                onClick={() => setStep((s) => s + 1)}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-rose text-accent-foreground px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Enviar para a Marina
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
