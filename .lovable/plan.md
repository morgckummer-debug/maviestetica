## O que aconteceu

A foto anterior (`hero-bg.jpg`) estava aplicada, mas com `opacity-25` + um overlay quase opaco (`from-background/85 via-background/75 to-background`) por cima — resultado: praticamente invisível. Além disso, você acabou de enviar uma nova foto (spa/massagem) que faz mais sentido como fundo do Hero.

## Mudanças

1. **Substituir a imagem de fundo**
   - Copiar `user-uploads://IMG_2263-2.jpeg` sobre `src/assets/hero-bg.jpg` (mantém o import existente, nenhuma outra referência precisa mudar).

2. **Ajustar o `Hero.tsx` para a foto aparecer**
   - Subir a opacidade da camada da imagem de `opacity-25` para `opacity-60`.
   - Trocar o overlay sólido por um gradiente mais leve: `from-background/70 via-background/40 to-background/85` (claro no topo onde está o título, fade no meio para a foto respirar, fechando no rodapé da seção para a transição com a próxima seção).
   - Adicionar um segundo gradiente lateral só atrás do bloco de texto (lg+): `bg-gradient-to-r from-background/80 via-background/30 to-transparent`, garantindo contraste do H1/parágrafo sem escurecer a foto inteira.
   - Manter os `OrganicBlob` e o card "+4 anos".

3. **Sem mudanças** em dados, tokens, outras seções ou rotas.

## Resultado esperado

A foto da massagem aparece nítida atrás do conteúdo do Hero, com os textos ainda totalmente legíveis no mobile (393px) e no desktop.