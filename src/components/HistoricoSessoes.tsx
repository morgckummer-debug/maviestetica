import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Loader2, MessageCircle, Plus, Trash2 } from "lucide-react";
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
  atualizarFicha,
  type SessaoAtendimento,
} from "@/lib/painel";

// Uma opção de procedimento = uma ficha da cliente (depilação, facial...).
// `pacotes` traz quantas sessões de cada item ela comprou (se informado).
export type Procedimento = {
  id: string;
  tipo: Tipo;
  nome: string;
  pacotes: Record<string, number>;
};

// Data de hoje em "YYYY-MM-DD" no fuso local (para o <input type="date">).
function hojeISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

// Número em formato internacional para o link do WhatsApp abrir direto na
// conversa da cliente (sem pedir pra escolher o contato). Números salvos
// aqui são sempre nacionais (DDD + número, 10 ou 11 dígitos) — prefixamos
// o código do Brasil (55), igual ao resto do site (ver data/services.ts).
function numeroWhatsapp(telefone: string | null | undefined): string {
  const d = String(telefone ?? "").replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
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

// Uma linha do histórico compacto: uma sessão dentro do grupo de um item
// (ex.: a 2ª linha do grupo "Axilas").
type LinhaSessao = {
  sessaoId: string;
  data: string;
  ordinal: number;
  confirmado: boolean;
  confirmado_em: string | null;
  token: string;
};

// Um grupo = um item (área/procedimento) de uma ficha, com suas sessões em
// ordem cronológica. Ex.: "Axilas" agrupa todas as sessões de axila, cada
// uma numerada (1ª, 2ª, 3ª...) — o "pacote" de sessões daquele item.
type GrupoItem = {
  chave: string;
  fichaId: string;
  tipo: Tipo;
  item: string;
  linhas: LinhaSessao[];
  maisRecente: string;
};

// Agrupa as sessões por item (não por data), para o histórico compacto:
// cada item vira uma lista curta de linhas coloridas por confirmação.
// Sessões sem nenhum item (só observação) caem à parte, em "Outras sessões".
function agruparPorItem(
  sessoes: SessaoAtendimento[],
  tipoPorFicha: Map<string, Tipo>,
): { grupos: GrupoItem[]; semItem: SessaoAtendimento[] } {
  const porChave = new Map<string, GrupoItem>();
  const semItem: SessaoAtendimento[] = [];
  const ordenadas = [...sessoes].sort((a, b) =>
    `${a.data}T${a.created_at}`.localeCompare(`${b.data}T${b.created_at}`),
  );
  for (const s of ordenadas) {
    if (s.areas.length === 0) {
      semItem.push(s);
      continue;
    }
    for (const item of s.areas) {
      const chave = `${s.ficha_id}::${item}`;
      let g = porChave.get(chave);
      if (!g) {
        g = {
          chave,
          fichaId: s.ficha_id,
          tipo: tipoPorFicha.get(s.ficha_id) ?? "laser",
          item,
          linhas: [],
          maisRecente: s.data,
        };
        porChave.set(chave, g);
      }
      g.linhas.push({
        sessaoId: s.id,
        data: s.data,
        ordinal: g.linhas.length + 1,
        confirmado: s.confirmado,
        confirmado_em: s.confirmado_em,
        token: s.token,
      });
      if (s.data > g.maisRecente) g.maisRecente = s.data;
    }
  }
  const grupos = [...porChave.values()].sort((a, b) => b.maisRecente.localeCompare(a.maisRecente));
  semItem.sort((a, b) => b.data.localeCompare(a.data));
  return { grupos, semItem };
}

// Histórico de sessões: o "caderninho" digital da cliente. A Marina registra
// data + itens realizados + observação; a cliente confirma pelo link (vale
// como assinatura). Aceita várias fichas: a cliente escolhe o procedimento.
export function HistoricoSessoes({
  fichas,
  nomeCliente,
  telefoneCliente,
}: {
  fichas: Procedimento[];
  nomeCliente: string;
  telefoneCliente?: string | null;
}) {
  const [sessoes, setSessoes] = useState<SessaoAtendimento[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const [abrindo, setAbrindo] = useState(false);
  const [fichaId, setFichaId] = useState(fichas[0]?.id ?? "");
  const [data, setData] = useState(hojeISO());
  const [itens, setItens] = useState<string[]>([]);
  const [observacao, setObservacao] = useState("");
  const [pacotesForm, setPacotesForm] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Pacotes salvos nesta sessão do painel (além dos que já vieram nas
  // fichas), pra refletir na hora sem precisar recarregar a página.
  const [pacotesOverride, setPacotesOverride] = useState<Record<string, number>>({});

  const fichaPorId = useMemo(() => {
    const m = new Map<string, Procedimento>();
    fichas.forEach((f) => m.set(f.id, f));
    return m;
  }, [fichas]);

  // Quantas sessões desse item a cliente comprou (se já informado).
  const pacoteDoItem = (fId: string, item: string): number | undefined => {
    const chave = `${fId}::${item}`;
    if (chave in pacotesOverride) return pacotesOverride[chave];
    return fichaPorId.get(fId)?.pacotes[item];
  };

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
    setPacotesForm({});
    setData(hojeISO());
    setAbrindo(true);
  };

  const registrar = async () => {
    setSalvando(true);
    setErro(null);
    try {
      const nova = await criarSessao(fichaId, { data, areas: itens, observacao });
      setSessoes((prev) => [nova, ...(prev ?? [])]);

      // Salva o tamanho do pacote informado para os itens que ainda não
      // tinham um definido. Erro aqui não desfaz a sessão já registrada —
      // só avisa à parte.
      const entradas = Object.entries(pacotesForm)
        .filter(([item, v]) => itens.includes(item) && v.trim())
        .map(([item, v]) => [item, parseInt(v, 10)] as const)
        .filter(([, n]) => n > 0);
      if (entradas.length > 0) {
        try {
          const pacotesAtuais = fichaPorId.get(fichaId)?.pacotes ?? {};
          const merge = { ...pacotesAtuais };
          const novoOverride: Record<string, number> = {};
          for (const [item, n] of entradas) {
            merge[item] = n;
            novoOverride[`${fichaId}::${item}`] = n;
          }
          await atualizarFicha(fichaId, { pacotes: merge });
          setPacotesOverride((prev) => ({ ...prev, ...novoOverride }));
        } catch {
          setErro("Sessão registrada, mas não foi possível salvar o tamanho do pacote.");
        }
      }

      setAbrindo(false);
      setItens([]);
      setObservacao("");
      setPacotesForm({});
      setData(hojeISO());
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar sessão.");
    } finally {
      setSalvando(false);
    }
  };

  const remover = async (sessaoId: string) => {
    const s = (sessoes ?? []).find((x) => x.id === sessaoId);
    if (!s) return;
    const detalhe = s.areas.length > 0 ? ` (${s.areas.join(", ")})` : "";
    if (!window.confirm(`Excluir a sessão de ${dataBR(s.data)}${detalhe}?`)) return;
    try {
      await excluirSessao(sessaoId);
      setSessoes((prev) => (prev ?? []).filter((x) => x.id !== sessaoId));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao excluir sessão.");
    }
  };

  const linkDe = (token: string) => `${origin}/confirmar/${token}`;

  const copiar = async (sessaoId: string, token: string) => {
    try {
      await navigator.clipboard.writeText(linkDe(token));
      setCopiadoId(sessaoId);
      setTimeout(() => setCopiadoId((c) => (c === sessaoId ? null : c)), 2000);
    } catch {
      /* ignore */
    }
  };

  const whatsappDe = (token: string, data: string) => {
    const primeiro = nomeCliente.trim().split(" ")[0] || "";
    const msg = `Oi ${primeiro}! Confirme seu atendimento na MAVI do dia ${dataBR(data)}, é rapidinho: ${linkDe(token)}`;
    const numero = numeroWhatsapp(telefoneCliente);
    return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
  };

  const podeSalvar = fichaId && (itens.length > 0 || observacao.trim());

  // Agrupado por item (área/procedimento), para o histórico compacto.
  const { grupos, semItem } = useMemo(
    () => agruparPorItem(sessoes ?? [], tipoPorFicha),
    [sessoes, tipoPorFicha],
  );

  // Nº de sessões já registradas de cada item do procedimento escolhido no
  // formulário, para mostrar "Axilas · seria a 5ª sessão" antes de salvar.
  const contagemDoProcedimento = useMemo(() => {
    const m = new Map<string, number>();
    (sessoes ?? [])
      .filter((s) => s.ficha_id === fichaId)
      .forEach((s) => s.areas.forEach((a) => m.set(a, (m.get(a) ?? 0) + 1)));
    return m;
  }, [sessoes, fichaId]);

  // Itens marcados neste registro que ainda não têm pacote definido — pode
  // ser sessão avulsa (fica sem pacote) ou a Marina define agora, mesmo que
  // não seja a 1ª sessão (ex.: cliente experimentou avulso e comprou depois).
  const itensSemPacote = itens.filter((item) => pacoteDoItem(fichaId, item) === undefined);

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

          {itensSemPacote.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Pacote comprado (opcional)
              </label>
              <p className="text-xs text-muted-foreground/80 mb-2">
                Deixe em branco se for sessão avulsa. Pode informar aqui ou mais tarde, quando ela
                decidir comprar o pacote.
              </p>
              <div className="space-y-2">
                {itensSemPacote.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-sm text-foreground/80 flex-1 truncate">{item}</span>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={pacotesForm[item] ?? ""}
                      onChange={(e) =>
                        setPacotesForm((prev) => ({ ...prev, [item]: e.target.value }))
                      }
                      placeholder="nº de sessões"
                      className="w-32 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                ))}
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

      <div>
        {grupos.map((g) => {
          const pacoteTotal = pacoteDoItem(g.fichaId, g.item);
          const completo = pacoteTotal !== undefined && g.linhas.length >= pacoteTotal;
          return (
          <div key={g.chave} className="mb-5 last:mb-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h4 className="text-sm font-medium text-foreground">{g.item}</h4>
              {multi && (
                <span className="text-xs text-muted-foreground">
                  {FICHAS[g.tipo]?.emoji ?? ""} {nomeCurto(g.tipo)}
                </span>
              )}
              {pacoteTotal !== undefined ? (
                <span
                  className={`text-xs ${completo ? "text-emerald-600 dark:text-emerald-500 font-medium" : "text-muted-foreground"}`}
                >
                  · {Math.min(g.linhas.length, pacoteTotal)} de {pacoteTotal} sessões
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  · {g.linhas.length} sessõe{g.linhas.length === 1 ? "" : "s"} registrada
                  {g.linhas.length === 1 ? "" : "s"}
                </span>
              )}
            </div>
            {pacoteTotal !== undefined && (
              <div className="h-1.5 w-full max-w-[220px] rounded-full bg-secondary/60 overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all ${completo ? "bg-emerald-500" : "bg-primary"}`}
                  style={{ width: `${Math.min(100, (g.linhas.length / pacoteTotal) * 100)}%` }}
                />
              </div>
            )}
            <ul className="space-y-1">
              {g.linhas.map((l) => (
                <li key={l.sessaoId + g.item} className="flex items-center gap-2 text-sm">
                  {l.confirmado && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                  )}
                  <span
                    title={
                      l.confirmado_em ? `Confirmado em ${confirmadaEm(l.confirmado_em)}` : undefined
                    }
                    className={
                      l.confirmado
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-500"
                    }
                  >
                    {dataBR(l.data)}: {l.ordinal}ª sessão (
                    {l.confirmado ? "confirmado pelo cliente" : "aguardando confirmação"})
                  </span>
                  {!l.confirmado && (
                    <span className="flex items-center gap-1.5 ml-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => copiar(l.sessaoId, l.token)}
                        title="Copiar link"
                        className="text-muted-foreground/60 hover:text-primary transition-colors"
                      >
                        {copiadoId === l.sessaoId ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={whatsappDe(l.token, l.data)}
                        target="_blank"
                        rel="noreferrer"
                        title="Enviar por WhatsApp"
                        className="text-muted-foreground/60 hover:text-primary transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remover(l.sessaoId)}
                    title="Excluir sessão"
                    className={`shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors ${l.confirmado ? "ml-auto" : ""}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
          );
        })}

        {semItem.length > 0 && (
          <div className="mb-5 last:mb-0">
            <h4 className="text-sm font-medium text-foreground mb-1.5">Outras sessões</h4>
            <ul className="space-y-1">
              {semItem.map((s) => (
                <li key={s.id} className="flex items-center gap-2 text-sm">
                  {s.confirmado && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />
                  )}
                  <span
                    title={s.confirmado_em ? `Confirmado em ${confirmadaEm(s.confirmado_em)}` : undefined}
                    className={
                      s.confirmado
                        ? "text-emerald-700 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-500"
                    }
                  >
                    {dataBR(s.data)}
                    {s.observacao ? `: ${s.observacao}` : ""} (
                    {s.confirmado ? "confirmado pelo cliente" : "aguardando confirmação"})
                  </span>
                  {!s.confirmado && (
                    <span className="flex items-center gap-1.5 ml-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => copiar(s.id, s.token)}
                        title="Copiar link"
                        className="text-muted-foreground/60 hover:text-primary transition-colors"
                      >
                        {copiadoId === s.id ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <a
                        href={whatsappDe(s.token, s.data)}
                        target="_blank"
                        rel="noreferrer"
                        title="Enviar por WhatsApp"
                        className="text-muted-foreground/60 hover:text-primary transition-colors"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => remover(s.id)}
                    title="Excluir sessão"
                    className={`shrink-0 text-muted-foreground/40 hover:text-destructive transition-colors ${s.confirmado ? "ml-auto" : ""}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
