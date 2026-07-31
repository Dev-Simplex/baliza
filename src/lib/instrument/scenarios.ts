import type { BlocoDeCenario } from "./types";

/**
 * Parte B — 8 blocos de cenário com escolha forçada.
 *
 * O candidato escolhe o que faria PRIMEIRO (+1 ao fator) e o que deixaria por
 * ÚLTIMO (−1 ao fator).
 *
 * O vetor resultante é IPSATIVO: ele compara dimensões DENTRO da mesma pessoa,
 * e por isso NUNCA entra no escore comparável nem no ranking (§3). Serve para
 * três coisas: convergência com a Parte A (alimenta o Índice de Confiança),
 * matéria-prima de texto do relatório, e engajamento — é a parte que faz o
 * candidato terminar.
 *
 * Cada bloco cobre 4 dos 5 fatores, de propósito: força trade-off real.
 */

export const ESCORAGEM_DE_CENARIO = {
  primeiro: 1,
  ultimo: -1,
  /**
   * Correlação entre o vetor ipsativo e o perfil normativo centrado na pessoa.
   * rho < 0 dispara o sinal de convergência (§5.5).
   * Limiar provisório — recalibrar com ~500 respostas reais.
   */
  limiarDeConvergencia: 0,
} as const;

export const CENARIOS: BlocoDeCenario[] = [
  {
    id: "cen_1",
    titulo: "Segunda-feira, 9h02",
    situacao:
      "Você abre o computador e três coisas estão esperando ao mesmo tempo: um relatório que vence hoje, um colega pedindo ajuda no chat, e um e-mail avisando que o processo que você usa vai mudar na semana que vem.",
    opcoes: [
      {
        id: "cen_1_c",
        fator: "C",
        texto: "Listo as três, defino a ordem e ataco a primeira sem desviar.",
      },
      {
        id: "cen_1_x",
        fator: "X",
        texto: "Ligo pra quem pode destravar tudo mais rápido e resolvo falando.",
      },
      {
        id: "cen_1_a",
        fator: "A",
        texto: "Respondo o colega primeiro — ele está parado esperando por mim.",
      },
      {
        id: "cen_1_o",
        fator: "O",
        texto:
          "Leio sobre a mudança do processo antes, pra não fazer o relatório do jeito que vai morrer.",
      },
    ],
  },
  {
    id: "cen_2",
    titulo: "O erro que ninguém viu",
    situacao:
      "Você descobre que cometeu um erro numa entrega da semana passada. Até agora ninguém percebeu. Dá pra corrigir, mas vai aparecer que foi você.",
    opcoes: [
      {
        id: "cen_2_c",
        fator: "C",
        texto: "Corrijo primeiro, documento o que aconteceu e só depois comunico.",
      },
      {
        id: "cen_2_e",
        fator: "E",
        texto: "Respiro, avalio o tamanho real do estrago e sigo o dia normalmente.",
      },
      {
        id: "cen_2_a",
        fator: "A",
        texto:
          "Aviso quem foi afetado antes de qualquer coisa, pra ninguém ser pego de surpresa.",
      },
      {
        id: "cen_2_x",
        fator: "X",
        texto: "Levo direto pro meu gestor, assumo na hora e proponho o conserto.",
      },
    ],
  },
  {
    id: "cen_3",
    titulo: "A pessoa nova está perdida",
    situacao:
      "Entrou alguém novo no time há duas semanas. Está claramente perdida, mas não pede ajuda. Isso já começou a atrasar coisas que passam por você.",
    opcoes: [
      {
        id: "cen_3_a",
        fator: "A",
        texto:
          "Chamo pra um café e pergunto como ela está se sentindo, sem cobrar nada.",
      },
      {
        id: "cen_3_c",
        fator: "C",
        texto: "Monto um passo a passo do que ela precisa saber e entrego pronto.",
      },
      {
        id: "cen_3_o",
        fator: "O",
        texto:
          "Repenso o onboarding do time — se ela travou, a próxima também vai travar.",
      },
      {
        id: "cen_3_e",
        fator: "E",
        texto: "Dou mais tempo. Duas semanas é pouco, e pressionar agora só piora.",
      },
    ],
  },
  {
    id: "cen_4",
    titulo: "A reunião e a ideia ruim",
    situacao:
      "Numa reunião com o time todo, seu gestor propõe um caminho que você tem quase certeza de que vai dar errado. Ninguém mais se manifesta.",
    opcoes: [
      {
        id: "cen_4_x",
        fator: "X",
        texto: "Falo ali mesmo, na frente de todo mundo, com os motivos na mão.",
      },
      {
        id: "cen_4_a",
        fator: "A",
        texto: "Fico quieto na reunião e converso com ele em particular depois.",
      },
      {
        id: "cen_4_e",
        fator: "E",
        texto: "Espero. Posso estar errado, e o custo de tentar não é tão alto assim.",
      },
      {
        id: "cen_4_c",
        fator: "C",
        texto:
          "Levanto os dados que sustentam minha leitura e mando por escrito no mesmo dia.",
      },
    ],
  },
  {
    id: "cen_5",
    titulo: "O prazo não cabe",
    situacao:
      "Pediram uma entrega pra sexta. Fazendo a conta com honestidade, não cabe — a não ser que alguma coisa mude.",
    opcoes: [
      {
        id: "cen_5_c",
        fator: "C",
        texto:
          "Abro o escopo em partes, mostro exatamente o que cabe até sexta e proponho o corte.",
      },
      {
        id: "cen_5_x",
        fator: "X",
        texto: "Negocio o prazo na hora, direto com quem pediu.",
      },
      {
        id: "cen_5_o",
        fator: "O",
        texto:
          "Procuro um jeito diferente de resolver que caiba no prazo, mesmo que fuja do padrão.",
      },
      {
        id: "cen_5_e",
        fator: "E",
        texto:
          "Começo a trabalhar e vou reavaliando — na prática essas contas mudam.",
      },
    ],
  },
  {
    id: "cen_6",
    titulo: "O cliente explodiu",
    situacao:
      "Cliente no telefone, muito irritado, elevando a voz. O problema existe, mas não foi você quem causou.",
    opcoes: [
      {
        id: "cen_6_e",
        fator: "E",
        texto: "Mantenho o tom calmo e deixo ele falar até esvaziar, sem me abalar.",
      },
      {
        id: "cen_6_a",
        fator: "A",
        texto:
          "Reconheço o incômodo e peço desculpas pela situação antes de falar de solução.",
      },
      {
        id: "cen_6_o",
        fator: "O",
        texto:
          "Busco uma saída fora do script, mesmo que não seja o procedimento normal.",
      },
      {
        id: "cen_6_x",
        fator: "X",
        texto:
          "Assumo o comando da conversa e digo com firmeza o que vou fazer e quando.",
      },
    ],
  },
  {
    id: "cen_7",
    titulo: "O processo que todo mundo reclama",
    situacao:
      'Existe um processo no seu time que gera retrabalho e todo mundo reclama dele há meses. Ninguém mexeu porque "sempre foi assim".',
    opcoes: [
      {
        id: "cen_7_o",
        fator: "O",
        texto: "Desenho uma proposta nova do zero e apresento.",
      },
      {
        id: "cen_7_c",
        fator: "C",
        texto:
          "Meço primeiro: quanto tempo se perde, onde, quantas vezes. Sem número não muda nada.",
      },
      {
        id: "cen_7_x",
        fator: "X",
        texto:
          "Levo o assunto pra decisão de quem tem poder pra mudar e empurro até sair.",
      },
      {
        id: "cen_7_a",
        fator: "A",
        texto: "Junto as pessoas que sofrem com ele e construo a mudança com o time.",
      },
    ],
  },
  {
    id: "cen_8",
    titulo: "Fogo cruzado",
    situacao:
      "Dois colegas seus estão em conflito aberto. Você não tem nada a ver com a briga, mas ela já está travando um trabalho que depende dos dois.",
    opcoes: [
      {
        id: "cen_8_a",
        fator: "A",
        texto:
          "Converso com cada um separado pra entender os dois lados antes de qualquer coisa.",
      },
      {
        id: "cen_8_x",
        fator: "X",
        texto: "Chamo os dois juntos e coloco a questão na mesa, sem rodeio.",
      },
      {
        id: "cen_8_e",
        fator: "E",
        texto: "Não entro. Sigo meu trabalho e deixo que eles resolvam entre si.",
      },
      {
        id: "cen_8_o",
        fator: "O",
        texto:
          "Reorganizo o fluxo pra que o trabalho ande sem depender dos dois se entenderem.",
      },
    ],
  },
];

export const CENARIO_POR_ID = new Map(CENARIOS.map((c) => [c.id, c]));
