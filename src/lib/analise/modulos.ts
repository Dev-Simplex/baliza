import {
  escoresParaFit,
  lerBateria,
  lerResultados,
  type Bateria,
  type ResultadosPorModulo,
  type Teste,
} from "@/lib/instrument/baterias";
import { ITEM_BIG_FIVE_POR_ID } from "@/lib/instrument/bigfive";
import { BLOCO_DISC_POR_ID } from "@/lib/instrument/disc";
import type { Fator, PerfilAlvo } from "@/lib/instrument/types";

import {
  montarFichaDeModulos,
  perguntasDosModulos,
  type FichaDeModulos,
  type PerguntaDeModulo,
} from "@/lib/analise/ficha";
import {
  avaliarQualidade,
  seloDoBigFive,
  type QualidadeDasRespostas,
  type SeloDeConfianca,
} from "@/lib/analise/qualidade";

/**
 * A leitura de uma avaliação concluída, montada num lugar só.
 *
 * ─── Por que existe ────────────────────────────────────────────────────────
 * O relatório tem DUAS representações — a tela (`candidatos/[id]/page.tsx`) e o
 * PDF (`candidatos/[id]/pdf/route.tsx`) — e essa duplicação é conhecida e
 * aceita: são meios diferentes desenhando a mesma coisa. O que não pode
 * duplicar é a DECISÃO de o que mostrar: de onde vêm os cinco fatores, se há
 * aderência, qual selo acompanha o número, quais alertas de qualidade
 * dispararam. Duas cópias dessa lógica divergiriam, e o dia em que
 * divergissem seria o dia em que a tela e o PDF do mesmo candidato contariam
 * histórias diferentes.
 *
 * Esta função não toca no banco: recebe as linhas já carregadas e devolve a
 * leitura pronta. Quem consulta continua sendo a página e a rota, cada uma com
 * o próprio escopo de tenant.
 */

// ─── Entrada ───────────────────────────────────────────────────────────────

/** As colunas da `Assessment` que a leitura consome. */
export type LinhaDeAvaliacao = {
  testBattery: unknown;
  moduleResults: unknown;
  scores: unknown;
  confidence: unknown;
  fitScore: number | null;
};

/** As respostas brutas, como saem das três tabelas de resposta. */
export type LinhasDeResposta = {
  /** `ItemResponse` — afirmações Likert da Baliza E do Big Five. */
  itens?: Array<{ itemId: string; value: number; elapsedMs: number | null }>;
  /** `ScenarioResponse` — blocos MAIS/MENOS da Baliza E do DISC. */
  blocos?: Array<{ blockId: string; elapsedMs: number | null }>;
};

// ─── Saída ─────────────────────────────────────────────────────────────────

export type LeituraDaAvaliacao = {
  bateria: Bateria;
  modulos: ResultadosPorModulo;
  ficha: FichaDeModulos;
  /**
   * Os cinco fatores e de onde vieram — `null` quando a bateria não os produz.
   *
   * NUNCA trate `null` como zero: é "não medido", e zero na tela se lê como
   * "candidato péssimo". É a mesma regra que `concluirAvaliacao` aplica ao
   * gravar `fitScore` nulo.
   */
  escores: Record<Fator, number> | null;
  origemDosFatores: Teste | null;
  /**
   * O selo que acompanha a aderência. Só é `null` quando não há aderência
   * nenhuma para acompanhar — a regra do §4.4 (o fit nunca aparece sozinho)
   * está garantida aqui, e não na tela.
   */
  selo: SeloDeConfianca | null;
  /** `null` quando a bateria não tem módulo sujeito aos alertas do §6.3. */
  qualidade: QualidadeDasRespostas | null;
  perguntasDeModulo: PerguntaDeModulo[];
};

// ─── A regra do §4.4, num lugar só ─────────────────────────────────────────

/**
 * Os alertas de qualidade dos módulos do manual, quando a bateria os tem.
 *
 * Só as respostas do Big Five e do DISC: as da Baliza têm o próprio índice de
 * confiança, calculado no encerramento, e não passam por aqui.
 */
export function qualidadeDosModulos(
  modulos: ResultadosPorModulo,
  respostas: LinhasDeResposta,
): QualidadeDasRespostas | null {
  if (!modulos.BIG_FIVE && !modulos.DISC) return null;

  return avaliarQualidade({
    bigFive: (respostas.itens ?? [])
      .filter((r) => ITEM_BIG_FIVE_POR_ID.has(r.itemId))
      .map((r) => ({ itemId: r.itemId, valor: r.value, tempoMs: r.elapsedMs })),
    disc: (respostas.blocos ?? [])
      .filter((r) => BLOCO_DISC_POR_ID.has(r.blockId))
      .map((r) => ({ blocoId: r.blockId, tempoMs: r.elapsedMs })),
  });
}

/**
 * §4.4 do produto: o fit NUNCA aparece sozinho.
 *
 * O selo da Baliza vem gravado em `confidence`. Quando os cinco fatores vieram
 * do Big Five, essa coluna não tem o que guardar — o `calcularConfianca` lê
 * itens de desejabilidade, pares do banco e convergência com cenários, e nada
 * disso existe no Mini-IPIP. O substituto é o selo derivado dos alertas de
 * qualidade; sem ele a aderência apareceria nua, e fit sem selo vira nota de
 * aprovação.
 *
 * ─── Por que isto virou função exportada ──────────────────────────────────
 * Porque a regra estava só na LEITURA. `concluirAvaliacao` gravava
 * `confidence: prumo?.confianca ?? null`, então uma bateria de Big Five
 * terminava com número e coluna vazia. A ficha do candidato disfarçava (ela
 * chama `lerAvaliacao`, que derivava na hora), mas a lista de candidatos e o
 * ranking da vaga leem a coluna crua — e exibiam a aderência SOZINHA, que é
 * exatamente o que o §4.4 proíbe. Um revisor achou o caso ao vivo: 58,1 sem
 * selo, na tela, hoje.
 *
 * A ironia é que o commit que gravou `scores` para o Big Five documenta esse
 * mesmo defeito três linhas acima do `confidence` que deixou passar.
 *
 * Agora escrita e leitura chamam a mesma função. Quem gravar um selo novo não
 * precisa lembrar de duas regras iguais em lugares diferentes.
 */
export function seloQueAcompanha(
  confiancaDoPrumo: SeloDeConfianca | null,
  escores: Record<Fator, number> | null,
  qualidade: QualidadeDasRespostas | null,
): SeloDeConfianca | null {
  return (
    confiancaDoPrumo ?? (escores && qualidade ? seloDoBigFive(qualidade) : null)
  );
}

// ─── Montagem ──────────────────────────────────────────────────────────────

export function lerAvaliacao(
  avaliacao: LinhaDeAvaliacao,
  respostas: LinhasDeResposta = {},
  perfilAlvo?: PerfilAlvo | null,
): LeituraDaAvaliacao {
  const bateria = lerBateria(avaliacao.testBattery);
  const modulos = lerResultados(avaliacao.moduleResults);
  const ficha = montarFichaDeModulos(modulos);

  /*
   * De onde saem os cinco fatores.
   *
   * `moduleResults` vem primeiro e a coluna `scores` é o fallback, nesta ordem
   * e não na inversa. A coluna guarda o resultado do PRUMO; uma bateria que
   * aplique só o Big Five produz os cinco fatores (é o que `escoresParaFit`
   * decide) sem passar por ela. Ler a coluna primeiro faria essa avaliação
   * parecer "sem os cinco fatores" tendo os cinco fatores gravados a um campo
   * de distância.
   *
   * O fallback fica porque toda avaliação anterior à bateria de testes tem
   * `scores` preenchido e `moduleResults` nulo — e o relatório delas não pode
   * mudar de forma nenhuma.
   */
  const fonte = escoresParaFit(modulos);
  const escores =
    fonte?.escores ?? ((avaliacao.scores as Record<Fator, number> | null) ?? null);

  const qualidade = qualidadeDosModulos(modulos, respostas);
  const confianca = avaliacao.confidence as SeloDeConfianca | null;

  return {
    bateria,
    modulos,
    ficha,
    escores,
    origemDosFatores: fonte?.origem ?? (escores ? "PRUMO" : null),
    selo: seloQueAcompanha(confianca, escores, qualidade),
    qualidade,
    perguntasDeModulo: perguntasDosModulos(ficha, {
      pesoDoFator: perfilAlvo
        ? (fator: Fator) => perfilAlvo[fator]?.peso ?? 1
        : undefined,
    }),
  };
}
