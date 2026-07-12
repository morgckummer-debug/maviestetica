import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../supabase";

// Confirmação pública de uma sessão de atendimento (o "assinar" da cliente).
// A cliente abre o link /confirmar/<token> no próprio celular. Estas funções
// chamam funções SECURITY DEFINER do Postgres (ver 0005_sessoes.sql), então
// usam só a chave PÚBLICA (anon) e nunca expõem a tabela nem dados de saúde.

async function rpc(fn: string, args: Record<string, unknown>): Promise<unknown> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase não configurado (falta a chave pública).");
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    const detalhe = await res.text().catch(() => "");
    console.error("Falha na RPC", fn, res.status, detalhe);
    throw new Error("Não foi possível completar a operação. Tente novamente.");
  }
  return res.json();
}

export type SessaoPublica = {
  primeiro_nome: string;
  data: string; // "YYYY-MM-DD"
  areas: string[];
  observacao: string | null;
  confirmado: boolean;
  confirmado_em: string | null;
};

// Dados mínimos para montar a tela de confirmação. Retorna null se o token
// não existir (link inválido/antigo).
export const obterSessaoPublica = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(1) }))
  .handler(async ({ data }) => {
    const rows = (await rpc("sessao_por_token", { p_token: data.token })) as SessaoPublica[];
    return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  });

// Marca a sessão como confirmada pela cliente. Retorna o momento da confirmação.
export const confirmarSessao = createServerFn({ method: "POST" })
  .inputValidator(z.object({ token: z.string().min(1) }))
  .handler(async ({ data }) => {
    const quando = (await rpc("confirmar_sessao", { p_token: data.token })) as string | null;
    return { confirmado_em: quando };
  });
