// ============================================================
//  PROMOÇÕES DO MÊS — edite aqui para atualizar o site
// ============================================================
//
//  Como funciona:
//  - Altere o array `promotions` abaixo com os combos do mês.
//  - Se não quiser exibir promoções em algum mês, deixe o array vazio: []
//  - Cada promoção pode ter um badge opcional (ex: "Mais pedido", "Novidade").
//  - validUntil: use o formato "DD/MM/AAAA".
// ============================================================

export type Promotion = {
  id: string;
  /** Exibido no topo do card — ex: "Junho 2026" */
  month: string;
  /** Data limite no formato "DD/MM/AAAA" */
  validUntil: string;
  /** Nome do combo */
  title: string;
  /** Frase curta de apoio */
  tagline: string;
  /** Lista dos procedimentos incluídos no combo */
  services: string[];
  /** Preço cheio (sem o combo) */
  originalPrice: number;
  /** Preço promocional */
  promoPrice: number;
  /** Badge opcional no card — ex: "Mais pedido" | "Novidade" */
  badge?: string;
};

export const promotions: Promotion[] = [
  {
    id: "combo-verao-junho",
    month: "Junho 2026",
    validUntil: "30/06/2026",
    title: "Combo Verão",
    tagline: "Leveza e definição para o calor",
    services: ["Power Redux", "Drenagem Linfática — Método MAVI"],
    originalPrice: 480,
    promoPrice: 380,
    badge: "Mais pedido",
  },
  {
    id: "renove-pele-junho",
    month: "Junho 2026",
    validUntil: "30/06/2026",
    title: "Renove sua Pele",
    tagline: "Brilho de dentro para fora",
    services: ["Limpeza de Pele Profunda", "Hidragloss"],
    originalPrice: 360,
    promoPrice: 280,
  },
  {
    id: "body-contour-junho",
    month: "Junho 2026",
    validUntil: "30/06/2026",
    title: "Body Contour",
    tagline: "Tonificação e modelagem em dupla",
    services: ["Corrente Russa", "Power Redux"],
    originalPrice: 520,
    promoPrice: 420,
    badge: "Novidade",
  },
];
