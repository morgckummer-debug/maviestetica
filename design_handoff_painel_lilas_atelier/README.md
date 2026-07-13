# Handoff: Painel MAVI — Redesign "Lilás Atelier"

## Overview
Novo visual para o Painel administrativo (área logada da Marina/Mavi) do app de clínica de estética. Cobre 3 telas: login, lista de clientes, e detalhe da cliente. Objetivo: modernizar o visual datado atual usando a paleta de marca (lavanda/lilás/bege/dourado) com um tom mais luxuoso/premium.

## Sobre os arquivos de design
O arquivo `design-reference.html` é uma **referência visual em HTML** — um mockup estático mostrando aparência e estrutura pretendidas, não código de produção para copiar direto. A tarefa é **recriar este design no ambiente já existente do projeto** (React + TanStack Router + Tailwind v4, conforme `src/styles.css` e as rotas em `src/routes/painel*.tsx`), reaproveitando os componentes e a lógica que já existem — apenas atualizando estilos/markup, não o comportamento.

## Fidelidade
**Alta fidelidade (hifi)** — cores, tipografia e espaçamento exatos devem ser recriados pixel a pixel. É mockup visual apenas (sem interatividade real).

## Escopo
Somente o **Painel admin** (`src/routes/painel.tsx`, `painel.index.tsx`, `painel.cliente.$id.tsx`). Nenhuma outra tela do app (home, avaliação, etc.) foi redesenhada.

## Telas

### 1. Login (`painel.tsx` → `LoginForm`)
- Fundo: `#faf6fb` (lilás muito claro), sem gradiente pesado.
- Dois anéis concêntricos decorativos, dourado translúcido, centrados atrás do card: `border: 1px solid rgba(196,169,64,.35)` (80×80px) e `rgba(196,169,64,.18)` (120×120px), `border-radius: 100px`.
- Label superior "CLÍNICA": Inter 11px, `letter-spacing: .22em`, cor `#b3924c` (dourado).
- Título "MAVI": Cormorant Garamond italic, 48px, cor `#6d4d84`.
- Card de login: fundo branco, `border: 1px solid #ecdff4`, `border-radius: 20px`, padding `38px 36px`, `box-shadow: 0 24px 50px -30px rgba(120,80,150,.25)`.
- Campo "Usuária": select-like, fundo `#faf6fb`, borda `#ecdff4`, texto `#4a3559`, chevron `#a685bb`.
- Campo "Senha": mesmo estilo, mostrando `••••••••`.
- Botão "Entrar": pill 100% largura, fundo `#9a6fb0`, texto branco, `border-radius: 100px`, padding `14px`.
- Labels dos campos: Inter 11px, `letter-spacing: .06em`, cor `#a685bb`.

### 2. Lista de clientes (`painel.index.tsx`)
- Card container: fundo `#faf6fb`, borda `#ecdff4`, sem sombra pesada (`0 40px 80px -20px rgba(120,80,150,.16)`).
- Header: título "Painel *MAVI*" (Cormorant 26px, "MAVI" itálico cor `#9a6fb0`); à direita, avatar circular roxo (`#9a6fb0`, iniciais brancas) + nome + chevron, dentro de um botão pill outline (`border: 1px solid #ecdff4`).
- Busca: input pill, ícone de lupa `#a685bb`, fundo branco, borda `#ecdff4`, placeholder `#b7a3c6`.
- Título "Clientes": Cormorant 34px, cor `#4a3559`. Contagem à direita: Inter 13px `#a685bb`.
- Chips de filtro (tipo de procedimento): pill ativo roxo sólido (`#9a6fb0`, texto branco); inativos: fundo branco, borda `#ecdff4`, texto `#7a638c`.
- Cards de cliente: fundo branco, borda `#ecdff4`, `border-radius: 14px`, padding `20px 24px`. Nome em Inter 15px `#4a3559`; badge de tipo de procedimento (pill `#f1e4f5` bg, texto `#9a6fb0`); telefone/contagem de fichas em `#b7a3c6`. Ícone câmera dourado (`#b3924c`) quando autorizou foto, cinza-lilás claro (`#d9c8e8`) quando não. Badge de alerta: fundo `#f6dde3`, texto `#a45d6f`.

### 3. Detalhe da cliente (`painel.cliente.$id.tsx`)
- Link "Todas as clientes" com seta, Inter 13px `#a685bb`.
- Badge de tipo de procedimento no topo (mesmo estilo dos chips).
- Nome da cliente: Cormorant 36px `#4a3559`.
- Bloco de alerta (ex.: anticoagulante): fundo `#f6dde3`, borda `#eabfca`, texto e ícone `#a45d6f`, `border-radius: 14px`.
- Bloco "Histórico de sessões": borda `#ecdff4`, `border-radius: 16px`, padding `26px 30px`. Barra de progresso: trilho `#ecdff4`, preenchimento dourado `#b3924c`.
- Título "Fichas" (Cormorant 24px) + botão "Enviar ficha" (pill roxo sólido `#9a6fb0`, texto branco).
- Cards de ficha: mesmo padrão visual dos cards de cliente da lista.

## Design Tokens

**Cores**
- Roxo primário (CTA, destaque): `#9a6fb0`
- Roxo escuro (texto títulos): `#4a3559`
- Lilás texto secundário: `#a685bb` / `#b7a3c6`
- Lilás claro (bg de badges): `#f1e4f5`
- Bordas/linhas: `#ecdff4`
- Fundo geral: `#faf6fb`
- Dourado (acento, ícones de destaque): `#b3924c`
- Rosa de alerta: fundo `#f6dde3`, texto `#a45d6f`, borda `#eabfca`

**Tipografia**
- Display (títulos): "Cormorant Garamond", serif — pesos 400/500/600, itálico usado em destaques ("MAVI").
- Texto/UI: "Inter", sans-serif — pesos 400/500/600.
- Escala: título de tela 34–48px; subtítulo de seção 24–26px; corpo 13–15px; labels/microcopy 11–12px.

**Formas**
- `border-radius: 100px` em pills (botões, badges, inputs, chips).
- `border-radius: 14–20px` em cards e painéis.
- Bordas finas de 1px em `#ecdff4` no lugar de sombras pesadas — sombras usadas apenas nos cards principais, bem suaves e difusas (`box-shadow` com blur alto e baixa opacidade).

## Assets
Nenhum asset de imagem novo. Ícones são outline SVG estilo Lucide (mesma biblioteca já usada no repo: `lucide-react`) — manter os mesmos ícones (`Search`, `Camera`, `CameraOff`, `AlertTriangle`, `ChevronDown`, `ArrowLeft`, `ChevronRight`, `Send`, `KeyRound`, etc.) apenas recolorindo conforme os tokens acima.

## Arquivos
- `design-reference.html` — as 3 telas (login, lista, detalhe) lado a lado, prontas para abrir no navegador.
- `screenshots/01-screen.png` — tela de login
- `screenshots/02-screen.png` — lista de clientes
- `screenshots/03-screen.png` — detalhe da cliente
