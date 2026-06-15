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
//  - campaignTag: nome da campanha exibido no topo do card (ex: "Combo Eu & Você", "Amor Próprio")
//  - comboBonus: descrição do bônus que o parceiro/amiga ganha (só para combos)
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
  /** Nome da campanha exibido no topo do card (ex: "Combo Eu & Você", "Amor Próprio") */
  campaignTag?: string;
  /** Descrição do bônus que o parceiro/amiga ganha */
  comboBonus?: string;
};

export const promotions: Promotion[] = [
  {
    id: "combo-eu-voce-virilha",
    campaignTag: "Combo Eu & Você",
    category: "Depilação a Laser",
    sessions: 10,
    procedure: "Virilha\nCompleta",
    installments: 10,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
    comboBonus: "Seu amor GANHA 10 sessões de Tórax ou Barba Simples!",
  },
  {
    id: "combo-eu-voce-axilas",
    campaignTag: "Combo Eu & Você",
    category: "Depilação a Laser",
    sessions: 10,
    procedure: "Axilas",
    installments: 1,
    installmentPrice: 199.99,
    validUntil: "30/06/2026",
    comboBonus: "Seu amor GANHA 10 sessões de Depilação à Laser nas Axilas!",
  },
  {
    id: "combo-amigas-virilha-perianal-axilas",
    campaignTag: "Combo das Amigas",
    category: "Depilação a Laser",
    sessions: 10,
    procedure: "Virilha Completa\n+ Perianal + Axilas",
    installments: 10,
    installmentPrice: 159.99,
    validUntil: "30/06/2026",
    comboBonus: "Sua amiga GANHA 10 sessões nas mesmas áreas!",
  },
  {
    id: "amor-proprio-max-pos-parto",
    campaignTag: "Amor Próprio",
    category: "Tratamento Corporal",
    sessions: 10,
    procedure: "Max\nPós Parto",
    installments: 10,
    installmentPrice: 299.99,
    validUntil: "30/06/2026",
  },
  {
    id: "amor-proprio-drenagem-gestante",
    campaignTag: "Amor Próprio",
    category: "Tratamento Corporal",
    sessions: 10,
    procedure: "Drenagem Linfática\npara Gestante",
    installments: 1,
    installmentPrice: 550.0,
    validUntil: "30/06/2026",
    note: "Parcelável em até 3x no Cartão de Crédito.",
  },
  {
    id: "amor-proprio-costas-masculina",
    campaignTag: "Amor Próprio",
    category: "Depilação a Laser Masculina",
    sessions: 10,
    procedure: "Costas",
    installments: 10,
    installmentPrice: 149.99,
    validUntil: "30/06/2026",
  },
  {
    id: "amor-proprio-torax-masculina",
    campaignTag: "Amor Próprio",
    category: "Depilação a Laser Masculina",
    sessions: 10,
    procedure: "Tórax",
    installments: 12,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
  },
  {
    id: "amor-proprio-buco-feminina",
    campaignTag: "Amor Próprio",
    category: "Depilação a Laser Feminina",
    sessions: 10,
    procedure: "Buço",
    installments: 1,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
  },
  {
    id: "amor-proprio-canela-feminina",
    campaignTag: "Amor Próprio",
    category: "Depilação a Laser Feminina",
    sessions: 10,
    procedure: "Canela",
    installments: 12,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
    comboBonus: "Fechando esta PROMO você GANHA 10 sessões de Depilação à Laser na Casa!",
  },
  {
    id: "amor-proprio-virilha-perianal-feminina",
    campaignTag: "Amor Próprio",
    category: "Depilação a Laser Feminina",
    sessions: 10,
    procedure: "Virilha Completa\ncom Perianal",
    installments: 10,
    installmentPrice: 79.99,
    validUntil: "30/06/2026",
  },
  {
    id: "amor-proprio-drenagem-metodo-mavi",
    campaignTag: "Amor Próprio",
    category: "Tratamento Corporal",
    sessions: 10,
    procedure: "Drenagem Linfática\nMétodo Mavi",
    installments: 1,
    installmentPrice: 799.99,
    validUntil: "30/06/2026",
    note: "Parcelável em até 6x no Cartão de Crédito.",
  },
  {
    id: "combo-eu-voce-virilha-barba",
    campaignTag: "Combo Eu & Você",
    category: "Depilação a Laser",
    sessions: 10,
    procedure: "Virilha\nCompleta",
    installments: 10,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
    comboBonus: "Seu amor GANHA 10 sessões de Barba Simples!",
  },
];
