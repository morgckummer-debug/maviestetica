## Foto de fundo no Hero

1. Copiar a imagem enviada para `src/assets/hero-bg.jpg`.
2. Atualizar `src/components/sections/Hero.tsx`:
   - Adicionar a imagem como `background-image` cobrindo toda a seção (`object-cover`, `bg-center`).
   - Aplicar overlay com a paleta off-white/lavanda (gradiente claro com ~70-80% de opacidade) para garantir contraste do texto e manter o ar premium.
   - Ajustar cores do texto/CTA se necessário para legibilidade sobre a foto suavizada.
3. Manter os blobs orgânicos e animações já existentes acima do overlay.