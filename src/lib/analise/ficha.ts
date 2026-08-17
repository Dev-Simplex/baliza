import {
  PERGUNTA_DE_FAIXA_BAIXA_BIG_FIVE,
  PERGUNTA_DE_FAIXA_BAIXA_DISC,
  PERGUNTA_POR_COMPETENCIA_SJT,
} from "@/lib/analise/perguntas-de-modulo";
import {
  DIMENSOES_DISC,
  FATOR_PRUMO_DE_BIG_FIVE,
  type DimensaoDisc,
  type ResultadoBigFive,
  type ResultadoDisc,
  type ResultadoEstiloEmocional,
  type ResultadoSjt,
  type ResultadosPorModulo,
  type Teste,
} from "@/lib/instrument/baterias";
import { DIMENSOES_ESTILO_EMOCIONAL } from "@/lib/instrument/estilo-emocional";
import {
  FATORES_EXIBIDOS_BIG_FIVE,
  INTERPRETACAO_BIG_FIVE,
  ROTULOS_BIG_FIVE,
  faixaBigFive,
  type FaixaBigFive,
  type FatorExibidoBigFive,
} from "@/lib/instrument/bigfive";
import {
  INTERPRETACAO_DISC,
  NOMES_DE_DISC,
  PERFIS_COMBINADOS_DISC,
} from "@/lib/instrument/disc";
import {
  CENARIO_SJT_POR_ID,
  COMPETENCIAS_SJT,
  LIMIAR_DE_ATENCAO_SJT,
  faixaSjt,
  type ChaveDeCompetenciaSjt,
  type FaixaSjt,
} from "@/lib/instrument/sjt";
import type { Fator } from "@/lib/instrument/types";

/**
 * A ficha do ANALISTA — §5.2 do manual.
 *
 * ─── O que este arquivo faz ────────────────────────────────────────────────
 * Traduz `Assessment.moduleResults` (o que cada teste gravou) na estrutura que
 * a tela e o PDF desenham. Não recalcula nada: as equações são de `bigfive.ts`,
 * `disc.ts` e `sjt.ts`, e refazê-las aqui criaria uma segunda conta para o
 * mesmo número — a forma mais silenciosa de os dois divergirem.
 *
 * O que ele faz de verdade é o trabalho de LEITURA que o manual exige e que
 * nenhum módulo sozinho consegue fazer:
 *
 *   · abrir o SJT por competência, porque o score geral esconde zero (§4.5);
 *   · marcar toda alternativa [0] escolhida, mesmo com score alto (§4.6);
 *   · devolver o alfabeto do Big Five ao do manual (o resultado é gravado na
 *     convenção do Prumo, e "X" não é nome de fator para ninguém);
 *   · virar tudo isso em pergunta de entrevista (§5.3).
 *
 * ─── ATENÇÃO: este módulo é de servidor ────────────────────────────────────
 * Ele importa `sjt.ts`, que carrega o BANCO DE CENÁRIOS COM GABARITO. Nunca
 * importe este arquivo de um componente com `"use client"`: o gabarito iria
 * junto para o navegador e queimaria o banco de cenários (§4.2). Os componentes
 * de ficha recebem o resultado pronto, já sem gabarito.
 */

// ─── Big Five ──────────────────────────────────────────────────────────────

/**
 * Volta do alfabeto do Prumo para o do manual.
 *
 * `ResultadoBigFive.fatores` é gravado na convenção do Prumo (C/E/X/A/O), com o
 * Neuroticismo já invertido em Estabilidade — foi `paraResultadoDeModuloBigFive`
 * quem traduziu, e por bons motivos (o fit lê os cinco fatores de uma régua
 * só). Para a FICHA, o manual pede de volta os rótulos dele: O, C, E
 * (Extroversão!), A e EE.
 *
 * O mapa é derivado do de ida, e não escrito à mão, porque as duas colisões que
 * ele resolve são invisíveis a olho nu: `E` quer dizer Extroversão de um lado e
 * Estabilidade do outro, e `N` não tem correspondente direto. Um mapa
 * independente aqui erraria em silêncio no dia em que o de lá mudasse.
 */
export const FATOR_PRUMO_DO_BIG_FIVE_EXIBIDO: Record<
  FatorExibidoBigFive,
  Fator
> = {
  O: FATOR_PRUMO_DE_BIG_FIVE.O,
  C: FATOR_PRUMO_DE_BIG_FIVE.C,
  E: FATOR_PRUMO_DE_BIG_FIVE.E, // Extroversão → X
  A: FATOR_PRUMO_DE_BIG_FIVE.A,
  // O único que troca de nome no caminho: o que foi gravado como Estabilidade
  // (a inversão do §2.4, passo 4) é a EE da ficha. "Neuroticismo" não reaparece.
  EE: FATOR_PRUMO_DE_BIG_FIVE.N,
};

export type NotaDaFicha = {
  chave: FatorExibidoBigFive;
  rotulo: string;
  resumo: string;
  score: number;
  faixa: FaixaBigFive;
  /** A leitura do §2.6 para o polo em que o escore caiu. */
  leitura: string;
};

export type BlocoBigFive = {
  notas: NotaDaFicha[];
};

export function montarBlocoBigFive(resultado: ResultadoBigFive): BlocoBigFive {
  return {
    notas: FATORES_EXIBIDOS_BIG_FIVE.map((chave) => {
      const score = resultado.fatores[FATOR_PRUMO_DO_BIG_FIVE_EXIBIDO[chave]];
      const faixa = faixaBigFive(score);
      return {
        chave,
        rotulo: ROTULOS_BIG_FIVE[chave].rotulo,
        resumo: ROTULOS_BIG_FIVE[chave].resumo,
        score,
        faixa,
        // Moderado é o meio dos dois polos: o manual manda descrever como
        // flexibilidade situacional, não escolher um lado (§2.6).
        leitura:
          faixa.nome === "alto"
            ? INTERPRETACAO_BIG_FIVE[chave].alto
            : faixa.nome === "baixo"
              ? INTERPRETACAO_BIG_FIVE[chave].baixo
              : "Equilíbrio entre os dois polos — tende a variar conforme a situação.",
      };
    }),
  };
}

// ─── DISC ──────────────────────────────────────────────────────────────────

export type BlocoDisc = {
  dimensoes: Array<{ dimensao: DimensaoDisc; nome: string; score: number }>;
  /** "D", "D/I" ou "D/I equilibrado" — como o módulo já gravou. */
  rotulo: string;
  /** A frase que descreve a junção dominante + secundária (§3.6). */
  resumo: string;
  fortes: string[];
  atencao: string[];
};

/** Quantos itens de "fortes"/"atenção" cabem na linha da ficha (§5.2). */
const ITENS_DE_LEITURA_DISC = 3;

/**
 * Mistura a leitura da dominante com a da secundária, como o §3.6 manda
 * ("a dimensão secundária tempera a dominante") e como o exemplo do §5.2 mostra:
 * para o perfil D/I, Fortes = decisão (D) + comunicação (I).
 */
function misturar(dominante: string[], secundaria: string[] | null): string[] {
  const lista = secundaria
    ? [dominante[0], secundaria[0], dominante[1]]
    : dominante;
  return [...new Set(lista.filter(Boolean))].slice(0, ITENS_DE_LEITURA_DISC);
}

export function montarBlocoDisc(resultado: ResultadoDisc): BlocoDisc {
  const dominante = INTERPRETACAO_DISC[resultado.dominante];
  const secundaria = resultado.secundaria
    ? INTERPRETACAO_DISC[resultado.secundaria]
    : null;

  const par = resultado.secundaria
    ? `${resultado.dominante}/${resultado.secundaria}`
    : null;

  return {
    dimensoes: DIMENSOES_DISC.map((d) => ({
      dimensao: d,
      nome: NOMES_DE_DISC[d].nome,
      score: resultado.dimensoes[d],
    })),
    rotulo: resultado.rotulo,
    resumo:
      // Os três pares que o manual descreve com texto próprio vêm prontos; os
      // demais são compostos pela regra da junção, que é o que o §3.6 pede de
      // quem monta o relatório.
      (par ? PERFIS_COMBINADOS_DISC[par] : null) ??
      (secundaria
        ? `${dominante.resumo}, temperado por quem é ${secundaria.resumo.toLowerCase()}`
        : dominante.resumo),
    fortes: misturar(dominante.fortes, secundaria?.fortes ?? null),
    atencao: misturar(dominante.atencao, secundaria?.atencao ?? null),
  };
}

// ─── Estilo Emocional do Cérebro ─────────────────────────────────────────

export type BlocoEstiloEmocional = {
  dimensoes: Array<{
    chave: keyof ResultadoEstiloEmocional["percentuais"];
    nome: string;
    score: number;
    leitura: string;
  }>;
};

export function montarBlocoEstiloEmocional(
  resultado: ResultadoEstiloEmocional,
): BlocoEstiloEmocional {
  return {
    dimensoes: DIMENSOES_ESTILO_EMOCIONAL.map((dimensao) => {
      const score = resultado.percentuais[dimensao.id];
      const faixa = score >= 80 ? "alta" : score < 30 ? "baixa" : "intermediária";
      const leitura =
        dimensao.id === "RESILIENCIA"
          ? score < 30
            ? "Recuperação rápida diante de contratempos."
            : score >= 80
              ? "Recuperação mais lenta; impactos emocionais tendem a permanecer por mais tempo."
              : "Recuperação emocional intermediária, variável conforme a situação."
          : `${dimensao.nome} ${faixa} segundo a régua do instrumento.`;
      return { chave: dimensao.id, nome: dimensao.nome, score, leitura };
    }),
  };
}

// ─── SJT ───────────────────────────────────────────────────────────────────

export type CompetenciaDaFicha = {
  /** Rótulo cheio do §4.3 ("Organização e priorização"). */
  rotulo: string;
  /** Rótulo curto da ficha ("Organização"). */
  curto: string;
  score: number;
  cenarios: number;
  /** Abaixo do limiar do §5.3 — é o `⚠` da ficha. */
  atencao: boolean;
};

export type PiorEscolhaDaFicha = {
  /** Título do cenário, como o §5.2 o cita ("Conflito com colega"). */
  titulo: string;
  competencia: string;
};

export type BlocoSjt = {
  score: number;
  pontosObtidos: number;
  pontosMaximos: number;
  faixa: FaixaSjt;
  competencias: CompetenciaDaFicha[];
  /** Cenários em que a pessoa escolheu a alternativa de 0 ponto (§4.6). */
  piores: PiorEscolhaDaFicha[];
};

/**
 * Rótulo cheio → rótulo curto.
 *
 * O módulo grava a competência pelo nome humano (é o que o contrato de
 * `baterias.ts` pede), e a ficha do §5.2 exibe a versão curta. A volta é feita
 * pelo próprio catálogo, então não existe uma segunda lista de nomes para
 * envelhecer.
 */
const CURTO_POR_ROTULO_SJT = new Map(
  Object.values(COMPETENCIAS_SJT).map((c) => [c.rotulo, c.curto]),
);

export function montarBlocoSjt(resultado: ResultadoSjt): BlocoSjt {
  return {
    score: resultado.score,
    pontosObtidos: resultado.pontosObtidos,
    pontosMaximos: resultado.pontosMaximos,
    faixa: faixaSjt(resultado.score),
    competencias: resultado.porCompetencia.map((c) => ({
      rotulo: c.competencia,
      curto: CURTO_POR_ROTULO_SJT.get(c.competencia) ?? c.competencia,
      score: c.score,
      cenarios: c.cenarios,
      atencao: c.score < LIMIAR_DE_ATENCAO_SJT,
    })),
    piores: resultado.piores.map((p) => ({
      // O título vem do banco de cenários, que é servidor puro. O que fica
      // gravado é só o id — de propósito: título e gabarito moram no mesmo
      // lugar, e o gravado atravessa exportações que ninguém previu.
      titulo: CENARIO_SJT_POR_ID.get(p.blocoId)?.titulo ?? "Cenário",
      competencia: p.competencia,
    })),
  };
}

// ─── A ficha inteira ───────────────────────────────────────────────────────

export type FichaDeModulos = {
  bigFive: BlocoBigFive | null;
  disc: BlocoDisc | null;
  estiloEmocional?: BlocoEstiloEmocional | null;
  sjt: BlocoSjt | null;
  /** Algum módulo do manual foi aplicado? */
  temAlgum: boolean;
};

/**
 * A ficha do analista para os módulos do manual.
 *
 * O Prumo não entra aqui: ele já tem a página inteira (faixas, radar,
 * arquétipo, nuances). Esta ficha é o que existe AO LADO dele — ou no lugar
 * dele, quando a vaga não o aplicou.
 */
export function montarFichaDeModulos(
  resultados: ResultadosPorModulo,
): FichaDeModulos {
  const bigFive = resultados.BIG_FIVE
    ? montarBlocoBigFive(resultados.BIG_FIVE)
    : null;
  const disc = resultados.DISC ? montarBlocoDisc(resultados.DISC) : null;
  const estiloEmocional = resultados.ESTILO_EMOCIONAL
    ? montarBlocoEstiloEmocional(resultados.ESTILO_EMOCIONAL)
    : null;
  const sjt = resultados.SJT ? montarBlocoSjt(resultados.SJT) : null;

  return {
    bigFive,
    disc,
    estiloEmocional,
    sjt,
    temAlgum: Boolean(bigFive || disc || estiloEmocional || sjt),
  };
}

// ─── §5.3 — os pontos fracos viram pergunta ────────────────────────────────

export type PerguntaDeModulo = {
  pergunta: string;
  motivo: string;
  origem: Teste;
  /**
   * Escolha de alternativa [0]: o §4.6 manda levar à entrevista
   * "independentemente do score geral". Obrigatória quer dizer que ela não é
   * cortada pelo teto de perguntas do roteiro — nunca.
   */
  obrigatoria: boolean;
};

/** Faixa Baixa do §2.6 — o gatilho da terceira linha do §5.3. */
export const LIMITE_DA_FAIXA_BAIXA = 34;

/**
 * Converte os pontos fracos dos módulos em perguntas, na ordem do §5.3.
 *
 * `pesoDoFator` é o filtro do "relevante para a vaga" da terceira linha da
 * tabela: quando o perfil-alvo da vaga dá peso 0 a um fator, ele foi
 * explicitamente descartado pelo recrutador e não vira pergunta. A função é
 * opcional porque nem todo chamador tem o perfil-alvo à mão — sem ela, todos os
 * fatores em faixa Baixa entram.
 *
 * Não existe filtro equivalente para o DISC: as quatro dimensões de estilo não
 * se mapeiam nos cinco fatores do perfil-alvo (é a mesma razão de o DISC não
 * produzir aderência), então a relevância dele é a própria decisão de aplicar o
 * teste na vaga.
 */
export function perguntasDosModulos(
  ficha: FichaDeModulos,
  opcoes: { pesoDoFator?: (fator: Fator) => number } = {},
): PerguntaDeModulo[] {
  const perguntas: PerguntaDeModulo[] = [];

  if (ficha.sjt) {
    // 1ª linha do §5.3 — a alternativa [0]. Vem primeiro e é obrigatória: é o
    // caso que o score geral esconde (§4.5) e o manual grifa duas vezes.
    for (const pior of ficha.sjt.piores) {
      const chave = chaveDaCompetencia(pior.competencia);
      const pergunta = chave ? PERGUNTA_POR_COMPETENCIA_SJT[chave] : null;
      if (!pergunta) continue;
      perguntas.push({
        pergunta,
        motivo: `Escolheu a pior alternativa no cenário "${pior.titulo}" (${pior.competencia}). O manual manda levar toda escolha dessas à entrevista, independentemente do score geral.`,
        origem: "SJT",
        obrigatoria: true,
      });
    }

    // 2ª linha do §5.3 — competência abaixo do limiar. Pula a que já entrou
    // pela escolha [0]: a pergunta seria a mesma, e repetir pergunta num
    // roteiro faz o entrevistador achar que perdeu a linha.
    for (const competencia of ficha.sjt.competencias) {
      if (!competencia.atencao) continue;
      const chave = chaveDaCompetencia(competencia.rotulo);
      const pergunta = chave ? PERGUNTA_POR_COMPETENCIA_SJT[chave] : null;
      if (!pergunta) continue;
      if (perguntas.some((p) => p.pergunta === pergunta)) continue;
      perguntas.push({
        pergunta,
        motivo: `${competencia.rotulo} ficou em ${competencia.score} no julgamento situacional, abaixo de ${LIMIAR_DE_ATENCAO_SJT}.`,
        origem: "SJT",
        obrigatoria: false,
      });
    }
  }

  // 3ª linha do §5.3 — fator ou dimensão em faixa Baixa.
  if (ficha.bigFive) {
    for (const nota of ficha.bigFive.notas) {
      if (nota.score > LIMITE_DA_FAIXA_BAIXA) continue;
      const peso = opcoes.pesoDoFator?.(
        FATOR_PRUMO_DO_BIG_FIVE_EXIBIDO[nota.chave],
      );
      if (peso === 0) continue;
      const { pergunta, sonda } = PERGUNTA_DE_FAIXA_BAIXA_BIG_FIVE[nota.chave];
      if (perguntas.some((p) => p.pergunta === pergunta)) continue;
      perguntas.push({
        pergunta,
        motivo: `${nota.rotulo} ficou em ${nota.score} (faixa Baixa) no Big Five. A pergunta sonda ${sonda} — escore baixo descreve tendência, não impedimento.`,
        origem: "BIG_FIVE",
        obrigatoria: false,
      });
    }
  }

  if (ficha.disc) {
    for (const dimensao of ficha.disc.dimensoes) {
      if (dimensao.score > LIMITE_DA_FAIXA_BAIXA) continue;
      const { pergunta, sonda } = PERGUNTA_DE_FAIXA_BAIXA_DISC[dimensao.dimensao];
      if (perguntas.some((p) => p.pergunta === pergunta)) continue;
      perguntas.push({
        pergunta,
        motivo: `${dimensao.nome} ficou em ${dimensao.score} no DISC, a dimensão com que esta pessoa menos se identifica. A pergunta sonda ${sonda} — DISC descreve estilo, não competência.`,
        origem: "DISC",
        obrigatoria: false,
      });
    }
  }

  return perguntas;
}

/** Rótulo cheio → chave da competência, para achar a pergunta do banco. */
function chaveDaCompetencia(rotulo: string): ChaveDeCompetenciaSjt | null {
  const entrada = Object.entries(COMPETENCIAS_SJT).find(
    ([, c]) => c.rotulo === rotulo || c.curto === rotulo,
  );
  return entrada ? (entrada[0] as ChaveDeCompetenciaSjt) : null;
}
