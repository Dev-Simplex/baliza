import type { Preset } from "./types";

/**
 * Perfis-alvo prontos — pro recrutador não partir de uma tela em branco.
 *
 * São PONTOS DE PARTIDA editáveis, nunca verdades. Ao criar a vaga o preset é
 * copiado para `Job.targetProfile`, e a partir daí a vaga tem vida própria: o
 * recrutador ajusta sem afetar nenhuma outra.
 *
 * tipo (define o `ideal` da dimensão, que é o alvo do cálculo):
 *   maior_melhor  → ideal = topo da faixa
 *   faixa_otima   → ideal = meio da faixa; penaliza dos DOIS lados
 *   menor_melhor  → ideal = base da faixa
 *   irrelevante   → peso 0: NÃO entra na conta. Fica listada de propósito, pra
 *                   o recrutador ver que a dimensão foi considerada e
 *                   descartada, não esquecida.
 */

export const PRESETS: Preset[] = [
  {
    id: "atendimento",
    nome: "Atendimento / SAC",
    familia: "Atendimento",
    dimensoes: {
      C: { tipo: "maior_melhor", peso: 4, faixa: [60, 100] },
      E: { tipo: "maior_melhor", peso: 5, faixa: [65, 100] },
      X: { tipo: "faixa_otima", peso: 3, faixa: [45, 80] },
      A: { tipo: "maior_melhor", peso: 5, faixa: [65, 100] },
      O: { tipo: "irrelevante", peso: 0, faixa: [30, 100] },
    },
    nota: "Estabilidade e Cooperação carregam a vaga: o trabalho é absorver a irritação de outra pessoa várias vezes por dia sem levar pro pessoal. Energia Social é faixa ótima, não \"quanto mais melhor\" — atendimento não é venda, e extroversão muito alta se entedia com repetição e roteiro.",
  },
  {
    id: "vendas_cacador",
    nome: "Vendas — prospecção (caçador)",
    familia: "Comercial",
    dimensoes: {
      C: { tipo: "maior_melhor", peso: 4, faixa: [55, 100] },
      E: { tipo: "maior_melhor", peso: 5, faixa: [65, 100] },
      X: { tipo: "maior_melhor", peso: 5, faixa: [65, 100] },
      A: { tipo: "faixa_otima", peso: 3, faixa: [30, 60] },
      O: { tipo: "faixa_otima", peso: 2, faixa: [45, 80] },
    },
    nota: "A dimensão contraintuitiva é Cooperação BAIXA-A-MÉDIA. Cooperação muito alta atrapalha: a pessoa não pede o fechamento, dá desconto pra evitar atrito e foge da conversa difícil. E note que Organização e Entrega pesa 4 — o mito do vendedor bagunceiro e carismático não se sustenta: quem bate meta com consistência tem disciplina de funil e de follow-up.",
  },
  {
    id: "sucesso_cliente",
    nome: "Sucesso do cliente / pós-venda",
    familia: "Comercial",
    dimensoes: {
      C: { tipo: "maior_melhor", peso: 5, faixa: [65, 100] },
      E: { tipo: "maior_melhor", peso: 4, faixa: [60, 100] },
      X: { tipo: "faixa_otima", peso: 3, faixa: [50, 85] },
      A: { tipo: "maior_melhor", peso: 5, faixa: [65, 100] },
      O: { tipo: "faixa_otima", peso: 2, faixa: [45, 85] },
    },
    nota: "É quase o inverso do caçador na dimensão Cooperação. Aqui a relação é longa e a renovação depende de confiança acumulada. Organização e Entrega sobe pra peso 5 porque o trabalho é acompanhamento sistemático — cliente que some da régua é cliente que cancela.",
  },
  {
    id: "administrativo_financeiro",
    nome: "Administrativo / Financeiro",
    familia: "Back-office",
    dimensoes: {
      C: { tipo: "maior_melhor", peso: 5, faixa: [75, 100] },
      E: { tipo: "maior_melhor", peso: 3, faixa: [55, 100] },
      X: { tipo: "irrelevante", peso: 0, faixa: [20, 100] },
      A: { tipo: "faixa_otima", peso: 2, faixa: [40, 80] },
      O: { tipo: "faixa_otima", peso: 2, faixa: [30, 65] },
    },
    nota: "O piso de Organização e Entrega é o mais alto de todos os perfis (75) porque aqui erro vira dinheiro. Abertura ao Novo é faixa ótima com teto em 65 — e isso não é preconceito contra gente curiosa: quem tem abertura muito alta se frustra num trabalho de conferência e tende a querer redesenhar o processo no meio do fechamento. Cooperação com teto porque precisa saber cobrar.",
  },
  {
    id: "tecnico_desenvolvimento",
    nome: "Técnico / Desenvolvimento",
    familia: "Tecnologia",
    dimensoes: {
      C: { tipo: "maior_melhor", peso: 4, faixa: [60, 100] },
      E: { tipo: "maior_melhor", peso: 4, faixa: [55, 100] },
      X: { tipo: "irrelevante", peso: 0, faixa: [20, 100] },
      A: { tipo: "faixa_otima", peso: 2, faixa: [40, 85] },
      O: { tipo: "maior_melhor", peso: 4, faixa: [60, 100] },
    },
    nota: "Energia Social é IRRELEVANTE aqui, e isso é deliberado: não há evidência de que extroversão preveja desempenho técnico, e usá-la como critério só filtra gente boa e introvertida. Estabilidade pesa 4 por causa de code review, produção quebrando e crítica ao trabalho — não por causa de \"pressão\".",
  },
  {
    id: "lideranca",
    nome: "Liderança de time",
    familia: "Gestão",
    dimensoes: {
      C: { tipo: "maior_melhor", peso: 4, faixa: [60, 100] },
      E: { tipo: "maior_melhor", peso: 5, faixa: [70, 100] },
      X: { tipo: "maior_melhor", peso: 4, faixa: [60, 100] },
      A: { tipo: "faixa_otima", peso: 4, faixa: [50, 80] },
      O: { tipo: "maior_melhor", peso: 3, faixa: [55, 100] },
    },
    nota: "Cooperação é o caso mais claro de faixa ótima do produto inteiro: abaixo de 50 vira gestor que atropela; acima de 80 vira gestor que não consegue dar retorno duro, não desliga ninguém e deixa o time carregar o peso do baixo desempenho alheio. Estabilidade pesa 5 porque o humor do líder é o clima do time — essa é a dimensão que mais transborda.",
  },
  {
    id: "operacao_logistica",
    nome: "Operação / Logística",
    familia: "Operações",
    dimensoes: {
      C: { tipo: "maior_melhor", peso: 5, faixa: [70, 100] },
      E: { tipo: "maior_melhor", peso: 4, faixa: [60, 100] },
      X: { tipo: "irrelevante", peso: 0, faixa: [20, 100] },
      A: { tipo: "maior_melhor", peso: 3, faixa: [55, 100] },
      O: { tipo: "faixa_otima", peso: 1, faixa: [25, 65] },
    },
    nota: "Organização e Entrega alto aqui é segurança, não produtividade: procedimento cumprido é o que evita acidente. Cooperação importa por causa de turno e revezamento — o trabalho depende de passar o bastão direito.",
  },
];

export const PRESET_POR_ID = new Map(PRESETS.map((p) => [p.id, p]));

/** Perfil neutro, para vaga criada sem preset. */
export const PERFIL_NEUTRO: Preset["dimensoes"] = {
  C: { tipo: "maior_melhor", peso: 4, faixa: [55, 100] },
  E: { tipo: "maior_melhor", peso: 3, faixa: [50, 100] },
  X: { tipo: "faixa_otima", peso: 2, faixa: [40, 80] },
  A: { tipo: "faixa_otima", peso: 3, faixa: [45, 80] },
  O: { tipo: "faixa_otima", peso: 2, faixa: [40, 85] },
};
