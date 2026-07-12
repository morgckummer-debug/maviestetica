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
  const res = await apiRest("fichas?select=*&order=created_at.desc");
  if (!res.ok) throw new Error("Não foi possível carregar as fichas.");
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
  patch: Partial<Pick<Ficha, "medidas" | "relatorio" | "arquivada">>,
): Promise<void> {
  const res = await apiRest(`fichas?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error("Não foi possível salvar as alterações.");
}

export async function excluirFicha(id: string): Promise<void> {
  const res = await apiRest(`fichas?id=eq.${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  if (!res.ok) throw new Error("Não foi possível excluir a ficha.");
}
