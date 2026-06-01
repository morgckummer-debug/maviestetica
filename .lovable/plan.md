## Novo Hero (referência da imagem enviada)

Estrutura inspirada no modelo: fundo claro e arejado, texto à esquerda, foto à direita ocupando boa parte da seção, sem overlay roxo cobrindo a foto.

### Layout (`src/components/sections/Hero.tsx`)

```
┌─────────────────────────────────────────────┐
│  [eyebrow: Centro de Estética · Sete Lagoas]│
│                                             │
│  "Seja a sua                       [FOTO    │
│   melhor versão"                    massagem│
│                                     grande, │
│  ──── Tratamentos faciais e         lado    │
│       corporais com cuidado…        direito]│
│                                             │
│  ( Agendar avaliação )  Instagram           │
└─────────────────────────────────────────────┘
```

- Fundo da seção: claro (`bg-background` com leve gradiente lavanda muito sutil), sem foto cobrindo tudo.
- Coluna esquerda (`max-w-xl`): eyebrow em caps espaçadas, H1 grande entre aspas com `font-display italic` no destaque, divisor curto (linha + parágrafo curto ao lado), CTAs.
- Coluna direita: foto enviada (`hero-bg.jpg`) em card arredondado grande (`rounded-[2rem] lg:rounded-[3rem]`), `aspect-[4/5]`, `object-cover`, com sombra suave (`shadow-2xl shadow-primary/10`).
- Grid: `grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center`.
- Mobile: foto vai abaixo do texto, mantendo respiro.
- Manter `OrganicBlob` decorativos atrás, bem suaves (opacidade baixa).

### Estilo

- Texto volta para tokens da marca: eyebrow `text-muted-foreground`, H1 `text-foreground` com `<em>` em `text-primary italic`, parágrafo `text-muted-foreground`.
- CTA primário: pílula `bg-primary text-primary-foreground` arredondada (`rounded-full`), sombra suave.
- CTA secundário: texto + ícone, sem borda pesada (`text-foreground/80 hover:text-primary`).
- Tipografia: manter `font-display` no H1, tamanhos `text-5xl sm:text-6xl lg:text-7xl`, leading apertado.
- Espaçamento generoso: `pt-20 pb-24 lg:pt-32 lg:pb-40`.

### Conteúdo (mantém)

- Eyebrow: "Centro de Estética · Sete Lagoas"
- H1: "Seja a sua *melhor versão*." (com aspas tipográficas opcionais — confirmo com você se quiser as aspas como no modelo)
- Subtítulo curto ao lado do divisor: "Tratamentos faciais e corporais com tecnologia, sensibilidade e cuidado."
- CTAs: WhatsApp (Agendar avaliação) e Instagram.

### Imagem

Usa `src/assets/hero-bg.jpg` (foto da massagem que você já enviou) — agora visível inteira na coluna da direita, sem overlay cobrindo.

### Arquivos

- `src/components/sections/Hero.tsx` — reescrita do layout conforme acima.
- Nenhum outro arquivo precisa mudar.
