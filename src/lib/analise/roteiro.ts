import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import {
  PERGUNTAS_DE_CONFIANCA,
  PERGUNTAS_POR_DIMENSAO,
} from "@/lib/instrument/interview-questions";
import type { ContribuicaoDeFit } from "@/lib/instrument/scoring";
import { NOMES_DE_FATOR, type Fator } from "@/lib/instrument/types";

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
  origem: "dimensao" | "confianca" | "arquetipo" | "base";
  fator?: Fator;
  prioridade: number;
};

export type Roteiro = {
  perguntas: PerguntaDoRoteiro[];
  resumoDoGap: string;
};

const LIMITE_DE_PERGUNTAS = 7;

export function montarRoteiro(entrada: {
  contribuicoes: ContribuicaoDeFit[];
  sinaisDeConfianca: string[];
  arquetipoId: string | null;
  escores: Record<Fator, number>;
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

    if (maisPesada) {
      const banco = PERGUNTAS_POR_DIMENSAO[maisPesada.fator];
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

  const ordenadas = perguntas
    .sort((a, b) => b.prioridade - a.prioridade)
    .slice(0, LIMITE_DE_PERGUNTAS);

  return { perguntas: ordenadas, resumoDoGap: resumirGap(foraDaFaixa) };
}

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

function resumirGap(foraDaFaixa: ContribuicaoDeFit[]) {
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
