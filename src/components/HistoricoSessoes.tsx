import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  MessageCircle,
  Plus,
  Trash2,
} from "lucide-react";
import {
  FICHAS,
  OPCOES_SESSAO,
  rotuloItensSessao,
  nomeCurto,
  type Tipo,
} from "@/data/anamnese";
import {
  listarSessoesDeFichas,
  criarSessao,
  excluirSessao,
  type SessaoAtendimento,
} from "@/lib/painel";

// Uma opção de procedimento = uma ficha da cliente (depilação, facial...).
export type Procedimento = { id: string; tipo: Tipo; nome: string };

// Data de hoje em "YYYY-MM-DD" no fuso local (para o <input type="date">).
function hojeISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

function dataBR(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

function confirmadaEm(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// Conta, em ordem cronológica, quantas vezes cada item (área/procedimento)
// já apareceu — para o acompanhamento de protocolo (ex.: "Axilas — 5ª sessão").
// Contado por ficha, pois cada ficha é um procedimento diferente da cliente.
function calcularOrdinais(sessoes: SessaoAtendimento[]): Map<string, Map<string, number>> {
  const contagem = new Map<string, number>(); // chave: "fichaId::item"
  const porSessao = new Map<string, Map<string, number>>(); // sessaoId -> item -> nº
  const ordenadas = [...sessoes].sort((a, b) =>
    `${a.data}T${a.created_at}`.localeCompare(`${b.data}T${b.created_at}`),
  );
  for (const s of ordenadas) {
    const porItem = new Map<string, number>();
    for (const item of s.areas) {
      const chave = `${s.ficha_id}::${item}`;
      const n = (contagem.get(chave) ?? 0) + 1;
      contagem.set(chave, n);
      porItem.set(item, n);
    }
    porSessao.set(s.id, porItem);
  }
  return porSessao;
}

// Histórico de sessões: o "caderninho" digital da cliente. A Marina registra
// data + itens realizados + observação; a cliente confirma pelo link (vale
// como assinatura). Aceita várias fichas: a cliente escolhe o procedimento.
export function HistoricoSessoes({
  fichas,
  nomeCliente,
}: {
  fichas: Procedimento[];
  nomeCliente: string;
}) {
  const [sessoes, setSessoes] = useState<SessaoAtendimento[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const [abrindo, setAbrindo] = useState(false);
  const [fichaId, setFichaId] = useState(fichas[0]?.id ?? "");
  const [data, setData] = useState(hojeISO());
  const [itens, setItens] = useState<string[]>([]);
  const [observacao, setObservacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const multi = fichas.length > 1;
  const tipoPorFicha = useMemo(() => {
    const m = new Map<string, Tipo>();
    fichas.forEach((f) => m.set(f.id, f.tipo));
    return m;
  }, [fichas]);

  const tipoAtual = tipoPorFicha.get(fichaId) ?? fichas[0]?.tipo ?? "laser";
  const opcoes = OPCOES_SESSAO[tipoAtual] ?? [];

  const ids = useMemo(() => fichas.map((f) => f.id), [fichas]);

  useEffect(() => {
    setOrigin(window.location.origin);
    listarSessoesDeFichas(ids)
      .then(setSessoes)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar sessões."));
  }, [ids]);

  const toggleItem = (a: string) =>
    setItens((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));

  const abrirForm = () => {
    setFichaId(fichas[0]?.id ?? "");
    setItens([]);
    setObservacao("");
    setData(hojeISO());
    setAbrindo(true);
  };

  const registrar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      const nova = await criarSessao(fichaId, { data, areas: itens, observacao });
      setSessoes((prev) => [nova, ...(prev ?? [])]);
      setAbrindo(false);
      setItens([]);
      setObservacao("");
      setData(hojeISO());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar sessão.");
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (s: SessaoAtendimento) => {
    if (!window.confirm(`Excluir a sessão de ${dataBR(s.data)}?`)) return;
    try {
      await excluirSessao(s.id);
      setSessoes((prev) => (prev ?? []).filter((x) => x.id !== s.id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir sessão.");
    }
  };

  const linkDe = (s: SessaoAtendimento) => `${origin}/confirmar/${s.token}`;

  const copiar = async (s: SessaoAtendimento) => {
    try {
      await navigator.clipboard.writeText(linkDe(s));
      setCopiadoId(s.id);
      setTimeout(() => setCopiadoId((c) => (c === s.id ? null : c)), 2000);
    } catch {
      /* ignore */
    }
  };

  const whatsappDe = (s: SessaoAtendimento) => {
    const primeiro = nomeCliente.trim().split(" ")[0] || "";
    const msg = `Oi ${primeiro}! Confirme seu atendimento na MAVI do dia ${dataBR(s.data)}, é rapidinho: ${linkDe(s)}`;
    return `https://wa.me/?text=${encodeURIComponent(msg)}`;
  };

  const podeSalvar = fichaId && (itens.length > 0 || observacao.trim());

  // Nº de sessões já registradas de cada item, para mostrar nos botões do
  // formulário ("Axilas · seria a 5ª sessão") e no histórico já salvo.
  const ordinaisPorSessao = useMemo(() => calcularOrdinais(sessoes ?? []), [sessoes]);
  const contagemDoProcedimento = useMemo(() => {
    const m = new Map<string, number>();
    (sessoes ?? [])
      .filter((s) => s.ficha_id === fichaId)
      .forEach((s) => s.areas.forEach((a) => m.set(a, (m.get(a) ?? 0) + 1)));
    return m;
  }, [sessoes, fichaId]);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h3 className="font-display text-2xl text-primary">Histórico de sessões</h3>
        {!abrindo && (
          <button
            type="button"
            onClick={abrirForm}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Registrar sessão
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        O caderninho digital: registre o atendimento e envie o link para a cliente confirmar.
      </p>

      {erro && <p className="text-sm text-destructive mb-4">{erro}</p>}

      {/* Formulário de nova sessão */}
      {abrindo && (
        <div className="rounded-xl border border-lavender/50 bg-lavender-soft/30 p-4 sm:p-5 mb-6">
          {multi && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                Procedimento
              </label>
              <div className="flex flex-wrap gap-2">
                {fichas.map((f) => {
                  const sel = fichaId === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setFichaId(f.id);
                        setItens([]);
                      }}
                      className={[
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        sel
                          ? "bg-primary border-primary text-primary-foreground font-medium"
                          : "bg-card border-border text-foreground/70 hover:border-primary/40",
                      ].join(" ")}
                    >
                      {FICHAS[f.tipo]?.emoji ?? ""} {nomeCurto(f.tipo)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Data do atendimento
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {opcoes.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">
                {rotuloItensSessao(tipoAtual)}
              </label>
              <div className="flex flex-wrap gap-2">
                {opcoes.map((a) => {
                  const sel = itens.includes(a);
                  const proximaOrdinal = (contagemDoProcedimento.get(a) ?? 0) + 1;
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleItem(a)}
                      className={[
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        sel
                          ? "bg-lavender-soft border-lavender text-primary font-medium"
                          : "bg-card border-border text-foreground/70 hover:border-primary/40",
                      ].join(" ")}
                    >
                      {a}
                      <span className="ml-1.5 text-xs opacity-60">· {proximaOrdinal}ª</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">
              Observação
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              placeholder="O que foi realizado, observações..."
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={registrar}
              disabled={salvando || !podeSalvar}
              className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-5 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar sessão
            </button>
            <button
              type="button"
              onClick={() => setAbrindo(false)}
              disabled={salvando}
              className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground/70 hover:border-primary/40 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de sessões */}
      {sessoes === null && !erro && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {sessoes && sessoes.length === 0 && !abrindo && (
        <p className="text-sm text-muted-foreground py-2">Nenhuma sessão registrada ainda.</p>
      )}

      <div className="space-y-3">
        {(sessoes ?? []).map((s) => {
          const tipo = tipoPorFicha.get(s.ficha_id);
          const ordinaisDaSessao = ordinaisPorSessao.get(s.id);
          return (
            <div key={s.id} className="rounded-xl border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-foreground">{dataBR(s.data)}</p>
                    {multi && tipo && (
                      <span className="text-xs rounded-full bg-lavender-soft px-2 py-0.5 text-primary">
                        {FICHAS[tipo]?.emoji ?? ""} {nomeCurto(tipo)}
                      </span>
                    )}
                  </div>
                  {s.areas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.areas.map((a) => (
                        <span
                          key={a}
                          className="rounded-full bg-secondary/60 px-2.5 py-0.5 text-xs text-foreground/70"
                        >
                          {a}
                          {ordinaisDaSessao?.has(a) && (
                            <span className="text-foreground/50"> · {ordinaisDaSessao.get(a)}ª sessão</span>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  {s.observacao && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {s.observacao}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remover(s)}
                  title="Excluir sessão"
                  className="shrink-0 text-muted-foreground/60 hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Status de confirmação */}
              <div className="mt-3 pt-3 border-t border-border/60">
                {s.confirmado ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-primary font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Confirmado pela cliente
                    {s.confirmado_em && (
                      <span className="text-muted-foreground font-normal">
                        · {confirmadaEm(s.confirmado_em)}
                      </span>
                    )}
                  </span>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Aguardando confirmação
                    </span>
                    <div className="flex gap-2 sm:ml-auto">
                      <button
                        type="button"
                        onClick={() => copiar(s)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-foreground/80 hover:border-primary/40 transition-colors"
                      >
                        {copiadoId === s.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copiadoId === s.id ? "Copiado" : "Copiar link"}
                      </button>
                      <a
                        href={whatsappDe(s)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
