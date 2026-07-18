// Junta o endereço (rua, bairro — preenchido pelo CEP) com o número da
// casa/prédio (digitado à parte) num único texto: "Rua X, 81 - Bairro".
// O separador " - " usado no autofill do CEP (ver cep.ts) é o que permite
// separar rua e bairro aqui de volta.
export function enderecoCompleto(ruaBairro: string, numero?: string | null): string {
  const [rua, ...resto] = ruaBairro.split(" - ");
  const bairro = resto.join(" - ").trim();
  const ruaComNumero = [rua?.trim(), numero?.trim()].filter(Boolean).join(", ");
  return [ruaComNumero, bairro].filter(Boolean).join(" - ");
}
