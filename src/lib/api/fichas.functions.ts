import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { SUPABASE_URL, SUPABASE_ANON_KEY } from "../supabase";

// Grava uma ficha de anamnese no Supabase.
// Usa a chave PÚBLICA (anon) — o banco só permite inserir, nunca ler
// (policy do 0003_anon_insert.sql). Ler as fichas continua restrito à
// Marina logada. Não precisa de chave secreta nem de config no hosting.

const schema = z.object({
  tipo: z.enum(["corporal", "facial", "laser"]),
  nome: z.string().min(1, "Informe o nome."),
  telefone: z.string().optional().default(""),
  respostas: z.record(z.string(), z.union([z.string(), z.boolean(), z.null()])).default({}),
  alertas: z.array(z.string()).default([]),
  termo_aceito: z.boolean(),
  autoriza_foto: z.boolean().default(false),
});

export const salvarFicha = createServerFn({ method: "POST" })
  .inputValidator(schema)
  .handler(async ({ data }) => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase não configurado (falta a chave pública).");
    }
    if (!data.termo_aceito) {
      throw new Error("É necessário aceitar o termo de responsabilidade.");
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/fichas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        tipo: data.tipo,
        nome: data.nome,
        telefone: data.telefone || null,
        respostas: data.respostas,
        alertas: data.alertas,
        termo_aceito: data.termo_aceito,
        autoriza_foto: data.autoriza_foto,
      }),
    });

    if (!res.ok) {
      const detalhe = await res.text().catch(() => "");
      console.error("Falha ao gravar ficha no Supabase:", res.status, detalhe);
      throw new Error("Não foi possível salvar a ficha. Tente novamente.");
    }

    return { ok: true } as const;
  });
