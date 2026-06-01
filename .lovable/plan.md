## Trocar logo do MAVI

1. Copiar a imagem enviada (`mavi (1).png`) para `src/assets/logo-mavi-dark.png`.
2. Atualizar `src/components/layout/Header.tsx` e `src/components/layout/Footer.tsx` para importar e usar `logo-mavi-dark.png` no lugar do logo claro atual.
3. Remover o `logo-mavi.png` antigo (não usado em mais lugares) para manter o projeto limpo.
4. Verificar contraste sobre o fundo off-white do header/footer e ajustar tamanho se necessário.