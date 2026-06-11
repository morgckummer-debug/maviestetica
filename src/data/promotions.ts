// ============================================================
//  PROMOÇÕES DO MÊS — edite aqui para atualizar o site
// ============================================================
//
//  Como funcionar:
//  - Altere o array `promotions` com as promoções ativas do mês.
//  - Para tirar o bloco do site em meses sem promoção: deixe o array vazio []
//  - validUntil: use o formato "DD/MM/AAAA".
//  - installments: número de parcelas (ex: 10 → "10x de R$75,00")
//  - Se for à vista (sem parcelamento), use installments: 1
//  - procedure: use \n para quebrar linha no nome (ex: "Virilha\n+ Perianal")
// ============================================================

export type Promotion = {
  id: string;
  /** Categoria exibida no badge — ex: "Depilação a Laser Feminina" */
  category: string;
  /** Número de sessões incluídas */
  sessions: number;
  /** Nome do procedimento/área — use \n para quebrar linha */
  procedure: string;
  /** Número de parcelas (use 1 para à vista) */
  installments: number;
  /** Valor de cada parcela */
  installmentPrice: number;
  /** Data limite no formato "DD/MM/AAAA" */
  validUntil: string;
  /** Observação opcional no rodapé do card */
  note?: string;
  /** Nome do combo (ex: "Eu & Você", "das Amigas") — ativa destaque visual */
  comboName?: string;
  /** Descrição do bônus que o parceiro/amiga ganha */
  comboBonus?: string;
};

export const promotions: Promotion[] = [
  {
    id: "combo-eu-voce-axilas",
    category: "Depilação a Laser",
    sessions: 10,
    procedure: "Axilas",
    installments: 1,
    installmentPrice: 199.99,
    validUntil: "30/06/2026",
    comboName: "Eu & Você",
    comboBonus: "Seu amor GANHA 10 sessões de Depilação à Laser nas Axilas!",
  },
  {
    id: "combo-eu-voce-limpeza-pele",
    category: "Tratamento Facial",
    sessions: 1,
    procedure: "Limpeza de\nPele Profunda",
    installments: 1,
    installmentPrice: 150.0,
    validUntil: "30/06/2026",
    comboName: "Eu & Você",
    comboBonus: "Seu amor GANHA outra sessão de Limpeza de Pele Profunda!",
  },
  {
    id: "combo-amigas-virilha-perianal-axilas",
    category: "Depilação a Laser",
    sessions: 10,
    procedure: "Virilha Completa\n+ Perianal + Axilas",
    installments: 10,
    installmentPrice: 159.99,
    validUntil: "30/06/2026",
    comboName: "das Amigas",
    comboBonus: "Sua amiga GANHA 10 sessões nas mesmas áreas!",
  },
  {
    id: "combo-eu-voce-virilha",
    category: "Depilação a Laser",
    sessions: 10,
    procedure: "Virilha\nCompleta",
    installments: 10,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
    comboName: "Eu & Você",
    comboBonus: "Seu amor GANHA 10 sessões de Tórax ou Barba Simples!",
  },
  {
    id: "laser-virilha-perianal",
    category: "Depilação a Laser Feminina",
    sessions: 10,
    procedure: "Virilha Completa\n+ Perianal",
    installments: 10,
    installmentPrice: 75,
    validUntil: "30/06/2026",
    note: "Oferta limitada e não acumulativa com outras promoções.",
  },
  {
    id: "laser-axila-feminina",
    category: "Depilação a Laser Feminina",
    sessions: 10,
    procedure: "Axilas",
    installments: 10,
    installmentPrice: 45,
    validUntil: "30/06/2026",
    note: "Oferta limitada e não acumulativa com outras promoções.",
  },
  {
    id: "laser-pernas-inteiras",
    category: "Depilação a Laser Feminina",
    sessions: 10,
    procedure: "Pernas\nInteiras",
    installments: 10,
    installmentPrice: 120,
    validUntil: "30/06/2026",
    note: "Oferta limitada e não acumulativa com outras promoções.",
  },
  {
    id: "laser-buço",
    category: "Depilação a Laser Facial",
    sessions: 10,
    procedure: "Buço\n+ Queixo",
    installments: 10,
    installmentPrice: 55,
    validUntil: "30/06/2026",
    note: "Oferta limitada e não acumulativa com outras promoções.",
  },
  {
    id: "laser-virilha-masculina",
    category: "Depilação a Laser Masculina",
    sessions: 10,
    procedure: "Virilha\nCompleta",
    installments: 10,
    installmentPrice: 85,
    validUntil: "30/06/2026",
    note: "Oferta limitada e não acumulativa com outras promoções.",
  },
  {
    id: "limpeza-pele",
    category: "Tratamento Facial",
    sessions: 4,
    procedure: "Limpeza de\nPele Profunda",
    installments: 4,
    installmentPrice: 90,
    validUntil: "30/06/2026",
    note: "Oferta limitada e não acumulativa com outras promoções.",
  },
  {
    id: "hidragloss",
    category: "Tratamento Facial",
    sessions: 4,
    procedure: "Hidragloss",
    installments: 4,
    installmentPrice: 70,
    validUntil: "30/06/2026",
    note: "Oferta limitada e não acumulativa com outras promoções.",
  },
  {
    id: "drenagem-linfatica",
    category: "Tratamento Corporal",
    sessions: 10,
    procedure: "Drenagem\nLinfática",
    installments: 10,
    installmentPrice: 80,
    validUntil: "30/06/2026",
    note: "Oferta limitada e não acumulativa com outras promoções.",
  },
  {
    id: "power-redux",
    category: "Tratamento Corporal",
    sessions: 10,
    procedure: "Power Redux",
    installments: 10,
    installmentPrice: 95,
    validUntil: "30/06/2026",
    note: "Oferta limitada e não acumulativa com outras promoções.",
  },
  {
    id: "corrente-russa",
    category: "Tratamento Corporal",
    sessions: 10,
    procedure: "Corrente\nRussa",
    installments: 10,
    installmentPrice: 65,
    validUntil: "30/06/2026",
    note: "Oferta limitada e não acumulativa com outras promoções.",
  },
];
