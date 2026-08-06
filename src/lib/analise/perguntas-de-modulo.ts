import type { DimensaoDisc } from "@/lib/instrument/baterias";
import type { FatorExibidoBigFive } from "@/lib/instrument/bigfive";
import type { ChaveDeCompetenciaSjt } from "@/lib/instrument/sjt";

/**
 * Banco de perguntas dos módulos do manual — a matéria-prima do §5.3.
 *
 * O §5.3 diz o GATILHO ("alternativa [0] em qualquer cenário", "score de
 * competência < 50", "fator ou dimensão em faixa Baixa") e a FORMA da pergunta
 * ("pergunta situacional real sobre a mesma competência", "me dê um exemplo
 * real em que você precisou…"). O texto de cada uma é escrito aqui.
 *
 * Todas comportamentais, pela mesma regra que já governa `interview-questions.ts`:
 * a pessoa conta um fato que aconteceu. Hipotética ("o que você faria se…")
 * mede imaginação — e no caso do SJT mediria de novo, na entrevista, exatamente
 * o que o cenário já mediu na prova.
 *
 * Nenhuma pergunta cita o teste, o cenário ou a alternativa escolhida. Além de
 * o gabarito nunca poder vazar (§4.2), o candidato que ouve "você errou o
 * cenário 4" responde à correção, não à pergunta.
 */

// ─── SJT: uma pergunta por competência (§4.3) ──────────────────────────────

export const PERGUNTA_POR_COMPETENCIA_SJT: Record<
  ChaveDeCompetenciaSjt,
  string
> = {
  foco_no_cliente:
    "Conte a vez em que você atendeu um cliente irritado por um problema que não tinha sido você quem causou. O que você fez, e como terminou?",
  responsabilidade:
    "Me conta de um erro seu que ninguém tinha percebido ainda. Como você lidou com ele?",
  organizacao:
    "Descreve uma semana em que apareceu mais trabalho do que cabia no prazo. Como você decidiu o que fazer primeiro?",
  trabalho_em_equipe:
    "Conte uma situação real de conflito com um colega. O que você fez e qual foi o resultado?",
  integridade:
    "Me dá um exemplo de quando te pediram algo que você achou que não estava certo. O que você fez?",
  adaptabilidade:
    "Conte de um projeto seu que mudou de rumo no meio. O que aconteceu com o trabalho que você já tinha feito?",
  comunicacao:
    "Me conta de uma tarefa que chegou até você sem estar clara, e sem ninguém disponível para explicar. Como você tocou?",
  proatividade:
    "Descreve algo no processo do seu trabalho que te incomodava e que ninguém mais reclamava. O que você fez a respeito?",
};

// ─── Big Five: pergunta de faixa Baixa, por fator (§2.6 + §5.3) ────────────

/**
 * A pergunta sonda o comportamento OPOSTO ao ponto fraco — é o que o §5.3 pede.
 * Não é armadilha: escore baixo num fator descreve tendência, e a entrevista
 * serve justamente para ver o que a pessoa faz quando a tendência não ajuda.
 */
export const PERGUNTA_DE_FAIXA_BAIXA_BIG_FIVE: Record<
  FatorExibidoBigFive,
  { pergunta: string; sonda: string }
> = {
  O: {
    pergunta:
      "Me dá um exemplo real de uma vez em que você precisou mudar o seu jeito de fazer alguma coisa que já funcionava. O que te convenceu?",
    sonda: "abertura a mudança de método",
  },
  C: {
    pergunta:
      "Me conta de uma entrega longa que dependeu só de você para não atrasar. Como você se organizou?",
    sonda: "organização e cumprimento de prazo",
  },
  E: {
    pergunta:
      "Descreve uma situação em que você precisou puxar uma conversa com gente que não conhecia para destravar o seu trabalho.",
    sonda: "iniciativa de contato",
  },
  A: {
    pergunta:
      "Me dá um exemplo de quando você discordou de alguém do time e mesmo assim manteve a relação boa depois.",
    sonda: "cooperação sob divergência",
  },
  EE: {
    pergunta:
      "Conte do período mais pesado que você viveu no trabalho. O que você fez para dar conta?",
    sonda: "reação a pressão",
  },
};

// ─── DISC: pergunta de faixa Baixa, por dimensão (§3.6 + §5.3) ─────────────

export const PERGUNTA_DE_FAIXA_BAIXA_DISC: Record<
  DimensaoDisc,
  { pergunta: string; sonda: string }
> = {
  D: {
    pergunta:
      "Me conta de uma decisão difícil que você teve que tomar sem poder consultar ninguém. Como foi?",
    sonda: "decisão e assunção de risco",
  },
  I: {
    pergunta:
      "Descreve uma vez em que você precisou convencer outras pessoas de uma ideia sua. Como você fez?",
    sonda: "influência e comunicação",
  },
  S: {
    pergunta:
      "Me dá um exemplo de um trabalho em que o seu papel foi sustentar o ritmo do time, não brilhar sozinho.",
    sonda: "constância e apoio ao grupo",
  },
  C: {
    pergunta:
      "Me dê um exemplo de trabalho detalhista que você concluiu bem. O que você fez para não deixar passar erro?",
    sonda: "precisão e cuidado com detalhe",
  },
};
