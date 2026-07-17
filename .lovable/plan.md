## Objetivo

Definir uma imagem fixa de preview (`og:image` / `twitter:image`) para a home, para que o dashboard do Lovable, WhatsApp, Google e redes sociais mostrem sempre um screenshot do Hero — em vez de a plataforma tirar uma nova captura a cada publicação.

## Passos

1. **Capturar o Hero atual** com Playwright em 1200×630 (tamanho canônico de og:image), viewport desktop, salvando em `/mnt/documents/og-hero.png` para revisão.
2. **Publicar como asset CDN** via `lovable-assets`, gerando `src/assets/og-hero.png.asset.json` com URL estável (não muda em republicações futuras).
3. **Adicionar `og:image` e `twitter:image`** apenas em `src/routes/index.tsx` (leaf route — nunca no `__root.tsx`, senão sobrescreveria todas as páginas de serviço). Vou usar a URL absoluta do CDN Lovable.
4. **Manter as páginas de serviço intactas** — cada `/servicos/$slug` já tem sua própria imagem no head e continua com preview próprio.

## Detalhes técnicos

- `og:image` só entra no leaf, conforme regra do TanStack Start (root concatena em todas as rotas).
- Dimensões 1200×630 = padrão Open Graph/Twitter Large Card, exigido para renderizar corretamente no WhatsApp e LinkedIn.
- URL do asset é imutável e sobrevive a redeploys.
- **Cache**: WhatsApp, Facebook e o próprio dashboard do Lovable guardam o preview anterior. Depois de publicar, o novo preview aparece automaticamente com o tempo; para forçar, dá pra usar o depurador de link de cada plataforma.

## Fora do escopo

- Não altero layout do Hero, cores, textos nem o `hero-bg.jpg` existente.
- Não mexo em `__root.tsx` nem em outras rotas.
