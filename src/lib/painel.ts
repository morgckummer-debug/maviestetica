// Cliente do painel da Marina — fala com a API REST do Supabase por fetch.
// Login (Supabase Auth) + leitura/atualização das fichas. A sessão fica
// guardada no navegador (localStorage) e é renovada automaticamente.

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./supabase";
import type { Tipo } from "@/data/anamnese";

const CHAVE_SESSAO = "mavi_sessao";

export type Sessao = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // unix (segundos)
  email?: string;
};

// Uma entrada de pacote comprado (ou ganho de bônus) para um item. `bonus:
// true` marca sessões dadas de brinde numa promoção (não pagas) — usado pra
// exibir o selo "Bônus" e não confundir com o que a cliente pagou.
export type PacoteItem = { tamanho: number; bonus?: boolean };

export type Ficha = {
  id: string;
  created_at: string;
  tipo: Tipo;
  nome: string;
  telefone: string | null;
  respostas: Record<string, string | boolean | null>;
  alertas: string[];
  termo_aceito: boolean;
  autoriza_foto: boolean;
  medidas: Record<string, string>;
  relatorio: string | null;
  arquivada: boolean;
  // Soft delete: "Excluir" marca a ficha como excluída em vez de apagar de
  // verdade. Ela some das listas normais, mas fica recuperável em "Fichas
  // excluídas". Diferente de `arquivada`, que é um selo manual de cliente
  // inativa e continua aparecendo nas listas normalmente.
  excluida: boolean;
  // Pacotes comprados (ou ganhos de bônus) por item, em ordem, ex.:
  // "Axilas": [{tamanho:10}, {tamanho:2, bonus:true}] = comprou 10, completou,
  // ganhou mais 2 de brinde numa promoção. Aceita também os formatos antigos
  // (um número só, ou uma lista de números), salvos antes de existir bônus.
  pacotes: Record<string, number | number[] | PacoteItem[]>;
};

function agora(): number {
  return Math.floor(Date.now() / 1000);
}

function salvarSessao(s: Sessao | null): void {
  if (typeof window === "undefined") return;
  if (s) window.localStorage.setItem(CHAVE_SESSAO, JSON.stringify(s));
  else window.localStorage.removeItem(CHAVE_SESSAO);
}

export function lerSessao(): Sessao | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(CHAVE_SESSAO);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Sessao;
  } catch {
    return null;
  }
}

function authHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    apikey: SUPABASE_ANON_KEY ?? "",
  };
}

export async function entrar(email: string, senha: string): Promise<Sessao> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase não configurado. Verifique as variáveis de ambiente.");
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ email, password: senha }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error_description?: string;
      msg?: string;
    };
    throw new Error(err.error_description || err.msg || "E-mail ou senha inválidos.");
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    user?: { email?: string };
  };
  const sessao: Sessao = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: agora() + (data.expires_in ?? 3600),
    email: data.user?.email,
  };
  salvarSessao(sessao);
  return sessao;
}

async function renovar(sessao: Sessao): Promise<Sessao | null> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ refresh_token: sessao.refresh_token }),
  });
  if (!res.ok) {
    salvarSessao(null);
    return null;
  }
  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    user?: { email?: string };
  };
  const nova: Sessao = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: agora() + (data.expires_in ?? 3600),
    email: data.user?.email ?? sessao.email,
  };
  salvarSessao(nova);
  return nova;
}

// Retorna uma sessão válida (renovando se estiver perto de expirar) ou null.
export async function sessaoValida(): Promise<Sessao | null> {
  let s = lerSessao();
  if (!s) return null;
  if (s.expires_at - 60 <= agora()) {
    s = await renovar(s);
  }
  return s;
}

export function sair(): void {
  salvarSessao(null);
}

// Troca a senha da Marina (já autenticada) — não pede a senha atual porque
// o token de acesso válido já garante que é ela quem está pedindo.
export async function trocarSenha(novaSenha: string): Promise<void> {
  const s = await sessaoValida();
  if (!s) throw new Error("NAO_AUTENTICADO");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY ?? "",
      Authorization: `Bearer ${s.access_token}`,
    },
    body: JSON.stringify({ password: novaSenha }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error_description?: string;
      msg?: string;
    };
    throw new Error(err.error_description || err.msg || "Não foi possível trocar a senha.");
  }
}

async function apiRest(path: string, init: RequestInit = {}): Promise<Response> {
  const s = await sessaoValida();
  if (!s) throw new Error("NAO_AUTENTICADO");
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      ...init.headers,
      apikey: SUPABASE_ANON_KEY ?? "",
      Authorization: `Bearer ${s.access_token}`,
      "Content-Type": "application/json",
    },
  });
}

export async function listarFichas(): Promise<Ficha[]> {
  const res = await apiRest("fichas?select=*&excluida=eq.false&order=created_at.desc");
  if (!res.ok) throw new Error("Não foi possível carregar as fichas.");
  return (await res.json()) as Ficha[];
}

// Fichas excluídas (soft delete), para a seção "Fichas excluídas" — de
// onde dá pra restaurar.
export async function listarFichasExcluidas(): Promise<Ficha[]> {
  const res = await apiRest("fichas?select=*&excluida=eq.true&order=created_at.desc");
  if (!res.ok) throw new Error("Não foi possível carregar as fichas excluídas.");
  return (await res.json()) as Ficha[];
}

export async function obterFicha(id: string): Promise<Ficha | null> {
  const res = await apiRest(`fichas?id=eq.${encodeURIComponent(id)}&select=*`);
  if (!res.ok) throw new Error("Não foi possível carregar a ficha.");
  const arr = (await res.json()) as Ficha[];
  return arr[0] ?? null;
}

export async function atualizarFicha(
  id: string,
  patch: Partial<
    Pick<
      Ficha,
      | "medidas"
      | "relatorio"
      | "arquivada"
      | "pacotes"
      | "respostas"
      | "telefone"
      | "nome"
      | "autoriza_foto"
    >
  >,
): Promise<void> {
  const res = await apiRest(`fichas?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Não foi possível salvar as alterações.");
}

// ------------------------------------------------------------
// Sessões de atendimento (o "caderninho" digital de cada ficha).
// A Marina registra data + áreas + observação; a cliente confirma
// pelo link. Ver migração 0005_sessoes.sql.
// ------------------------------------------------------------

export type SessaoAtendimento = {
  id: string;
  ficha_id: string;
  created_at: string;
  data: string; // "YYYY-MM-DD"
  areas: string[];
  observacao: string | null;
  token: string;
  confirmado: boolean;
  confirmado_em: string | null;
  arquivado: boolean;
};

export async function listarSessoes(fichaId: string): Promise<SessaoAtendimento[]> {
  const res = await apiRest(
    `sessoes?ficha_id=eq.${encodeURIComponent(fichaId)}&select=*&order=data.desc,created_at.desc`,
  );
  if (!res.ok) throw new Error("Não foi possível carregar as sessões.");
  return (await res.json()) as SessaoAtendimento[];
}

// Sessões de várias fichas de uma vez (histórico unificado da cliente,
// que pode ter mais de um procedimento/ficha). Traz também as arquivadas —
// quem exibe filtra por `arquivado` conforme a seção (ativas vs. arquivadas).
export async function listarSessoesDeFichas(fichaIds: string[]): Promise<SessaoAtendimento[]> {
  if (fichaIds.length === 0) return [];
  const lista = fichaIds.map((id) => encodeURIComponent(id)).join(",");
  const res = await apiRest(
    `sessoes?ficha_id=in.(${lista})&select=*&order=data.desc,created_at.desc`,
  );
  if (!res.ok) throw new Error("Não foi possível carregar as sessões.");
  return (await res.json()) as SessaoAtendimento[];
}

export type SessaoPendente = SessaoAtendimento & {
  ficha: { nome: string; telefone: string | null; tipo: Tipo };
};

const DIAS_TOLERANCIA_PENDENTE = 15;

// Data de X dias atrás em "YYYY-MM-DD" no fuso local.
function diasAtrasISO(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 10);
}

// Sessões (de qualquer cliente/ficha) ainda aguardando confirmação da
// cliente pelo WhatsApp, e realizadas há pelo menos 15 dias — antes disso
// não entra na lista, pra não cutucar quem ainda está dentro do prazo
// normal de confirmar. Sessões arquivadas não entram (foram canceladas).
// Para o painel "Pendentes de confirmação".
export async function listarSessoesPendentes(): Promise<SessaoPendente[]> {
  const limite = diasAtrasISO(DIAS_TOLERANCIA_PENDENTE);
  const res = await apiRest(
    `sessoes?select=*,ficha:fichas(nome,telefone,tipo)&confirmado=eq.false&arquivado=eq.false&data=lte.${limite}&order=data.asc`,
  );
  if (!res.ok) throw new Error("Não foi possível carregar as sessões pendentes.");
  return (await res.json()) as SessaoPendente[];
}

// Data (YYYY-MM-DD) da sessão mais recente de cada ficha — só entre as não
// arquivadas, que é o que de fato conta como "procedimento feito". Usado
// pra detectar clientes sem atividade há muito tempo (ver clientes.ts).
export async function listarUltimasSessoesPorFicha(): Promise<Record<string, string>> {
  const res = await apiRest("sessoes?select=ficha_id,data&arquivado=eq.false&order=data.desc");
  if (!res.ok) throw new Error("Não foi possível carregar as datas de sessão.");
  const linhas = (await res.json()) as { ficha_id: string; data: string }[];
  const ultima: Record<string, string> = {};
  // Já vem ordenado da mais recente pra mais antiga — a 1ª ocorrência de
  // cada ficha_id é a data mais recente dela.
  for (const l of linhas) {
    if (!(l.ficha_id in ultima)) ultima[l.ficha_id] = l.data;
  }
  return ultima;
}

export async function criarSessao(
  fichaId: string,
  dados: { data: string; areas: string[]; observacao: string },
): Promise<SessaoAtendimento> {
  const res = await apiRest("sessoes", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      ficha_id: fichaId,
      data: dados.data,
      areas: dados.areas,
      observacao: dados.observacao.trim() || null,
    }),
  });
  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    if (/relation .*sessoes.* does not exist|does not exist/i.test(detalhe)) {
      throw new Error(
        "Rode a migração 0005_sessoes.sql no Supabase (SQL Editor) para ativar as sessões.",
      );
    }
    throw new Error("Não foi possível registrar a sessão.");
  }
  const arr = (await res.json()) as SessaoAtendimento[];
  return arr[0];
}

// Corrige data/observação/áreas de uma sessão já registrada (ex.: data
// digitada errada, ou marcou braços + axilas mas só fez axilas no dia).
// Não mexe em confirmação nem token.
export async function atualizarSessao(
  id: string,
  patch: Partial<Pick<SessaoAtendimento, "data" | "observacao" | "areas">>,
): Promise<void> {
  const res = await apiRest(`sessoes?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Não foi possível salvar as alterações da sessão.");
  // Se o banco não tem a policy de UPDATE em sessoes, o PostgREST responde
  // OK mas não altera nenhuma linha — sem isso, o erro passaria em
  // silêncio (é o que estava acontecendo).
  const alteradas = (await res.json().catch(() => [])) as unknown[];
  if (!Array.isArray(alteradas) || alteradas.length === 0) {
    throw new Error(
      "A alteração não foi salva no banco (permissão de atualizar sessões ausente). Rode de novo a parte de UPDATE da migração 0005_sessoes.sql no Supabase.",
    );
  }
}

// Arquiva (ou restaura) uma sessão em vez de apagar de verdade — nada é
// perdido, a sessão só some da lista ativa e pode ser restaurada depois em
// "Sessões arquivadas". Ver migração 0008_arquivar_sessoes.sql.
export async function arquivarSessao(id: string, arquivado: boolean): Promise<void> {
  const res = await apiRest(`sessoes?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ arquivado }),
  });
  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    if (/column .*arquivado.* does not exist/i.test(detalhe)) {
      throw new Error(
        "Rode a migração 0008_arquivar_sessoes.sql no Supabase (SQL Editor) para ativar o arquivamento.",
      );
    }
    throw new Error(
      arquivado ? "Não foi possível arquivar a sessão." : "Não foi possível restaurar a sessão.",
    );
  }
  const alteradas = (await res.json().catch(() => [])) as unknown[];
  if (!Array.isArray(alteradas) || alteradas.length === 0) {
    throw new Error(
      "A alteração não foi salva no banco (permissão de atualizar sessões ausente). Rode de novo a parte de UPDATE da migração 0005_sessoes.sql no Supabase.",
    );
  }
}

// Exclui (soft delete) ou restaura uma ficha — nunca apaga de verdade.
// Ver migração 0009_arquivar_fichas.sql.
async function marcarFichaExcluida(id: string, excluida: boolean): Promise<void> {
  const res = await apiRest(`fichas?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ excluida }),
  });
  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    if (/column .*excluida.* does not exist/i.test(detalhe)) {
      throw new Error(
        "Rode a migração 0009_arquivar_fichas.sql no Supabase (SQL Editor) para ativar a exclusão recuperável.",
      );
    }
    throw new Error(
      excluida ? "Não foi possível excluir a ficha." : "Não foi possível restaurar a ficha.",
    );
  }
  // Se o banco não tem a policy de UPDATE, ele responde OK mas não altera
  // nada. Detectamos isso pela lista vazia de linhas retornadas.
  const alteradas = (await res.json().catch(() => [])) as unknown[];
  if (!Array.isArray(alteradas) || alteradas.length === 0) {
    throw new Error("A alteração não foi salva no banco (permissão de atualizar fichas ausente).");
  }
}

export async function excluirFicha(id: string): Promise<void> {
  await marcarFichaExcluida(id, true);
}

export async function restaurarFicha(id: string): Promise<void> {
  await marcarFichaExcluida(id, false);
}
