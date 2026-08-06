import type { Pergunta, TipoDePergunta } from "@/components/teste/tipos-da-prova";

/**
 * Quanto ainda falta, em minutos.
 *
 * "23 de 39" responde onde a pessoa está, não o que ela quer saber para decidir
 * se continua agora ou fecha a aba: quanto tempo isso ainda vai tomar. Contagem
 * de telas sozinha parece infinita — e desistir no meio custa a resposta
 * inteira, porque prova incompleta não vira relatório.
 *
 * ─── Duas estimativas, dois trabalhos ──────────────────────────────────────
 * O catálogo (`baterias.ts`) diz quanto cada teste PROMETE: é o número da tela
 * de abertura e da seleção da vaga, e ele usa sempre o teto da faixa do manual.
 * Aqui é a estimativa do que ainda falta, com a pessoa já respondendo — e ela
 * mede o ritmo real de cada tipo de tela.
 *
 * As duas não precisam coincidir, mas a de dentro nunca pode passar da
 * prometida: "faltam 9 min" numa prova anunciada como de 6 é a promessa virando
 * mentira no meio do caminho. `tempo-estimado.test.ts` tranca essa desigualdade
 * para toda a bateria.
 */

/** Ler uma frase curta e escolher um número de 1 a 5. */
export const SEGUNDOS_POR_AFIRMACAO = 6;

/** Ler um caso de trabalho e ordenar duas ações entre quatro. */
export const SEGUNDOS_POR_SITUACAO = 25;

/** Ler 4 adjetivos soltos e escolher o que MAIS e o que MENOS combinam. */
export const SEGUNDOS_POR_BLOCO_DE_PALAVRAS = 30;

/** Ler um cenário inteiro e comparar 4 condutas possíveis — a tela mais cara. */
export const SEGUNDOS_POR_CENARIO = 90;

export const SEGUNDOS_POR_TIPO: Record<TipoDePergunta, number> = {
  likert: SEGUNDOS_POR_AFIRMACAO,
  ordenar: SEGUNDOS_POR_SITUACAO,
  "mais-menos": SEGUNDOS_POR_BLOCO_DE_PALAVRAS,
  escolha: SEGUNDOS_POR_CENARIO,
};

export function segundosDasPerguntas(
  perguntas: readonly Pick<Pergunta, "tipo">[],
): number {
  return perguntas.reduce((a, p) => a + (SEGUNDOS_POR_TIPO[p.tipo] ?? 0), 0);
}

/**
 * Estimativa em minutos inteiros.
 *
 * O piso existe porque prometer "3 minutos" e a pessoa levar 7 é pior do que
 * prometer 8 e ela levar 6: a promessa curta demais vira sensação de enrolação.
 */
export function minutosDasPerguntas(
  perguntas: readonly Pick<Pergunta, "tipo">[],
  piso = 0,
): number {
  return Math.max(piso, Math.round(segundosDasPerguntas(perguntas) / 60));
}

/**
 * Rótulo do que falta. Devolve null perto do fim: "cerca de 1 min" quando faltam
 * duas perguntas é ruído, e a contagem de telas já diz tudo ali.
 */
export function rotuloDoRestante(
  perguntas: readonly Pick<Pergunta, "tipo">[],
): string | null {
  const segundos = segundosDasPerguntas(perguntas);
  if (segundos < 45) return null;
  if (segundos < 90) return "cerca de 1 min";
  return `cerca de ${Math.round(segundos / 60)} min`;
}
