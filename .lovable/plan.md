## O que mudar no Hero

A imagem arredondada da direita (`hero-stilllife.jpg` + cartão "+4 anos") está cobrindo metade da foto de fundo. Vamos removê-la e deixar o texto direto sobre a foto, com um overlay lavanda/roxo para contraste.

## Mudanças em `src/components/sections/Hero.tsx`

1. **Remover** a coluna da direita inteira:
   - O `motion.div` com a `<img src={heroImg} … />`.
   - O cartão flutuante "+4 anos".
   - O import `heroImg` de `@/assets/hero-stilllife.jpg`.

2. **Layout single-column**:
   - Trocar `grid lg:grid-cols-2 gap-12 lg:gap-20 items-center` por um container com `max-w-2xl` para o bloco de texto, alinhado à esquerda.
   - Aumentar o padding vertical (`pt-24 pb-32 lg:pt-40 lg:pb-48`) para o Hero ganhar presença sem a imagem da direita.

3. **Overlay para contraste**:
   - Substituir o gradiente atual por um overlay lavanda: `bg-gradient-to-br from-primary/55 via-primary/30 to-background/60` (puxa do roxo da marca em cima/esquerda, suaviza em direção à direita/baixo).
   - Manter a camada da foto em `opacity-75` (um pouco mais nítida, já que agora o overlay cuida do contraste).
   - Trocar o `text-primary` do H1 por `text-white` (com `drop-shadow` discreto) e o parágrafo por `text-white/90`, já que o fundo passa a ser escuro/colorido. O eyebrow vira `text-white/80` e o botão Instagram ganha borda branca translúcida.

4. **Manter** os `OrganicBlob` (eles continuam funcionando como camada decorativa atrás do overlay).

## Resultado

Hero com a foto da massagem ocupando toda a seção, um wash lavanda elegante por cima e o texto branco confortavelmente legível — sem o card da direita competindo com a foto.