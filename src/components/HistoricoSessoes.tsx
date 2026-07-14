import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Loader2,
  MessageCircle,
  Pencil,
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
  atualizarSessao,
  atualizarFicha,
  type SessaoAtendimento,
} from "@/lib/painel";

const CINCO_MINUTOS_MS = 5 * 60 * 1000;

// Uma opção de procedimento = uma ficha da cliente (depilação, facial...).
// `pacotes` traz, por item, a lista de pacotes comprados em ordem (ex.:
// [10, 10] = comprou um pacote de 10, completou, e comprou mais 10).
// Aceita também o formato antigo (um único número), por compatibilidade.
export type Procedimento = {
  id: string;
  tipo: Tipo;
  nome: string;
  pacotes: Record<string, number | number[]>;
};

// Normaliza o valor salvo (pode ser o formato antigo — um número só — ou
// já uma lista de pacotes) para sempre trabalhar com uma lista.
function normalizarPacotes(v: number | number[] | undefined): number[] {
  if (Array.isArray(v)) return v.filter((n) => typeof n === "number" && n > 0);
  if (typeof v === "number" && v > 0) return [v];
  return [];
}

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
// (ex.: a 2ª linha do grupo "Axilas"). O número da sessão (1ª, 2ª...) não
// fica salvo aqui — é calculado depois, por segmento (pacote/avulsas), pra
// reiniciar a contagem a cada pacote novo em vez de somar tudo junto.
type LinhaSessao = {
  sessaoId: string;
  data: string;
  observacao: string | null;
  confirmado: boolean;
  confirmado_em: string | null;
  token: string;
};

// Um grupo = um item (área/procedimento) de uma ficha, com suas sessões em
// ordem cronológica. Ex.: "Axilas" agrupa todas as sessões de axila —
// depois divididas em segmentos (pacotes) por segmentarPorPacote().
type GrupoItem = {
  chave: string;
  fichaId: string;
  tipo: Tipo;
  item: string;
  linhas: LinhaSessao[];
  maisRecente: string;
};

// Um pedaço das sessões de um item que pertence a um mesmo pacote comprado
// (ou, quando `pacoteTotal` é undefined, sessões avulsas fora de pacote).
type Segmento = {
  numero: number;
  linhas: LinhaSessao[];
  pacoteTotal?: number;
  completo: boolean;
};

// Divide as sessões (já em ordem cronológica) de um item nos pacotes
// comprados, na ordem em que foram definidos: as primeiras N sessões
// pertencem ao 1º pacote, as próximas M ao 2º, e assim por diante. O que
// sobrar depois do último pacote (ou tudo, se nunca houve pacote) vira um
// segmento avulso, sem número de pacote.
function segmentarPorPacote(linhas: LinhaSessao[], pacotes: number[]): Segmento[] {
  const segmentos: Segmento[] = [];
  let indice = 0;
  pacotes.forEach((tamanho, i) => {
    if (indice >= linhas.length) return;
    const fatia = linhas.slice(indice, indice + tamanho);
    segmentos.push({ numero: i + 1, linhas: fatia, pacoteTotal: tamanho, completo: fatia.length >= tamanho });
    indice += fatia.length;
  });
  if (indice < linhas.length) {
    segmentos.push({ numero: segmentos.length + 1, linhas: linhas.slice(indice), completo: false });
  }
  return segmentos;
}

// Estado (e ações) da edição de sessão, compartilhado entre todas as
// linhas — só uma pode estar em edição por vez.
type EdicaoSessao = {
  sessaoId: string | null;
  data: string;
  observacao: string;
  salvando: boolean;
  erro: string | null;
  onData: (v: string) => void;
  onObservacao: (v: string) => void;
  onSalvar: () => void;
  onCancelar: () => void;
  onIniciar: (s: { id: string; data: string; observacao: string | null }) => void;
};

// Uma linha de sessão (data + status colorido + ações). Reaproveitada nos
// segmentos de pacote e nas sessões sem item ("Outras sessões"). Vira um
// formulário inline quando está sendo editada (ex.: corrigir a data).
function LinhaSessaoView({
  id,
  texto,
  data,
  observacao,
  confirmado,
  confirmadoEm,
  copiado,
  onCopiar,
  linkWhatsapp,
  onRemover,
  edicao,
}: {
  id: string;
  texto: string;
  data: string;
  observacao: string | null;
  confirmado: boolean;
  confirmadoEm: string | null;
  copiado: boolean;
  onCopiar: () => void;
  linkWhatsapp: string;
  onRemover: () => void;
  edicao: EdicaoSessao;
}) {
  if (edicao.sessaoId === id) {
    return (
      <li className="rounded-lg border border-painel-border bg-painel-badge-bg/50 p-3">
        <div className="mb-2">
          <label className="block text-xs font-medium text-painel-muted mb-1">Data</label>
          <input
            type="date"
            value={edicao.data}
            onChange={(e) => edicao.onData(e.target.value)}
            className="rounded-lg border border-painel-border bg-painel-bg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-painel-primary/40"
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs font-medium text-painel-muted mb-1">Observação</label>
          <textarea
            value={edicao.observacao}
            onChange={(e) => edicao.onObservacao(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="w-full rounded-lg border border-painel-border bg-painel-bg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-painel-primary/40"
          />
        </div>
        {edicao.erro && <p className="text-xs text-painel-alert-text mb-2">{edicao.erro}</p>}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={edicao.onSalvar}
            disabled={edicao.salvando}
            className="inline-flex items-center gap-1.5 rounded-full bg-painel-primary text-white px-3.5 py-1.5 text-xs font-medium hover:bg-painel-primary/90 transition-colors disabled:opacity-40"
          >
            {edicao.salvando ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Salvar
          </button>
          <button
            type="button"
            onClick={edicao.onCancelar}
            disabled={edicao.salvando}
            className="rounded-full border border-painel-border px-3.5 py-1.5 text-xs font-medium text-painel-chip-text hover:border-painel-primary/40 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 text-sm">
      {confirmado && <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-500" />}
      <span
        title={confirmadoEm ? `Confirmado em ${confirmadaEm(confirmadoEm)}` : undefined}
        className={
          confirmado ? "text-emerald-700 dark:text-emerald-400" : "text-amber-600 dark:text-amber-500"
        }
      >
        {texto}
      </span>
      {/* Celular: só editar e WhatsApp, um em cima do outro (mais espaço
          pro toque, sem risco de acertar o botão errado). Copiar e excluir
          ficam escondidos aqui — ainda disponíveis na versão desktop. */}
      <span className="flex sm:hidden flex-col items-center gap-2.5 ml-auto shrink-0">
        <button
          type="button"
          onClick={() => edicao.onIniciar({ id, data, observacao })}
          title="Editar sessão"
          className="p-1 text-painel-muted/50 hover:text-painel-primary transition-colors"
        >
          <Pencil className="h-4 w-4" />
        </button>
        {!confirmado && (
          <a
            href={linkWhatsapp}
            target="_blank"
            rel="noreferrer"
            title="Enviar por WhatsApp"
            className="p-1 text-painel-muted/50 hover:text-painel-primary transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        )}
      </span>

      <span className="hidden sm:flex items-center gap-1.5 ml-auto shrink-0">
        {!confirmado && (
          <>
            <button
              type="button"
              onClick={onCopiar}
              title="Copiar link"
              className="text-painel-muted/60 hover:text-painel-primary transition-colors"
            >
              {copiado ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <a
              href={linkWhatsapp}
              target="_blank"
              rel="noreferrer"
              title="Enviar por WhatsApp"
              className="text-painel-muted/60 hover:text-painel-primary transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          </>
        )}
        <button
          type="button"
          onClick={() => edicao.onIniciar({ id, data, observacao })}
          title="Editar sessão"
          className="text-painel-muted/40 hover:text-painel-primary transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemover}
          title="Excluir sessão"
          className="text-painel-muted/40 hover:text-painel-alert-text transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </span>
    </li>
  );
}

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
        observacao: s.observacao,
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

  // Edição de uma sessão já registrada (corrigir data/observação).
  const [editandoSessaoId, setEditandoSessaoId] = useState<string | null>(null);
  const [editData, setEditData] = useState("");
  const [editObservacao, setEditObservacao] = useState("");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  // Pacotes salvos nesta sessão do painel (além dos que já vieram nas
  // fichas), pra refletir na hora sem precisar recarregar a página.
  const [pacotesOverride, setPacotesOverride] = useState<Record<string, number[]>>({});

  // Segmentos (pacotes) já concluídos que a Marina abriu manualmente pra
  // ver os detalhes, ou pacotes em aberto que ela recolheu.
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});

  const fichaPorId = useMemo(() => {
    const m = new Map<string, Procedimento>();
    fichas.forEach((f) => m.set(f.id, f));
    return m;
  }, [fichas]);

  // Lista de pacotes comprados desse item, em ordem (ex.: [10, 10]).
  const pacotesDoItem = (fId: string, item: string): number[] => {
    const chave = `${fId}::${item}`;
    if (chave in pacotesOverride) return pacotesOverride[chave];
    return normalizarPacotes(fichaPorId.get(fId)?.pacotes[item]);
  };

  const somaPacotes = (fId: string, item: string): number =>
    pacotesDoItem(fId, item).reduce((total, n) => total + n, 0);

  const multi = fichas.length > 1;
  const tipoPorFicha = useMemo(() => {
    const m = new Map<string, Tipo>();
    fichas.forEach((f) => m.set(f.id, f.tipo));
    return m;
  }, [fichas]);

  const tipoAtual = tipoPorFicha.get(fichaId) ?? fichas[0]?.tipo ?? "laser";
  const opcoes = OPCOES_SESSAO[tipoAtual] ?? [];

  const ids = useMemo(() => fichas.map((f) => f.id), [fichas]);

  // Enquanto a Marina está registrando ou editando uma sessão, o
  // auto-refresh não troca os dados debaixo dela.
  const ocupadoRef = useRef(false);
  useEffect(() => {
    ocupadoRef.current = abrindo || editandoSessaoId !== null;
  }, [abrindo, editandoSessaoId]);

  useEffect(() => {
    setOrigin(window.location.origin);
    listarSessoesDeFichas(ids)
      .then(setSessoes)
      .catch((e) => setErro(e instanceof Error ? e.message : "Erro ao carregar sessões."));

    // Auto-refresh: pega a confirmação da cliente (ou nova sessão de
    // outro dispositivo) a cada 5min, sem precisar recarregar a página.
    const intervalo = setInterval(() => {
      if (ocupadoRef.current) return;
      listarSessoesDeFichas(ids)
        .then(setSessoes)
        .catch(() => {});
    }, CINCO_MINUTOS_MS);
    return () => clearInterval(intervalo);
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

      // Adiciona o pacote informado à lista de pacotes desse item (pode já
      // ter pacotes anteriores concluídos). Erro aqui não desfaz a sessão
      // já registrada — só avisa à parte.
      const entradas = Object.entries(pacotesForm)
        .filter(([item, v]) => itens.includes(item) && v.trim())
        .map(([item, v]) => [item, parseInt(v, 10)] as const)
        .filter(([, n]) => n > 0);
      if (entradas.length > 0) {
        try {
          const merge = { ...(fichaPorId.get(fichaId)?.pacotes ?? {}) };
          const novoOverride: Record<string, number[]> = {};
          for (const [item, n] of entradas) {
            const nova = [...pacotesDoItem(fichaId, item), n];
            merge[item] = nova;
            novoOverride[`${fichaId}::${item}`] = nova;
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

  const iniciarEdicaoSessao = (s: { id: string; data: string; observacao: string | null }) => {
    setEditandoSessaoId(s.id);
    setEditData(s.data);
    setEditObservacao(s.observacao ?? "");
    setErroEdicao(null);
  };

  const cancelarEdicaoSessao = () => {
    setEditandoSessaoId(null);
    setErroEdicao(null);
  };

  const salvarEdicaoSessao = async () => {
    if (!editandoSessaoId) return;
    setSalvandoEdicao(true);
    setErroEdicao(null);
    try {
      const observacao = editObservacao.trim() || null;
      await atualizarSessao(editandoSessaoId, { data: editData, observacao });
      setSessoes((prev) =>
        (prev ?? []).map((s) =>
          s.id === editandoSessaoId ? { ...s, data: editData, observacao } : s,
        ),
      );
      setEditandoSessaoId(null);
    } catch (e) {
      // Mostrado dentro do próprio formulário de edição — não só lá em
      // cima, senão passa despercebido quando a lista está rolada.
      setErroEdicao(e instanceof Error ? e.message : "Erro ao salvar a sessão.");
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const edicaoSessao: EdicaoSessao = {
    sessaoId: editandoSessaoId,
    data: editData,
    observacao: editObservacao,
    salvando: salvandoEdicao,
    erro: erroEdicao,
    onData: setEditData,
    onObservacao: setEditObservacao,
    onSalvar: salvarEdicaoSessao,
    onCancelar: cancelarEdicaoSessao,
    onIniciar: iniciarEdicaoSessao,
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

  // Itens marcados neste registro que estão "fora de qualquer pacote já
  // definido" — ou porque nunca tiveram pacote (avulsa/1ª sessão), ou
  // porque já completaram todos os pacotes anteriores (ex.: terminou o
  // pacote de 10 e comprou mais 10). Mostra o campo opcional nesses casos.
  const itensSemPacote = itens.filter(
    (item) => (contagemDoProcedimento.get(item) ?? 0) >= somaPacotes(fichaId, item),
  );

  // Número que a sessão a ser registrada teria DENTRO do pacote/segmento
  // atual (reinicia em 1 a cada pacote novo ou quando cai nas avulsas),
  // em vez de contar tudo junto desde a 1ª sessão do item.
  const proximaOrdinalLocal = (item: string): number => {
    const totalAtual = contagemDoProcedimento.get(item) ?? 0;
    let acumulado = 0;
    for (const tamanho of pacotesDoItem(fichaId, item)) {
      if (totalAtual < acumulado + tamanho) return totalAtual - acumulado + 1;
      acumulado += tamanho;
    }
    return totalAtual - acumulado + 1;
  };

  return (
    <div className="rounded-2xl border border-painel-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h3 className="font-display text-2xl text-painel-title">Histórico de sessões</h3>
        {!abrindo && (
          <button
            type="button"
            onClick={abrirForm}
            className="inline-flex items-center gap-1.5 rounded-full bg-painel-primary text-white px-4 py-2 text-sm font-medium hover:bg-painel-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Registrar sessão
          </button>
        )}
      </div>
      <p className="text-sm text-painel-muted mb-5">
        Registre o atendimento e envie o link para a cliente confirmar.
      </p>

      {erro && <p className="text-sm text-painel-alert-text mb-4">{erro}</p>}

      {/* Formulário de nova sessão */}
      {abrindo && (
        <div className="rounded-xl border border-painel-border bg-painel-badge-bg/40 p-4 sm:p-5 mb-6">
          {multi && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-painel-muted mb-2">
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
                          ? "bg-painel-primary border-painel-primary text-white font-medium"
                          : "bg-white border-painel-border text-painel-chip-text hover:border-painel-primary/40",
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
            <label className="block text-xs font-medium text-painel-muted mb-1.5">
              Data do atendimento
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="rounded-lg border border-painel-border bg-painel-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-painel-primary/40"
            />
          </div>

          {opcoes.length > 0 && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-painel-muted mb-2">
                {rotuloItensSessao(tipoAtual)}
              </label>
              <div className="flex flex-wrap gap-2">
                {opcoes.map((a) => {
                  const sel = itens.includes(a);
                  const proximaOrdinal = proximaOrdinalLocal(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleItem(a)}
                      className={[
                        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                        sel
                          ? "bg-painel-primary border-painel-primary text-white font-medium"
                          : "bg-white border-painel-border text-painel-chip-text hover:border-painel-primary/40",
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
              <label className="block text-xs font-medium text-painel-muted mb-1">
                Pacote comprado (opcional)
              </label>
              <p className="text-xs text-painel-muted/80 mb-2">
                Deixe em branco se for sessão avulsa. Pode informar aqui ou mais tarde, quando ela
                decidir comprar o pacote.
              </p>
              <div className="space-y-2">
                {itensSemPacote.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="text-sm text-painel-chip-text flex-1 truncate">{item}</span>
                    <input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={pacotesForm[item] ?? ""}
                      onChange={(e) =>
                        setPacotesForm((prev) => ({ ...prev, [item]: e.target.value }))
                      }
                      placeholder="nº de sessões"
                      className="w-32 rounded-lg border border-painel-border bg-painel-bg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-painel-primary/40"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-xs font-medium text-painel-muted mb-1.5">Observação</label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              placeholder="O que foi realizado, observações..."
              className="w-full rounded-xl border border-painel-border bg-painel-bg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-painel-primary/40"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={registrar}
              disabled={salvando || !podeSalvar}
              className="inline-flex items-center gap-2 rounded-full bg-painel-primary text-white px-5 py-2.5 text-sm font-medium hover:bg-painel-primary/90 transition-colors disabled:opacity-40"
            >
              {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Salvar sessão
            </button>
            <button
              type="button"
              onClick={() => setAbrindo(false)}
              disabled={salvando}
              className="rounded-full border border-painel-border px-5 py-2.5 text-sm font-medium text-painel-chip-text hover:border-painel-primary/40 transition-colors disabled:opacity-40"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Lista de sessões */}
      {sessoes === null && !erro && (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-painel-muted" />
        </div>
      )}

      {sessoes && sessoes.length === 0 && !abrindo && (
        <p className="text-sm text-painel-muted py-2">Nenhuma sessão registrada ainda.</p>
      )}

      <div>
        {grupos.map((g) => {
          const pacotes = pacotesDoItem(g.fichaId, g.item);
          const segmentos = segmentarPorPacote(g.linhas, pacotes);
          return (
            <div key={g.chave} className="mb-5 last:mb-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h4 className="text-sm font-medium text-painel-title">{g.item}</h4>
                {multi && (
                  <span className="text-xs text-painel-muted">
                    {FICHAS[g.tipo]?.emoji ?? ""} {nomeCurto(g.tipo)}
                  </span>
                )}
                {pacotes.length === 0 && (
                  <span className="text-xs text-painel-muted">
                    · {g.linhas.length} sessõe{g.linhas.length === 1 ? "" : "s"} registrada
                    {g.linhas.length === 1 ? "" : "s"}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {segmentos.map((seg) => {
                  const chaveSeg = `${g.chave}::${seg.numero}`;
                  const aberto = expandidos[chaveSeg] ?? !seg.completo;

                  // Segmento sem pacote definido: sessões avulsas.
                  if (seg.pacoteTotal === undefined) {
                    return (
                      <div key={chaveSeg}>
                        {pacotes.length > 0 && (
                          <p className="text-xs text-painel-muted mb-1">Sessões avulsas</p>
                        )}
                        <ul className="space-y-1">
                          {seg.linhas.map((l, idx) => (
                            <LinhaSessaoView
                              key={l.sessaoId}
                              id={l.sessaoId}
                              texto={`${dataBR(l.data)}: ${idx + 1}ª sessão (${l.confirmado ? "confirmado" : "aguardando confirmação"})`}
                              data={l.data}
                              observacao={l.observacao}
                              confirmado={l.confirmado}
                              confirmadoEm={l.confirmado_em}
                              copiado={copiadoId === l.sessaoId}
                              onCopiar={() => copiar(l.sessaoId, l.token)}
                              linkWhatsapp={whatsappDe(l.token, l.data)}
                              onRemover={() => remover(l.sessaoId)}
                              edicao={edicaoSessao}
                            />
                          ))}
                        </ul>
                      </div>
                    );
                  }

                  // Segmento de um pacote comprado: colapsa quando concluído.
                  return (
                    <div key={chaveSeg}>
                      <button
                        type="button"
                        onClick={() => setExpandidos((prev) => ({ ...prev, [chaveSeg]: !aberto }))}
                        className="flex flex-wrap items-center gap-1.5 mb-1.5 text-left"
                      >
                        {aberto ? (
                          <ChevronDown className="h-3.5 w-3.5 text-painel-muted shrink-0" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 text-painel-muted shrink-0" />
                        )}
                        <span
                          className={`text-xs ${seg.completo ? "text-painel-gold font-medium" : "text-painel-muted"}`}
                        >
                          Pacote {seg.numero} · {seg.linhas.length} de {seg.pacoteTotal} sessões
                          {seg.completo ? " concluído" : ""}
                        </span>
                        <span className="text-xs text-painel-primary underline underline-offset-2">
                          {aberto ? "Ocultar" : "Detalhes"}
                        </span>
                      </button>
                      <div className="h-1.5 w-full max-w-[220px] rounded-full bg-painel-border overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full bg-painel-gold transition-all"
                          style={{
                            width: `${Math.min(100, (seg.linhas.length / seg.pacoteTotal) * 100)}%`,
                          }}
                        />
                      </div>
                      {aberto && (
                        <ul className="space-y-1">
                          {seg.linhas.map((l, idx) => (
                            <LinhaSessaoView
                              key={l.sessaoId}
                              id={l.sessaoId}
                              texto={`${dataBR(l.data)}: ${idx + 1}ª sessão (${l.confirmado ? "confirmado" : "aguardando confirmação"})`}
                              data={l.data}
                              observacao={l.observacao}
                              confirmado={l.confirmado}
                              confirmadoEm={l.confirmado_em}
                              copiado={copiadoId === l.sessaoId}
                              onCopiar={() => copiar(l.sessaoId, l.token)}
                              linkWhatsapp={whatsappDe(l.token, l.data)}
                              onRemover={() => remover(l.sessaoId)}
                              edicao={edicaoSessao}
                            />
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {semItem.length > 0 && (
          <div className="mb-5 last:mb-0">
            <h4 className="text-sm font-medium text-painel-title mb-1.5">Outras sessões</h4>
            <ul className="space-y-1">
              {semItem.map((s) => (
                <LinhaSessaoView
                  key={s.id}
                  id={s.id}
                  texto={`${dataBR(s.data)}${s.observacao ? `: ${s.observacao}` : ""} (${s.confirmado ? "confirmado" : "aguardando confirmação"})`}
                  data={s.data}
                  observacao={s.observacao}
                  confirmado={s.confirmado}
                  confirmadoEm={s.confirmado_em}
                  copiado={copiadoId === s.id}
                  onCopiar={() => copiar(s.id, s.token)}
                  linkWhatsapp={whatsappDe(s.token, s.data)}
                  onRemover={() => remover(s.id)}
                  edicao={edicaoSessao}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
