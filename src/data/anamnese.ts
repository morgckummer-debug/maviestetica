// Configuração da ficha de anamnese corporal da MAVI.
// As perguntas ficam aqui — para mudar a ficha, edite só este arquivo.
// As respostas são salvas no Supabase no campo `respostas` (JSONB),
// indexadas pelo `id` de cada campo, então mudar perguntas não exige
// alterar o banco.

export type CampoTexto = {
  tipo: "texto";
  id: string;
  label: string;
  placeholder?: string;
  obrigatorio?: boolean;
  multiline?: boolean;
  inputMode?: "text" | "tel" | "email" | "date";
  ajuda?: string;
};

export type CampoSimNao = {
  tipo: "simnao";
  id: string;
  label: string;
  // Mostra um campo de texto quando responder "Sim"
  especifique?: boolean;
  especifiquePlaceholder?: string;
  // Se marcado "Sim", gera um alerta de segurança para a Marina
  alertaSeSim?: string;
};

export type Campo = CampoTexto | CampoSimNao;

export type Etapa = {
  titulo: string;
  descricao?: string;
  // "grid" = layout compacto em duas colunas (para as perguntas curtas)
  layout?: "lista" | "grid";
  campos: Campo[];
};

export const TERMO_TEXTO =
  "Declaro que as informações acima são verdadeiras, não cabendo ao profissional " +
  "qualquer responsabilidade por informações omitidas nesta avaliação. Comprometo-me " +
  "a seguir todos os cuidados necessários após o procedimento.";

export const AUTORIZACAO_FOTO_TEXTO =
  "Autorizo o registro fotográfico do trabalho realizado (antes/depois) para fins de " +
  "documentação e divulgação em redes sociais ou material publicitário. A autorização é " +
  "concedida gratuitamente, sem nada a ser reclamado a título de direitos.";

export const ETAPAS: Etapa[] = [
  {
    titulo: "Seus dados",
    descricao: "Para a Marina te receber com cuidado e segurança.",
    campos: [
      {
        tipo: "texto",
        id: "nome",
        label: "Nome completo",
        placeholder: "Seu nome",
        obrigatorio: true,
      },
      { tipo: "texto", id: "nascimento", label: "Data de nascimento", inputMode: "date" },
      {
        tipo: "texto",
        id: "whatsapp",
        label: "WhatsApp",
        placeholder: "(31) 9....-....",
        inputMode: "tel",
        obrigatorio: true,
      },
      {
        tipo: "texto",
        id: "email",
        label: "E-mail",
        placeholder: "voce@email.com",
        inputMode: "email",
      },
      { tipo: "texto", id: "cpf", label: "CPF (opcional)", placeholder: "000.000.000-00" },
      { tipo: "texto", id: "rg", label: "RG (opcional)", placeholder: "MG-00.000.000" },
      {
        tipo: "texto",
        id: "endereco",
        label: "Endereço (opcional)",
        placeholder: "Rua, número, complemento",
      },
      { tipo: "texto", id: "cep", label: "CEP (opcional)", placeholder: "35700-000" },
      { tipo: "texto", id: "cidade", label: "Cidade (opcional)", placeholder: "Sete Lagoas" },
      {
        tipo: "texto",
        id: "comoConheceu",
        label: "Como nos conheceu? (opcional)",
        placeholder: "Instagram, indicação...",
      },
    ],
  },
  {
    titulo: "Rotina e hábitos",
    campos: [
      {
        tipo: "simnao",
        id: "cuidadosPele",
        label: "Faz cuidados diários com a pele?",
        especifique: true,
        especifiquePlaceholder: "Quais produtos/rotina?",
      },
      {
        tipo: "texto",
        id: "aguaFrequencia",
        label: "Com que frequência bebe água?",
        placeholder: "Pouco, médio, bastante...",
      },
      { tipo: "simnao", id: "alimentacaoBalanceada", label: "Tem alimentação balanceada?" },
      {
        tipo: "simnao",
        id: "bebidaAlcoolica",
        label: "Ingere bebida alcoólica?",
        especifique: true,
        especifiquePlaceholder: "Com que frequência?",
      },
      {
        tipo: "simnao",
        id: "atividadeFisica",
        label: "Pratica atividade física?",
        especifique: true,
        especifiquePlaceholder: "Qual e com que frequência?",
      },
      { tipo: "simnao", id: "muitoTempoSentado", label: "Fica muito tempo sentado(a)?" },
      { tipo: "simnao", id: "intestinoRegular", label: "Funcionamento intestinal é regular?" },
    ],
  },
  {
    titulo: "Sua saúde",
    campos: [
      {
        tipo: "simnao",
        id: "problemasPele",
        label: "Tem problemas de pele?",
        especifique: true,
        especifiquePlaceholder: "Acne, melasma, dermatite...",
      },
      {
        tipo: "simnao",
        id: "medicamentoDiario",
        label: "Usa medicamento de uso diário?",
        especifique: true,
        especifiquePlaceholder: "Quais?",
      },
      {
        tipo: "simnao",
        id: "emTratamentoMedico",
        label: "Está em tratamento médico?",
        especifique: true,
        especifiquePlaceholder: "Qual?",
      },
      {
        tipo: "simnao",
        id: "possuiAlergia",
        label: "Possui alguma alergia?",
        especifique: true,
        especifiquePlaceholder: "A quê? (produtos, látex, medicamentos...)",
      },
      {
        tipo: "simnao",
        id: "antecedentesOncologicos",
        label: "Tem antecedentes oncológicos?",
        especifique: true,
        especifiquePlaceholder: "Qual e quando?",
        alertaSeSim: "Antecedentes oncológicos — avaliar contraindicações antes do procedimento.",
      },
      {
        tipo: "simnao",
        id: "antecedentesCirurgicos",
        label: "Tem antecedentes cirúrgicos?",
        especifique: true,
        especifiquePlaceholder: "Qual(is) cirurgia(s)?",
      },
      {
        tipo: "simnao",
        id: "cirurgiaRecente",
        label: "Fez cirurgia recente?",
        especifique: true,
        especifiquePlaceholder: "Qual e quando?",
        alertaSeSim: "Cirurgia recente — confirmar liberação médica e tempo de recuperação.",
      },
      {
        tipo: "simnao",
        id: "problemasOrtopedicos",
        label: "Tem problemas ortopédicos?",
        especifique: true,
        especifiquePlaceholder: "Quais? (hérnia, lordose, escoliose...)",
      },
      {
        tipo: "simnao",
        id: "protesesMetalicas",
        label: "Possui próteses metálicas ou metal implantado?",
        alertaSeSim: "Prótese/metal implantado — contraindicação possível para radiofrequência.",
      },
    ],
  },
  {
    titulo: "Condições de saúde",
    descricao: "Só marcar Sim ou Não.",
    layout: "grid",
    campos: [
      { tipo: "simnao", id: "cicloMenstrualRegular", label: "Ciclo menstrual regular?" },
      { tipo: "simnao", id: "estaMenstruada", label: "Está menstruada?" },
      {
        tipo: "simnao",
        id: "estaGravida",
        label: "Está grávida?",
        alertaSeSim: "Gestante — confirmar contraindicação do procedimento.",
      },
      { tipo: "simnao", id: "disturbioHormonal", label: "Distúrbio hormonal?" },
      { tipo: "simnao", id: "fumante", label: "Fumante?" },
      {
        tipo: "simnao",
        id: "diabetes",
        label: "Diabetes?",
        alertaSeSim: "Diabetes — atenção redobrada em procedimentos com extração/lesão de pele.",
      },
      { tipo: "simnao", id: "disturbioRenal", label: "Distúrbio renal?" },
      {
        tipo: "simnao",
        id: "hiperHipotensao",
        label: "Hiper / hipotensão?",
        alertaSeSim: "Hiper/hipotensão — monitorar durante o atendimento.",
      },
      {
        tipo: "simnao",
        id: "problemasCardiacos",
        label: "Problemas cardíacos?",
        alertaSeSim: "Problemas cardíacos — avaliar segurança antes de procedimentos.",
      },
      {
        tipo: "simnao",
        id: "disturbioCirculatorio",
        label: "Distúrbio circulatório?",
        alertaSeSim: "Distúrbio circulatório — atenção em drenagem e procedimentos corporais.",
      },
      {
        tipo: "simnao",
        id: "varizesLesoes",
        label: "Varizes ou lesões?",
        alertaSeSim: "Varizes/lesões — evitar manipulação direta na área afetada.",
      },
      {
        tipo: "simnao",
        id: "epilepsiaConvulsoes",
        label: "Epilepsia ou convulsões?",
        alertaSeSim: "Epilepsia/convulsões — contraindicação possível para eletroterapia.",
      },
    ],
  },
];

// Campos que a Marina preenche no painel (medidas corporais)
export const CAMPOS_MEDIDAS: { id: string; label: string }[] = [
  { id: "altura", label: "Altura (m)" },
  { id: "peso", label: "Peso (kg)" },
  { id: "busto", label: "Busto" },
  { id: "bracoDir", label: "Braço Dir." },
  { id: "bracoEsq", label: "Braço Esq." },
  { id: "abdomen", label: "Abdômen" },
  { id: "cintura", label: "Cintura" },
  { id: "quadril", label: "Quadril" },
  { id: "culote", label: "Culote" },
  { id: "coxaDir", label: "Coxa Dir." },
  { id: "coxaEsq", label: "Coxa Esq." },
  { id: "panturrilhaDir", label: "Panturrilha Dir." },
  { id: "panturrilhaEsq", label: "Panturrilha Esq." },
];

export type Respostas = Record<string, string | boolean | null>;

// Calcula os alertas de segurança a partir das respostas
export function calcularAlertas(respostas: Respostas): string[] {
  const alertas: string[] = [];
  for (const etapa of ETAPAS) {
    for (const campo of etapa.campos) {
      if (campo.tipo === "simnao" && campo.alertaSeSim && respostas[campo.id] === true) {
        alertas.push(campo.alertaSeSim);
      }
    }
  }
  return alertas;
}

// Rótulo legível de um campo (para o painel da Marina)
export function rotuloCampo(id: string): string {
  for (const etapa of ETAPAS) {
    for (const campo of etapa.campos) {
      if (campo.id === id) return campo.label;
    }
  }
  const medida = CAMPOS_MEDIDAS.find((m) => m.id === id);
  return medida?.label ?? id;
}
