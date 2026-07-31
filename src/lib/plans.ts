import type { PlanCode } from "@/generated/prisma/enums";

/**
 * Planos e limites.
 *
 * Os limites vivem em código, não em banco: eles mudam com o produto, não com
 * o cliente. O que vive em banco é qual plano cada empresa tem (`Subscription`).
 * Exceção contratada vira campo na assinatura, não linha nova aqui.
 */

export type Limites = {
  vagasAtivas: number;
  avaliacoesPorMes: number;
  usuarios: number;
  iaHabilitada: boolean;
  apiPublica: boolean;
  exportacao: boolean;
  comparacao: boolean;
  perfisDeCultura: number;
  retencaoEmMeses: number;
};

export type Plano = {
  codigo: PlanCode;
  nome: string;
  descricao: string;
  precoMensalCentavos: number;
  destaque?: boolean;
  limites: Limites;
  vitrine: string[];
};

/** `Infinity` é intencional: o Enterprise não tem teto de uso, tem contrato. */
export const PLANOS: Record<PlanCode, Plano> = {
  STARTER: {
    codigo: "STARTER",
    nome: "Starter",
    descricao: "Para quem contrata algumas vezes por ano e quer parar de decidir no achismo.",
    precoMensalCentavos: 0,
    limites: {
      vagasAtivas: 2,
      avaliacoesPorMes: 30,
      usuarios: 2,
      iaHabilitada: false,
      apiPublica: false,
      exportacao: true,
      comparacao: false,
      perfisDeCultura: 0,
      retencaoEmMeses: 12,
    },
    vitrine: [
      "2 vagas ativas",
      "30 respostas por mês",
      "Ranking com aderência explicada",
      "Roteiro de entrevista por candidato",
      "Relatório do candidato incluso",
      "Exportação em PDF e Excel",
    ],
  },
  PROFESSIONAL: {
    codigo: "PROFESSIONAL",
    nome: "Professional",
    descricao: "Para quem tem processo seletivo rodando o tempo todo.",
    precoMensalCentavos: 24900,
    destaque: true,
    limites: {
      vagasAtivas: 20,
      avaliacoesPorMes: 500,
      usuarios: 10,
      iaHabilitada: true,
      apiPublica: false,
      exportacao: true,
      comparacao: true,
      perfisDeCultura: 3,
      retencaoEmMeses: 12,
    },
    vitrine: [
      "20 vagas ativas",
      "500 respostas por mês",
      "Leitura por IA com perguntas sugeridas",
      "Comparação lado a lado",
      "Perfil de cultura da empresa",
      "Benchmark contra a base acumulada",
      "Histórico de evolução do candidato",
    ],
  },
  ENTERPRISE: {
    codigo: "ENTERPRISE",
    nome: "Enterprise",
    descricao: "Para RH com volume, múltiplas unidades e integração com o que já roda.",
    precoMensalCentavos: 99900,
    limites: {
      vagasAtivas: Infinity,
      avaliacoesPorMes: Infinity,
      usuarios: Infinity,
      iaHabilitada: true,
      apiPublica: true,
      exportacao: true,
      comparacao: true,
      perfisDeCultura: Infinity,
      retencaoEmMeses: 24,
    },
    vitrine: [
      "Vagas e respostas sem limite",
      "API pública para ATS, ERP e sistemas de RH",
      "Usuários ilimitados com papéis",
      "Painel executivo agregado",
      "Trilha de auditoria completa",
      "Retenção configurável e expurgo programado",
    ],
  },
};

export const LISTA_DE_PLANOS = [
  PLANOS.STARTER,
  PLANOS.PROFESSIONAL,
  PLANOS.ENTERPRISE,
];

export function limitesDoPlano(codigo: PlanCode): Limites {
  return PLANOS[codigo].limites;
}

export function formatarPreco(centavos: number) {
  if (centavos === 0) return "Grátis";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(centavos / 100);
}
