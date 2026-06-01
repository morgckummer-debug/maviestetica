## Visão geral

Redesign completo do site da **MAVI Centro de Estética** (Sete Lagoas/MG), substituindo a aparência atual roxa carregada por uma estética spa premium inspirada na referência Serenity — paleta lavanda/off-white, formas orgânicas suaves, tipografia editorial, muito respiro.

Estrutura: **home única + uma página dedicada por serviço** (8 páginas de serviço, melhor para SEO local).

## Identidade visual

- **Paleta** (em `src/styles.css` via tokens OKLCH):
  - Background: off-white quente `#fbf9f7`
  - Lavanda suave: `#e9dff0`
  - Lavanda média: `#b89dc4`
  - Roxo profundo (texto/primário): `#5a3d6b`
  - Accent quente (CTA): `#c97b8a` (rosé)
- **Tipografia** (via `@fontsource`):
  - Display: **Cormorant Garamond** (serifa elegante, h1/h2)
  - Body: **Inter** (sans-serif limpa)
- **Linguagem visual**: blobs orgânicos lavanda no hero (SVG), cantos arredondados generosos, sombras suaves, animações sutis de fade/slide com Motion, sem gradientes agressivos.

## Arquitetura de rotas

```text
src/routes/
  __root.tsx          (header + footer compartilhados, meta padrão)
  index.tsx           /                 Home
  servicos/
    power-redux.tsx              /servicos/power-redux
    drenagem-linfatica.tsx       /servicos/drenagem-linfatica
    depilacao-laser.tsx          /servicos/depilacao-laser
    hidragloss.tsx               /servicos/hidragloss
    pos-operatorio.tsx           /servicos/pos-operatorio
    limpeza-de-pele.tsx          /servicos/limpeza-de-pele
    drenagem-gestantes.tsx       /servicos/drenagem-gestantes
    corrente-russa.tsx           /servicos/corrente-russa
```

Cada rota de serviço tem `head()` próprio (title + description + og:title/og:description) para SEO. Home não tem og:image; cada serviço usa a foto do tratamento como og:image.

## Conteúdo da Home

1. **Hero** — nome MAVI em serifa, tagline "Seja a sua melhor versão", botões WhatsApp + Instagram, blob lavanda decorativo, imagem still-life à direita.
2. **Sobre a clínica** — texto curto sobre cuidado, expertise e localização em Sete Lagoas.
3. **Grade de serviços** — 8 cards (foto + nome) levando à página de cada serviço; layout assimétrico inspirado na referência.
4. **Diferenciais** — 3 colunas: profissionais qualificados, tecnologia de ponta, atendimento humanizado.
5. **Depoimentos** — carrossel/grid de 3-4 reviews (placeholders editáveis).
6. **Contato** — WhatsApp (31 97167-1266), Instagram (@mavicentrodeestetica), endereço/horário como placeholders editáveis.
7. **Footer** — logo, links rápidos, redes sociais, copyright.

## Página de serviço (template padrão)

Layout consistente para os 8 serviços:
- Hero pequeno com nome do tratamento + breadcrumb
- Imagem do tratamento (reaproveitada do site atual)
- "O que é" + "Para quem é indicado" + "Benefícios" (3 blocos)
- CTA WhatsApp "Agende sua avaliação"
- Bloco "Outros tratamentos" com 3 cards relacionados

## Imagens

- Baixar as 8 fotos do site atual (`esteticamavi.com.br`) e salvar em `src/assets/services/` para garantir hospedagem própria e performance.
- Hero recebe **1 imagem nova gerada** estilo still-life lavanda (frasco + lavanda seca + textura) para combinar com a referência Serenity — única foto nova, conforme você pediu para reaproveitar as existentes nos serviços.
- Logo: reaproveitar a logo MAVI atual (`mavi-roxo-1.png`) salvando em `src/assets/`.

## Componentes reutilizáveis

```text
src/components/
  layout/Header.tsx           (nav + logo + CTA WhatsApp)
  layout/Footer.tsx
  sections/Hero.tsx
  sections/About.tsx
  sections/ServicesGrid.tsx
  sections/Differentials.tsx
  sections/Testimonials.tsx
  sections/Contact.tsx
  ui/ServiceCard.tsx
  ui/OrganicBlob.tsx          (SVG decorativo)
  service/ServicePage.tsx     (template das páginas de serviço)
```

Dados dos serviços centralizados em `src/data/services.ts` (slug, nome, descrição, indicações, benefícios, imagem) para alimentar tanto a grade da home quanto cada página individual.

## Detalhes técnicos

- **Stack**: TanStack Start (já configurado), Tailwind v4 com tokens semânticos no `src/styles.css`, shadcn/ui para botões e cards.
- **Animações**: `motion/react` (instalar via bun) para fade-in sutil em scroll.
- **Fontes**: `bun add @fontsource/cormorant-garamond @fontsource/inter`, importadas em `src/router.tsx` ou no shell raiz.
- **SEO**: cada rota com `head()` próprio; `robots.txt` e `sitemap.xml` atualizados em `public/` com as 9 rotas; lang `pt-BR` no `<html>`.
- **Responsividade**: mobile-first, breakpoints `md`/`lg`. Header colapsa em menu hambúrguer no mobile.
- **Acessibilidade**: alt em todas as imagens, contraste AA, focus states visíveis, `<h1>` único por página.

## Itens em aberto (preencho como placeholder para você editar depois)

- Endereço completo em Sete Lagoas
- Horário de funcionamento
- E-mail de contato
- Depoimentos reais de clientes (uso textos placeholder elegantes)

Posso prosseguir e implementar nesse formato?