## Objetivo

Gerar uma nova **social image** (og:image) da MAVI otimizada para pré-visualização no WhatsApp e demais redes, substituindo a atual — que é um screenshot direto do Hero e fica com corte/legibilidade ruins no card quadrado do WhatsApp.

## Por que refazer

- WhatsApp corta a imagem em ~1.91:1 e prioriza o centro; o screenshot atual perde a marca e o texto principal fica truncado.
- Precisamos de uma arte **desenhada para 1200×630** com logo, nome da clínica, cidade e uma frase curta — legível em thumbnail pequeno.

## O que vou fazer

1. **Gerar uma nova imagem 1200×630** com layout editorial:
   - Fundo: tom lavanda suave da paleta atual + textura sutil (mesma linguagem do site).
   - Foto do Hero (massagem) em composição lateral, com máscara arredondada.
   - Logo MAVI + "Centro de Estética · Sete Lagoas, MG".
   - Chamada: *"Seja a sua melhor versão."*
   - Área segura central (~1200×630 recortado para 1200×628 no WhatsApp) garantindo que logo e frase nunca sejam cortados.
2. Publicar no CDN Lovable via `lovable-assets` como `src/assets/og-social.png.asset.json`.
3. **Substituir** `ogHero` por `ogSocial` em `src/routes/index.tsx` (og:image + twitter:image).
4. Aplicar o mesmo `og:image` como **default sitewide** em `src/routes/__root.tsx`, para que qualquer página compartilhada (serviços, drenagem, power-redux, avaliação) mostre a arte da marca quando a rota não define uma imagem própria.
5. Remover o antigo `src/assets/og-hero.png.asset.json` (não usado depois da troca) via `lovable-assets delete`.

## Observações

- WhatsApp e Facebook mantêm cache da imagem por dias. Depois de publicar, para forçar atualização use o [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) colando a URL — isso também limpa o cache que o WhatsApp consulta.
- As páginas de serviço continuam podendo sobrescrever com a foto do próprio tratamento (já fazem isso hoje via `service.image`); o default do root só entra quando a rota não define og:image.
