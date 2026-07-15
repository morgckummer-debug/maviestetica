
## Objetivo

Expor este app como um servidor MCP protegido por OAuth 2.1 do seu Supabase, para Morgana e Marina conectarem no ChatGPT/Claude/Codex e consultarem as fichas e as sessões pendentes usando a própria conta (RLS ativa — cada uma vê só o que já vê no painel).

## Ferramentas (2, apenas leitura)

1. **`listar_fichas`** — busca fichas por nome ou telefone (ou lista as N mais recentes). Retorna: nome, telefone, tipo, data de criação, arquivada.
   - Input: `{ busca?: string, limite?: number (default 20, max 50) }`
2. **`sessoes_pendentes_confirmacao`** — lista sessões realizadas há 15+ dias ainda sem confirmação da cliente (mesmo critério do painel "Pendentes"). Retorna: nome da cliente, telefone, data, áreas.
   - Input: `{}`

Nenhuma ferramenta de escrita, nada de dados clínicos (respostas de anamnese, alertas de saúde) — só o que precisa pra "quantas fichas tenho da Fulana?" e "quem falta confirmar?".

## Arquitetura

- Pacote `@lovable.dev/mcp-js` + Vite plugin. Endpoint em `/mcp`.
- `defineMcp` com `auth.oauth.issuer({ issuer: "https://jjkmgkorqzbroebhksca.supabase.co/auth/v1", acceptedAudiences: "authenticated" })`.
- Rota de consentimento em `src/routes/[.]lovable.oauth.consent.tsx`, que reaproveita o login existente do painel (dropdown Morgana/Marina em `/painel`) — se não estiver logada, manda pra `/painel` preservando o `authorization_id`, e volta pra tela de consentir depois do login.
- Cada tool cria um cliente Supabase por-request usando o `ctx.getToken()`, então o PostgREST aplica as políticas RLS existentes das fichas/sessões como a usuária logada (Morgana ou Marina). Nada de service-role.

## Arquivos

- `bunfig.toml` — adicionar `@lovable.dev/mcp-js` nos excludes do supply-chain guard.
- `vite.config.ts` — adicionar `mcpPlugin()`.
- `src/lib/mcp/index.ts` — `defineMcp` com auth OAuth + as 2 tools.
- `src/lib/mcp/tools/listar-fichas.ts`
- `src/lib/mcp/tools/sessoes-pendentes.ts`
- `src/routes/[.]lovable.oauth.consent.tsx` — tela de consentimento, integrada ao login existente.
- `src/routes/painel.tsx` — pequeno ajuste: se a URL trouxer `?next=/.lovable/oauth/consent?...`, redirecionar pra lá após login bem-sucedido.

## O que muda pra você

Depois de publicar, você vai poder adicionar este site como conector MCP no ChatGPT/Claude/Codex. Ao conectar, o cliente abre a tela de login do painel, você escolhe Morgana ou Marina, aprova, e a partir daí o assistente pode chamar as 2 ferramentas acima como você. Nada fica exposto publicamente.
