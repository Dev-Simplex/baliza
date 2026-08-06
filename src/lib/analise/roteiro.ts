import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import {
  PERGUNTAS_DE_CONFIANCA,
  PERGUNTAS_POR_DIMENSAO,
} from "@/lib/instrument/interview-questions";
import type { ContribuicaoDeFit } from "@/lib/instrument/scoring";
import { NOMES_DE_FATOR, type Fator } from "@/lib/instrument/types";
import type { PerguntaDeModulo } from "@/lib/analise/ficha";

/**
 * Roteiro de entrevista.
 *
 * O relatório termina em PERGUNTA, não em rótulo. Um escore diz "esta pessoa
 * tende a X"; ele não diz o que fazer com isso. A pergunta diz.
 *
 * INVARIANTE DO PRODUTO: o roteiro nunca sai vazio. Candidato perfeitamente
 * dentro de todas as faixas ainda precisa ser entrevistado — e há o que
 * perguntar a ele (a pergunta do arquétipo, e o custo do que ele tem de sobra).
 * Uma tela de roteiro em branco seria a mensagem errada: "não precisa
 * conversar", que é o oposto do que o produto defende.
 *
 * Só perguntas COMPORTAMENTAIS: o candidato conta um fato que aconteceu.
 * Hipotética ("o que você faria se...") mede imaginação, não histórico.
 */

export type PerguntaDoRoteiro = {
  pergunta: string;
  motivo: string;
  origem: "dimensao" | "confianca" | "arquetipo" | "base" | "modulo";
  fator?: Fator;
  prioridade: number;
  /**
   * Fora do teto de perguntas.
   *
   * Existe por causa do §4.6 do manual dos testes: toda alternativa [0]
   * escolhida no SJT vai à entrevista "independentemente do score geral". Uma
   * pergunta que o manual chama de obrigatória não pode cair no corte por ter
   * chegado em oitavo lugar.
   */
  obrigatoria?: boolean;
};

export type Roteiro = {
  perguntas: PerguntaDoRoteiro[];
  resumoDoGap: string;
};

const LIMITE_DE_PERGUNTAS = 7;

/**
 * Prioridade das perguntas vindas dos módulos do manual (Big Five, DISC, SJT).
 *
 * Acima do topo da faixa das dimensões do Prumo (100 + perda × 100, teto 200)
 * para as obrigatórias, e no meio dela para as demais: uma escolha [0] no SJT é
 * o achado mais concreto que a bateria produz — a pessoa disse o que faria numa
 * situação de trabalho, e escolheu a pior das quatro ações.
 */
const PRIORIDADE_DO_MODULO = { obrigatoria: 300, comum: 150 } as const;

export function montarRoteiro(entrada: {
  contribuicoes: ContribuicaoDeFit[];
  sinaisDeConfianca: string[];
  arquetipoId: string | null;
  /** Não é lido aqui; fica no contrato porque a chamada já o tem em mãos. */
  escores?: Record<Fator, number>;
  /**
   * Perguntas dos módulos do manual (§5.3), já montadas por `analise/ficha.ts`.
   *
   * Entram no MESMO roteiro, e não numa lista ao lado, porque quem entrevista
   * leva uma folha só. Duas listas de perguntas na mesma tela viram uma lista
   * lida e outra esquecida.
   */
  perguntasDeModulo?: PerguntaDeModulo[];
  /**
   * A bateria não mede os cinco fatores (nem Prumo nem Big Five).
   *
   * Muda o resumo: sem aderência, "todas as dimensões ficaram dentro da faixa"
   * seria uma afirmação sobre uma conta que não foi feita.
   */
  semAderencia?: boolean;
}): Roteiro {
  const perguntas: PerguntaDoRoteiro[] = [];

  // 1. Dimensões fora da faixa — as que estão custando aderência.
  //    Ordenadas pela perda, porque é onde a conversa rende mais.
  const foraDaFaixa = entrada.contribuicoes
    .filter((c) => !c.dentro && c.peso > 0)
    .sort((a, b) => b.perda - a.perda);

  for (const contribuicao of foraDaFaixa) {
    const banco = PERGUNTAS_POR_DIMENSAO[contribuicao.fator];
    if (!banco) continue;

    const [lo, hi] = contribuicao.faixa;
    const abaixo = contribuicao.escore < lo;
    const lista = abaixo ? banco.abaixo : banco.acima;
    const nome = NOMES_DE_FATOR[contribuicao.fator].ui;

    for (const pergunta of lista.slice(0, 2)) {
      if (perguntas.some((p) => p.pergunta === pergunta)) continue;
      perguntas.push({
        pergunta,
        origem: "dimensao",
        fator: contribuicao.fator,
        prioridade: 100 + contribuicao.perda * 100,
        motivo: abaixo
          ? `${nome} ficou em ${Math.round(contribuicao.escore)}, abaixo do piso de ${lo} que esta vaga pede. Vale checar se o risco é real.`
          : `${nome} ficou em ${Math.round(contribuicao.escore)}, acima do teto de ${hi} desta vaga. Vale checar o custo do excesso.`,
      });
    }
  }

  // 2. Sinais do Índice de Confiança — perguntas que sondam a própria resposta.
  for (const sinal of entrada.sinaisDeConfianca) {
    const lista = PERGUNTAS_DE_CONFIANCA[sinal];
    if (!lista) continue;
    for (const pergunta of lista.slice(0, 1)) {
      if (perguntas.some((p) => p.pergunta === pergunta)) continue;
      perguntas.push({
        pergunta,
        origem: "confianca",
        prioridade: 90,
        motivo: MOTIVO_DO_SINAL[sinal] ?? "O padrão de respostas pede confirmação.",
      });
    }
  }

  // 2.5. Os módulos do manual (§5.3): escolha [0] e competência fraca no SJT,
  //      fator do Big Five ou dimensão do DISC em faixa Baixa.
  for (const p of entrada.perguntasDeModulo ?? []) {
    if (perguntas.some((q) => q.pergunta === p.pergunta)) continue;
    perguntas.push({
      pergunta: p.pergunta,
      motivo: p.motivo,
      origem: "modulo",
      obrigatoria: p.obrigatoria,
      prioridade: p.obrigatoria
        ? PRIORIDADE_DO_MODULO.obrigatoria
        : PRIORIDADE_DO_MODULO.comum,
    });
  }

  // 3. A pergunta do arquétipo — sempre entra. É o piso do roteiro.
  const arquetipo = entrada.arquetipoId
    ? ARQUETIPO_POR_ID.get(entrada.arquetipoId)
    : null;

  if (arquetipo) {
    perguntas.push({
      pergunta: arquetipo.perguntaChave,
      origem: "arquetipo",
      prioridade: 80,
      motivo: `Perfil próximo de ${arquetipo.nome}. ${arquetipo.cuidadoAoLer}`,
    });
  }

  // 4. Piso de segurança: se ainda assim vier curto, sonda a dimensão de maior
  //    peso pelo lado do excesso. Ninguém é forte demais de graça.
  if (perguntas.length < 3) {
    const maisPesada = [...entrada.contribuicoes]
      .filter((c) => c.peso > 0)
      .sort((a, b) => b.peso - a.peso)[0];

    // `banco` pode não existir se um fator novo entrar no modelo antes de
    // entrar no banco de perguntas. Aqui não dá pra `continue`: é a última
    // parada antes do piso absoluto, e derrubar a página com um TypeError
    // seria a pior forma possível de o roteiro "não sair vazio".
    const banco = maisPesada
      ? PERGUNTAS_POR_DIMENSAO[maisPesada.fator]
      : undefined;

    if (maisPesada && banco) {
      const nome = NOMES_DE_FATOR[maisPesada.fator].ui;
      for (const pergunta of banco.acima.slice(0, 2)) {
        if (perguntas.some((p) => p.pergunta === pergunta)) continue;
        perguntas.push({
          pergunta,
          origem: "base",
          fator: maisPesada.fator,
          prioridade: 50,
          motivo: `${nome} é a dimensão de maior peso nesta vaga e o escore está dentro da faixa. Confirme que a força se sustenta na prática.`,
        });
      }
    }
  }

  // 5. Piso absoluto — a regra nº 6 do produto, garantida por construção.
  //
  //    Os passos 1 a 4 dependem todos de haver ALGUMA dimensão com peso e de o
  //    arquétipo ter sido atribuído. Nenhuma das duas coisas é garantida: um
  //    perfil-alvo com todos os pesos em zero (o recrutador pode montá-lo) e
  //    uma avaliação sem `archetypeId` gravado deixam os quatro passos mudos —
  //    e a tela de roteiro sai em branco. Roteiro em branco diz "não precisa
  //    conversar", que é o oposto exato do que o produto defende.
  //
  //    Estas perguntas não dependem de escore nenhum: valem para qualquer
  //    pessoa, e é justamente por isso que servem de piso.
  if (perguntas.length === 0) {
    for (const { pergunta, motivo } of PERGUNTAS_DE_PISO) {
      perguntas.push({ pergunta, motivo, origem: "base", prioridade: 10 });
    }
  }

  // O teto vale para as perguntas que o roteiro ESCOLHEU fazer. As obrigatórias
  // não disputam vaga com elas: são sempre todas, e vêm na frente.
  const ordenadas = perguntas.sort((a, b) => b.prioridade - a.prioridade);
  const obrigatorias = ordenadas.filter((p) => p.obrigatoria);
  const demais = ordenadas
    .filter((p) => !p.obrigatoria)
    .slice(0, LIMITE_DE_PERGUNTAS);

  return {
    perguntas: [...obrigatorias, ...demais],
    resumoDoGap: resumirGap(foraDaFaixa, entrada.semAderencia ?? false),
  };
}

/**
 * O que se pergunta quando o instrumento não apontou nada — porque continua
 * havendo o que perguntar. Comportamentais, como todas as outras.
 */
const PERGUNTAS_DE_PISO: Array<{ pergunta: string; motivo: string }> = [
  {
    pergunta:
      "Me conta da entrega da qual você mais se orgulha nos últimos dois anos. Qual foi exatamente a sua parte nela?",
    motivo:
      "Nenhuma dimensão desta vaga ficou fora da faixa. A conversa começa pelo que a pessoa fez, não pelo que ela pontuou.",
  },
  {
    pergunta:
      "E a vez em que deu errado — o que aconteceu, e o que você faria diferente hoje?",
    motivo:
      "O contraponto da pergunta anterior. Quem só tem acerto pra contar ainda não foi testado, ou não está contando.",
  },
  {
    pergunta:
      "Descreve o melhor gestor que você teve. O que ele fazia que te fazia render?",
    motivo:
      "Diz mais sobre o que a pessoa precisa para funcionar do que qualquer autoavaliação — e é o que o gestor dela vai ter que dar.",
  },
];

const MOTIVO_DO_SINAL: Record<string, string> = {
  desejabilidade:
    "A pessoa concordou com afirmações que quase ninguém sustenta. Comum em processo seletivo — mas pede confirmação.",
  inconsistencia:
    "Itens equivalentes receberam respostas distantes. Pode ser desatenção, pode ser personagem.",
  linha_reta:
    "Sequência longa de respostas idênticas, com itens invertidos no meio. Sugere resposta no automático.",
  velocidade:
    "O tempo por item ficou abaixo do necessário para ler o enunciado.",
  convergencia:
    "As escolhas nos cenários não batem com o que as afirmações disseram.",
};

function resumirGap(foraDaFaixa: ContribuicaoDeFit[], semAderencia: boolean) {
  // Sem os cinco fatores não houve comparação com o perfil-alvo. Dizer que
  // "todas as dimensões ficaram dentro da faixa" seria dar por aprovada uma
  // conta que ninguém fez.
  if (semAderencia)
    return "Esta bateria não mede os cinco fatores, então não há comparação com o perfil-alvo da vaga. O roteiro abaixo vem do que os testes aplicados mostraram.";

  if (foraDaFaixa.length === 0)
    return "Todas as dimensões que pesam nesta vaga ficaram dentro da faixa alvo. O roteiro abaixo confirma se as forças se sustentam na prática.";

  const nomes = foraDaFaixa
    .slice(0, 3)
    .map((c) => {
      const [lo, hi] = c.faixa;
      const lado = c.escore < lo ? "abaixo" : "acima";
      return `${NOMES_DE_FATOR[c.fator].ui} (${lado} da faixa ${lo}–${hi})`;
    })
    .join(", ");

  return `${foraDaFaixa.length} ${foraDaFaixa.length === 1 ? "dimensão ficou fora de prumo" : "dimensões ficaram fora de prumo"} para esta vaga: ${nomes}. O roteiro sonda exatamente esses pontos.`;
}
