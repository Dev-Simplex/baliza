import type { Fator } from "./types";

/**
 * Banco de perguntas de entrevista.
 *
 * O relatório termina em PERGUNTA, não em rótulo. Para cada dimensão que ficou
 * fora da faixa alvo da vaga, o sistema puxa perguntas daqui — perguntas
 * COMPORTAMENTAIS (o candidato conta um fato que aconteceu), nunca hipotéticas
 * ("o que você faria se..."), porque hipotética mede imaginação, não histórico.
 *
 * `abaixo` = escore ficou ABAIXO da faixa alvo → sondar se o risco é real
 * `acima`  = escore ficou ACIMA  da faixa alvo → sondar o custo do excesso
 */

export const PERGUNTAS_POR_DIMENSAO: Record<
  Fator,
  { nome: string; abaixo: string[]; acima: string[] }
> = {
  C: {
    nome: "Organização e Entrega",
    abaixo: [
      "Me conta de um prazo que você perdeu. Em que momento deu pra ver que não ia dar — e o que você fez nesse momento?",
      "Como você controla hoje o que tem pra fazer? Se puder, me mostra na tela.",
      "Me dá um exemplo de algo que você teve que entregar seguindo um processo que achava ruim. O que você fez?",
    ],
    acima: [
      "Me conta de uma vez em que você precisou entregar algo que não estava do jeito que você queria. Como foi?",
      "Como você decide que uma coisa está boa o suficiente pra sair da sua mão?",
    ],
  },
  E: {
    nome: "Estabilidade sob Pressão",
    abaixo: [
      "Me conta da crítica mais difícil que você recebeu no trabalho. O que você fez nas 24 horas seguintes?",
      "Descreve o dia mais tenso que você teve no último ano. O que te ajudou a atravessar?",
      "Quando várias coisas dão errado no mesmo dia, o que acontece com o seu trabalho?",
    ],
    acima: [
      "Você já deixou passar um problema sério porque achou que ia se resolver sozinho? Me conta.",
      "Me dá um exemplo de algo que te tirou do sério no trabalho. O que foi?",
    ],
  },
  X: {
    nome: "Energia Social",
    abaixo: [
      "Me conta de uma vez em que você discordou do grupo. Você chegou a falar? Em que momento?",
      "Quando você precisa de algo de outra área e não está vindo, o que você faz?",
      "Me conta da última vez em que você teve que convencer alguém de alguma coisa.",
    ],
    acima: [
      "Me conta de uma vez em que você falou demais numa reunião e isso te custou alguma coisa.",
      "Como você garante que as pessoas mais quietas do time sejam ouvidas?",
    ],
  },
  A: {
    nome: "Cooperação",
    abaixo: [
      "Me conta do último conflito que você teve com um colega. Como terminou?",
      "Quando você tem certeza de que está certo e o time inteiro discorda, o que acontece?",
      "Quem foi a pessoa mais difícil com quem você trabalhou? Como vocês se acertaram?",
    ],
    acima: [
      "Me conta de uma vez em que você precisou cobrar alguém ou dar uma notícia ruim. Como foi?",
      "Você já concordou com algo no trabalho só pra não criar atrito? O que aconteceu depois?",
      "Quando o cliente pede um desconto que você não pode dar, como você conduz?",
    ],
  },
  O: {
    nome: "Abertura ao Novo",
    abaixo: [
      "Me conta de uma mudança de processo ou ferramenta que te pegou de surpresa. Como foi a adaptação?",
      "Qual foi a última coisa que você aprendeu por conta própria pro trabalho? O que te fez ir atrás?",
    ],
    acima: [
      "Me conta de algo que você começou e não terminou. Por que parou?",
      "Como você lida com a parte repetitiva do trabalho — aquela que não muda nunca?",
    ],
  },
};

/** Perguntas disparadas pelo Índice de Confiança, não por dimensão. */
export const PERGUNTAS_DE_CONFIANCA: Record<string, string[]> = {
  desejabilidade: [
    "Como você se descreveria num dia ruim no trabalho? Me dá um exemplo concreto.",
    "Qual crítica você mais ouviu de gestores anteriores? Não a que você acha justa — a que você mais ouviu.",
  ],
  inconsistencia: [
    "Se eu ligasse pro seu último gestor hoje, o que ele diria que é o seu ponto mais fraco?",
  ],
  linha_reta: [
    "O questionário levou pouco tempo. Teve alguma pergunta que você achou difícil de responder? Qual?",
  ],
  velocidade: [
    "O questionário levou pouco tempo. Teve alguma pergunta que você achou difícil de responder? Qual?",
  ],
  convergencia: [
    "Nos cenários você escolheu um caminho e nas afirmações outro. Me conta de uma situação real em que você teve que escolher entre resolver rápido e alinhar com o time.",
  ],
};
