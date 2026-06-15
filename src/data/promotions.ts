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
//  - campaignTag: nome da campanha exibido no card (ex: "Combo Eu & Você", "Amor Próprio")
//  - campaignSubtitle: frase pequena abaixo do nome da campanha
//  - comboBonus: descrição do bônus que o parceiro/amiga ganha (só para combos)
//  - bgImage: caminho para a imagem de fundo do card (opcional)
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
  /** Nome da campanha exibido no card (ex: "Combo Eu & Você", "Amor Próprio") */
  campaignTag?: string;
  /** Frase pequena exibida abaixo do nome da campanha */
  campaignSubtitle?: string;
  /** Descrição do bônus que o parceiro/amiga ganha */
  comboBonus?: string;
  /** Caminho da imagem de fundo do card */
  bgImage?: string;
};

import depilacaoLaser from "@/assets/services/depilacao-laser.jpg";
import drenagemGestante from "@/assets/services/drenagem-gestantes.jpg";
import drenagemLinfatica from "@/assets/services/drenagem-linfatica.jpg";
import posOperatorio from "@/assets/services/pos-operatorio.jpg";
import heroBg from "@/assets/hero-bg.jpg";

export const promotions: Promotion[] = [
  {
    id: "combo-eu-voce-virilha",
    campaignTag: "Eu & Você",
    campaignSubtitle: "JUNTOS NA VIDA E LIVRE DOS PELINHOS INDESEJADOS",
    category: "Depilação à Laser",
    sessions: 10,
    procedure: "Virilha\nCompleta",
    installments: 10,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
    comboBonus: "seu amor GANHA 10 sessões de Tórax ou Barba Simples!",
    bgImage: heroBg,
  },
  {
    id: "combo-eu-voce-virilha-barba",
    campaignTag: "Eu & Você",
    campaignSubtitle: "JUNTOS NA VIDA E LIVRE DOS PELINHOS INDESEJADOS",
    category: "Depilação à Laser",
    sessions: 10,
    procedure: "Virilha\nCompleta",
    installments: 10,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
    comboBonus: "seu amor GANHA 10 sessões de Barba Simples!",
    bgImage: heroBg,
  },
  {
    id: "combo-eu-voce-axilas",
    campaignTag: "Eu & Você",
    campaignSubtitle: "JUNTOS NA VIDA E LIVRE DOS PELINHOS INDESEJADOS",
    category: "Depilação à Laser",
    sessions: 10,
    procedure: "Axilas",
    installments: 1,
    installmentPrice: 199.99,
    validUntil: "30/06/2026",
    comboBonus: "seu amor GANHA 10 sessões de Depilação à Laser nas Axilas!",
    bgImage: heroBg,
  },
  {
    id: "combo-amigas-virilha-perianal-axilas",
    campaignTag: "Combo das Amigas",
    campaignSubtitle: "AMIGA QUE É AMIGA DIVIDEM O MELHOR COMBO",
    category: "Depilação à Laser",
    sessions: 10,
    procedure: "Virilha Completa\n+ Perianal + Axilas",
    installments: 10,
    installmentPrice: 159.99,
    validUntil: "30/06/2026",
    comboBonus: "sua amiga GANHA 10 sessões nas mesmas áreas!",
    bgImage: depilacaoLaser,
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
    bgImage: posOperatorio,
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
    bgImage: drenagemGestante,
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
    bgImage: drenagemLinfatica,
  },
  {
    id: "amor-proprio-costas-masculina",
    campaignTag: "Amor Próprio",
    category: "Depilação à Laser Masculina",
    sessions: 10,
    procedure: "Costas",
    installments: 10,
    installmentPrice: 149.99,
    validUntil: "30/06/2026",
    bgImage: depilacaoLaser,
  },
  {
    id: "amor-proprio-torax-masculina",
    campaignTag: "Amor Próprio",
    category: "Depilação à Laser Masculina",
    sessions: 10,
    procedure: "Tórax",
    installments: 12,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
    bgImage: depilacaoLaser,
  },
  {
    id: "amor-proprio-buco-feminina",
    campaignTag: "Amor Próprio",
    category: "Depilação à Laser Feminina",
    sessions: 10,
    procedure: "Buço",
    installments: 1,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
    bgImage: depilacaoLaser,
  },
  {
    id: "amor-proprio-canela-feminina",
    campaignTag: "Amor Próprio",
    category: "Depilação à Laser Feminina",
    sessions: 10,
    procedure: "Canela",
    installments: 12,
    installmentPrice: 99.99,
    validUntil: "30/06/2026",
    comboBonus: "fechando esta PROMO você GANHA 10 sessões de Depilação à Laser na Casa!",
    bgImage: depilacaoLaser,
  },
  {
    id: "amor-proprio-virilha-perianal-feminina",
    campaignTag: "Amor Próprio",
    category: "Depilação à Laser Feminina",
    sessions: 10,
    procedure: "Virilha Completa\ncom Perianal",
    installments: 10,
    installmentPrice: 79.99,
    validUntil: "30/06/2026",
    bgImage: depilacaoLaser,
  },
];
