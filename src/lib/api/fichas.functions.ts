import process from "node:process";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Grava uma ficha de anamnese no Supabase.
// Roda SÓ no servidor: usa a chave secreta service_role (que nunca chega
// ao navegador) e ignora o RLS. Assim o público consegue enviar a ficha
// sem poder ler nem escrever direto no banco.

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
    // URL é pública (inlined em build). Chave secreta vem do ambiente em runtime.
    const url =
      (import.meta.env.VITE_SUPABASE_URL as string | undefined) ||
      "https://jjkmgkorqzbroebhksca.supabase.co";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error("Supabase não configurado no servidor.");
    }
    if (!data.termo_aceito) {
      throw new Error("É necessário aceitar o termo de responsabilidade.");
    }

    const res = await fetch(`${url}/rest/v1/fichas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
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
