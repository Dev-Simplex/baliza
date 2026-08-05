/**
 * Quanto ainda falta, em minutos.
 *
 * "23 de 39" responde onde a pessoa está, não o que ela quer saber para decidir
 * se continua agora ou fecha a aba: quanto tempo isso ainda vai tomar. Contagem
 * de telas sozinha parece infinita — e desistir no meio custa a resposta
 * inteira, porque prova incompleta não vira relatório. Foi por essa mesma razão
 * que a prova encolheu de 52 telas para 39.
 *
 * Os dois pesos vêm do mesmo lugar que a estimativa da tela de abertura, e
 * ficam aqui para as duas telas nunca discordarem entre si. Afirmação é leitura
 * curta e resposta imediata; situação é ler um caso e ordenar duas ações.
 */
export const SEGUNDOS_POR_AFIRMACAO = 6;
export const SEGUNDOS_POR_SITUACAO = 25;

export function segundosEstimados(afirmacoes: number, situacoes: number) {
  return (
    Math.max(0, afirmacoes) * SEGUNDOS_POR_AFIRMACAO +
    Math.max(0, situacoes) * SEGUNDOS_POR_SITUACAO
  );
}

/**
 * Estimativa da prova inteira, em minutos.
 *
 * O piso existe porque prometer "3 minutos" e a pessoa levar 7 é pior do que
 * prometer 8 e ela levar 6: a promessa curta demais vira sensação de enrolação.
 */
export function minutosEstimados(
  afirmacoes: number,
  situacoes: number,
  piso = 0,
) {
  return Math.max(piso, Math.round(segundosEstimados(afirmacoes, situacoes) / 60));
}

/**
 * Rótulo do que falta. Devolve null perto do fim: "cerca de 1 min" quando faltam
 * duas perguntas é ruído, e a contagem de telas já diz tudo ali.
 */
export function rotuloDoRestante(afirmacoes: number, situacoes: number) {
  const segundos = segundosEstimados(afirmacoes, situacoes);
  if (segundos < 45) return null;
  if (segundos < 90) return "cerca de 1 min";
  return `cerca de ${Math.round(segundos / 60)} min`;
}
