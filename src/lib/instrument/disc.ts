import {
  DIMENSOES_DISC,
  NOMES_DE_DISC,
  type DimensaoDisc,
  type ResultadoDisc as ResultadoDiscDeModulo,
} from "./baterias";
import { criarAleatorio, embaralhar } from "./form";

/**
 * BATERIA 2 — DISC (versão aberta). Manual §3.
 *
 * ─── O que este arquivo é ───────────────────────────────────────────────────
 * Banco dos 12 blocos, as equações do §3.4 na íntegra (contagem, líquido,
 * conversão 0–100, conferência de consistência e classificação do perfil) e a
 * montagem da forma. Sem tela, sem persistência.
 *
 * ─── Divisão com `baterias.ts` ──────────────────────────────────────────────
 * As dimensões e seus nomes vêm de lá (contrato). Daqui sai a `ApuracaoDisc`,
 * rica o bastante para conferir contra o §3.5, e `paraResultadoDeModuloDisc`
 * reduz ao `ResultadoDisc` que é gravado.
 *
 * ─── Por que o formato é escolha forçada ────────────────────────────────────
 * Cada bloco pede 1 "MAIS" e 1 "MENOS" entre 4 adjetivos, obrigatoriamente
 * diferentes (§3.2). Isso torna o instrumento IPSATIVO: o candidato distribui
 * uma quantidade fixa de preferência, e o resultado diz o que ele prefere
 * DENTRO de si — não quanto ele tem comparado a outra pessoa. É por isso que a
 * nota DISC entra na ficha como contexto e não como nota de aprovação (§3.6,
 * nota para o RH).
 *
 * ─── Base legal ─────────────────────────────────────────────────────────────
 * A teoria DISC é de domínio público e os adjetivos deste banco são autorais do
 * manual (§1, regra 6).
 */

// ─── Dimensões ─────────────────────────────────────────────────────────────

/**
 * Dimensões e nomes (§3.1) vêm do contrato. `DIMENSOES_DISC` está na ordem
 * canônica do manual — que aqui não é decorativa: é o desempate final da
 * classificação de perfil e a ordem da ficha (§5.2).
 *
 * O mapeamento letra→dimensão é interno; o que aparece na tela é o adjetivo.
 */
export { DIMENSOES_DISC, NOMES_DE_DISC };
export type { DimensaoDisc };

/** Texto exato da instrução ao candidato (§3.2). Não parafrasear. */
export const INSTRUCAO_DISC =
  "Você verá 12 grupos de 4 palavras. Em cada grupo, marque a palavra que MAIS " +
  "parece com você e a que MENOS parece com você no ambiente de trabalho. " +
  "As duas escolhas devem ser diferentes.";

// ─── Banco de blocos (§3.3) ────────────────────────────────────────────────

export type AdjetivoDisc = {
  id: string;
  texto: string;
  /** USO INTERNO. Nunca exibir (§3.3). */
  dimensao: DimensaoDisc;
};

export type BlocoDisc = {
  id: string;
  /** Número na tabela do §3.3 — permite conferir bloco a bloco contra o manual. */
  numero: number;
  /** Sempre 4, sempre na ordem D · I · S · C dentro do BANCO (não na tela). */
  adjetivos: AdjetivoDisc[];
};

/**
 * Os 12 blocos do §3.3, na ordem `[D, I, S, C]` — a mesma da tabela do manual,
 * para que a conferência seja coluna a coluna.
 *
 * Guardar em ordem fixa aqui NÃO expõe o mapeamento ao candidato: a ordem que
 * ele vê é sorteada em `montarFormaDisc`, e o id de cada adjetivo é derivado do
 * TEXTO (não da posição), justamente para que o id sozinho não entregue a
 * dimensão.
 */
const TABELA_DO_MANUAL: Array<[string, string, string, string]> = [
  ["Decidido", "Comunicativo", "Paciente", "Detalhista"],
  ["Competitivo", "Entusiasmado", "Leal", "Cauteloso"],
  ["Direto", "Persuasivo", "Calmo", "Preciso"],
  ["Ousado", "Sociável", "Constante", "Metódico"],
  ["Firme", "Otimista", "Conciliador", "Criterioso"],
  ["Exigente", "Expressivo", "Prestativo", "Disciplinado"],
  ["Determinado", "Envolvente", "Tranquilo", "Analítico"],
  ["Enérgico", "Inspirador", "Acolhedor", "Organizado"],
  [
    "Rápido nas decisões",
    "Espontâneo",
    "Bom ouvinte",
    "Rigoroso com qualidade",
  ],
  [
    "Assume o comando",
    "Faz amizades com facilidade",
    "Evita conflitos",
    "Segue regras",
  ],
  [
    "Focado em resultados",
    "Focado em pessoas",
    "Focado na equipe",
    "Focado em processos",
  ],
  ["Independente", "Convincente", "Previsível", "Perfeccionista"],
];

/** Texto → pedaço de id estável: sem acento, minúsculo, hífen no lugar de espaço. */
function apelido(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // marcas de acento soltas pelo NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const BLOCOS_DISC: readonly BlocoDisc[] = TABELA_DO_MANUAL.map(
  (adjetivos, indice) => {
    const numero = indice + 1;
    const blocoId = `disc-b${String(numero).padStart(2, "0")}`;
    return {
      id: blocoId,
      numero,
      adjetivos: adjetivos.map((texto, coluna) => ({
        id: `${blocoId}-${apelido(texto)}`,
        texto,
        dimensao: DIMENSOES_DISC[coluna],
      })),
    };
  },
);

export const BLOCO_DISC_POR_ID = new Map<string, BlocoDisc>(
  BLOCOS_DISC.map((b) => [b.id, b]),
);

/** 12 blocos (§3.3). É o `n` de todas as equações do §3.4. */
export const TOTAL_DE_BLOCOS_DISC = BLOCOS_DISC.length; // 12

export const ADJETIVOS_POR_BLOCO_DISC = 4;

// ─── Equações (§3.4) ───────────────────────────────────────────────────────

/**
 * O líquido varia de −12 a +12 (−n a +n): no extremo, a dimensão foi "MAIS" nos
 * 12 blocos e "MENOS" em nenhum, ou o contrário.
 */
export const LIQUIDO_MINIMO_DISC = -TOTAL_DE_BLOCOS_DISC; // −12
export const LIQUIDO_MAXIMO_DISC = TOTAL_DE_BLOCOS_DISC; // +12
/** A amplitude — o "24" escrito no §3.4. É `2 × n`, não uma constante solta. */
export const AMPLITUDE_DO_LIQUIDO_DISC =
  LIQUIDO_MAXIMO_DISC - LIQUIDO_MINIMO_DISC; // 24

/**
 * `score = ((liquido + 12) / 24) × 100`, arredondado (§3.4).
 *
 * Mesma régua linear do Big Five: desloca o piso para zero e divide pela
 * amplitude. Como o líquido parte de −12, uma dimensão neutra (mesmo número de
 * MAIS e MENOS) cai exatamente em 50 — o que é a leitura certa num instrumento
 * ipsativo: 50 é "nem preferida nem rejeitada", não "média das pessoas".
 *
 * `Math.round` (meio para cima) é o que reproduz o §3.5: 62,5 → 63.
 */
export function escoreDoLiquidoDisc(liquido: number): number {
  return Math.round(
    ((liquido - LIQUIDO_MINIMO_DISC) / AMPLITUDE_DO_LIQUIDO_DISC) * 100,
  );
}

/** Score de uma dimensão neutra — usado nas conferências. */
export const SCORE_NEUTRO_DISC = escoreDoLiquidoDisc(0); // 50

/**
 * Limiar da dimensão secundária (§3.4): abaixo de 50 o perfil é "puro".
 *
 * 50 é o ponto neutro da régua acima: uma segunda dimensão com score < 50 foi
 * REJEITADA no balanço (mais MENOS que MAIS) — descrevê-la como "secundária"
 * diria o oposto do que a pessoa respondeu.
 */
export const LIMIAR_DA_SECUNDARIA_DISC = SCORE_NEUTRO_DISC; // 50

/**
 * Soma esperada dos 4 scores (§3.4) e a tolerância do §3.5.
 *
 * Os líquidos somam 0 por construção (todo MAIS de uma dimensão é MAIS que
 * faltou nas outras), então os scores somam 4 × 50 = 200 — antes do
 * arredondamento. Cada score pode subir ou descer até meio ponto, e o manual
 * aceita ±2 (o exemplo do §3.5 fecha em 201).
 */
export const SOMA_ESPERADA_DOS_SCORES_DISC =
  DIMENSOES_DISC.length * SCORE_NEUTRO_DISC; // 200
export const TOLERANCIA_DA_SOMA_DISC = 2;

// ─── Respostas e validação ─────────────────────────────────────────────────

export type RespostaDisc = {
  blocoId: string;
  /** Id do adjetivo marcado como "MAIS parece comigo". */
  maisId: string;
  /** Id do adjetivo marcado como "MENOS parece comigo". */
  menosId: string;
};

export type ViolacaoDisc = { regra: string; detalhe: string };

/**
 * Valida as 12 respostas antes de pontuar.
 *
 * A regra que o §3.2 manda o formulário garantir — MAIS ≠ MENOS no mesmo bloco
 * — está aqui de novo no servidor. Não é redundância inútil: se MAIS = MENOS, a
 * dimensão ganha +1 e −1 no mesmo bloco, o líquido não muda e o instrumento
 * perde um bloco inteiro sem que nada pareça errado no resultado. Falha
 * silenciosa é pior que exceção.
 */
export function validarRespostasDisc(respostas: RespostaDisc[]): ViolacaoDisc[] {
  const violacoes: ViolacaoDisc[] = [];
  const vistos = new Set<string>();

  for (const resposta of respostas) {
    const bloco = BLOCO_DISC_POR_ID.get(resposta.blocoId);

    if (!bloco) {
      violacoes.push({
        regra: "bloco_desconhecido",
        detalhe: `"${resposta.blocoId}" não é bloco do DISC`,
      });
      continue;
    }

    if (vistos.has(bloco.id))
      violacoes.push({
        regra: "bloco_repetido",
        detalhe: `bloco ${bloco.numero} respondido mais de uma vez`,
      });
    vistos.add(bloco.id);

    const ids = new Set(bloco.adjetivos.map((a) => a.id));

    if (!ids.has(resposta.maisId))
      violacoes.push({
        regra: "adjetivo_fora_do_bloco",
        detalhe: `MAIS "${resposta.maisId}" não pertence ao bloco ${bloco.numero}`,
      });

    if (!ids.has(resposta.menosId))
      violacoes.push({
        regra: "adjetivo_fora_do_bloco",
        detalhe: `MENOS "${resposta.menosId}" não pertence ao bloco ${bloco.numero}`,
      });

    if (resposta.maisId === resposta.menosId)
      violacoes.push({
        regra: "mais_igual_a_menos",
        detalhe: `bloco ${bloco.numero} marcou o mesmo adjetivo como MAIS e MENOS`,
      });
  }

  for (const bloco of BLOCOS_DISC) {
    if (!vistos.has(bloco.id))
      violacoes.push({
        regra: "bloco_sem_resposta",
        detalhe: `bloco ${bloco.numero} (${bloco.id}) não foi respondido`,
      });
  }

  return violacoes;
}

// ─── Forma: qual ordem ESTA pessoa vê ──────────────────────────────────────

export type FormaDisc = {
  semente: string;
  /** Ids dos 12 blocos, na ordem de apresentação. */
  blocos: string[];
  /** Id do bloco → ids dos 4 adjetivos, na ordem de apresentação. */
  adjetivos: Record<string, string[]>;
};

export type BlocoDiscParaCandidato = {
  id: string;
  adjetivos: Array<{ id: string; texto: string }>;
};

/**
 * Sorteia a ordem dos blocos E a ordem dos 4 adjetivos dentro de cada bloco
 * (§3.3: "Embaralhar a ordem dos 4 adjetivos dentro de cada bloco").
 *
 * Embaralhar dentro do bloco não é cosmético: no banco a ordem é sempre
 * D · I · S · C, então uma tela com ordem fixa faria "primeira coluna" virar
 * sinônimo de Dominância — e um candidato que fizesse o teste duas vezes, ou
 * dois candidatos comparando telas, decifrariam o mapeamento.
 *
 * Cada sorteio tem seu próprio namespace de semente (`:disc:blocos`,
 * `:disc:bloco:<id>`) para que a ordem dos blocos e a ordem interna não fiquem
 * correlacionadas entre si nem com as outras baterias da mesma semente.
 */
export function montarFormaDisc(semente: string): FormaDisc {
  const blocos = embaralhar(
    BLOCOS_DISC.map((b) => b.id),
    criarAleatorio(`${semente}:disc:blocos`),
  );

  const adjetivos: Record<string, string[]> = {};
  for (const blocoId of blocos) {
    const bloco = BLOCO_DISC_POR_ID.get(blocoId);
    if (!bloco) continue;
    adjetivos[blocoId] = embaralhar(
      bloco.adjetivos.map((a) => a.id),
      criarAleatorio(`${semente}:disc:bloco:${blocoId}`),
    );
  }

  return { semente, blocos, adjetivos };
}

/**
 * A visão do candidato — id e texto do adjetivo, nada mais. A letra da dimensão
 * fica no servidor (§3.3).
 */
export function blocosParaCandidatoDisc(
  forma: FormaDisc,
): BlocoDiscParaCandidato[] {
  return forma.blocos
    .map((blocoId) => {
      const bloco = BLOCO_DISC_POR_ID.get(blocoId);
      if (!bloco) return null;
      const porId = new Map(bloco.adjetivos.map((a) => [a.id, a]));
      const ordem = forma.adjetivos[blocoId] ?? bloco.adjetivos.map((a) => a.id);

      return {
        id: bloco.id,
        adjetivos: ordem
          .map((id) => porId.get(id))
          .filter((a): a is AdjetivoDisc => Boolean(a))
          .map((a) => ({ id: a.id, texto: a.texto })),
      };
    })
    .filter((b): b is BlocoDiscParaCandidato => Boolean(b));
}

// ─── Resultado ─────────────────────────────────────────────────────────────

export type NotaDisc = {
  dimensao: DimensaoDisc;
  nome: string;
  /** Nº de blocos em que a dimensão foi marcada como MAIS (0 a 12). */
  mais: number;
  /** Nº de blocos em que a dimensão foi marcada como MENOS (0 a 12). */
  menos: number;
  /** `mais − menos` (−12 a +12). */
  liquido: number;
  score: number;
};

export type TipoDePerfilDisc = "puro" | "composto" | "equilibrado";

export type PerfilDisc = {
  dominante: DimensaoDisc;
  /** `null` quando o perfil é puro (§3.4). */
  secundaria: DimensaoDisc | null;
  tipo: TipoDePerfilDisc;
  /** "D" · "D/I" · "D/I equilibrado". */
  rotulo: string;
};

/** Verificação de consistência que o §3.4 manda o dev validar. */
export type ConferenciaDisc = {
  somaMais: number;
  somaMenos: number;
  somaLiquidos: number;
  somaScores: number;
  ok: boolean;
};

/**
 * A saída rica da apuração — tudo que a conferência do §3.4 precisa. Para o que
 * é GRAVADO, ver `paraResultadoDeModuloDisc` no fim do arquivo.
 */
export type ApuracaoDisc = {
  /** Discriminante do enum `Teste` de `baterias.ts`. */
  teste: "DISC";
  /** Ordem canônica D, I, S, C. */
  notas: NotaDisc[];
  porDimensao: Record<DimensaoDisc, number>;
  perfil: PerfilDisc;
  conferencia: ConferenciaDisc;
};

/**
 * Classificação do perfil (§3.4):
 *
 *   dominante  = dimensão de maior score
 *   secundária = segunda maior, SE score ≥ 50; senão o perfil é "puro"
 *   empate na dominante → desempata pelo maior nº de "MAIS";
 *   persistindo o empate → perfil composto "X/Y equilibrado"
 *
 * Sobre o desempate por MAIS: score empatado significa LÍQUIDO empatado (o score
 * é função só do líquido). Quem chegou ao mesmo líquido com mais escolhas
 * positivas foi de fato mais escolhido, e é o critério certo de desempate.
 *
 * Terceiro critério, não previsto no manual: a ordem canônica D, I, S, C. Serve
 * só para o resultado não depender da ordem em que as respostas chegaram — sem
 * ele, o mesmo candidato poderia receber "D/I equilibrado" ou "I/D equilibrado"
 * conforme o percurso do array.
 */
function classificarPerfilDisc(notas: NotaDisc[]): PerfilDisc {
  const posicaoCanonica = new Map(DIMENSOES_DISC.map((d, i) => [d, i]));

  const ordenadas = [...notas].sort(
    (a, b) =>
      b.score - a.score ||
      b.mais - a.mais ||
      (posicaoCanonica.get(a.dimensao) ?? 0) -
        (posicaoCanonica.get(b.dimensao) ?? 0),
  );

  const [primeira, segunda] = ordenadas;

  if (primeira.score === segunda.score && primeira.mais === segunda.mais)
    return {
      dominante: primeira.dimensao,
      secundaria: segunda.dimensao,
      tipo: "equilibrado",
      rotulo: `${primeira.dimensao}/${segunda.dimensao} equilibrado`,
    };

  if (segunda.score >= LIMIAR_DA_SECUNDARIA_DISC)
    return {
      dominante: primeira.dimensao,
      secundaria: segunda.dimensao,
      tipo: "composto",
      rotulo: `${primeira.dimensao}/${segunda.dimensao}`,
    };

  return {
    dominante: primeira.dimensao,
    secundaria: null,
    tipo: "puro",
    rotulo: primeira.dimensao,
  };
}

/**
 * Aplica as equações do §3.4 sobre as 12 respostas.
 *
 * Exige a prova completa e válida: lança se `validarRespostasDisc` acusar
 * qualquer violação. Num instrumento ipsativo um bloco faltando não "diminui a
 * precisão", ele desequilibra a soma — os líquidos deixam de fechar em zero e a
 * comparação entre as quatro dimensões passa a ser entre réguas diferentes.
 */
export function pontuarDisc(respostas: RespostaDisc[]): ApuracaoDisc {
  const violacoes = validarRespostasDisc(respostas);
  if (violacoes.length > 0)
    throw new Error(
      `respostas do DISC inválidas: ${violacoes
        .map((v) => `${v.regra} (${v.detalhe})`)
        .join("; ")}`,
    );

  const mais = Object.fromEntries(DIMENSOES_DISC.map((d) => [d, 0])) as Record<
    DimensaoDisc,
    number
  >;
  const menos = Object.fromEntries(DIMENSOES_DISC.map((d) => [d, 0])) as Record<
    DimensaoDisc,
    number
  >;

  for (const resposta of respostas) {
    const bloco = BLOCO_DISC_POR_ID.get(resposta.blocoId);
    if (!bloco) continue; // inalcançável: a validação já barrou
    const porId = new Map(bloco.adjetivos.map((a) => [a.id, a]));

    const escolhaMais = porId.get(resposta.maisId);
    const escolhaMenos = porId.get(resposta.menosId);
    if (escolhaMais) mais[escolhaMais.dimensao] += 1;
    if (escolhaMenos) menos[escolhaMenos.dimensao] += 1;
  }

  const notas: NotaDisc[] = DIMENSOES_DISC.map((dimensao) => {
    const liquido = mais[dimensao] - menos[dimensao];
    return {
      dimensao,
      nome: NOMES_DE_DISC[dimensao].nome,
      mais: mais[dimensao],
      menos: menos[dimensao],
      liquido,
      score: escoreDoLiquidoDisc(liquido),
    };
  });

  const somaMais = notas.reduce((s, n) => s + n.mais, 0);
  const somaMenos = notas.reduce((s, n) => s + n.menos, 0);
  const somaLiquidos = notas.reduce((s, n) => s + n.liquido, 0);
  const somaScores = notas.reduce((s, n) => s + n.score, 0);

  const conferencia: ConferenciaDisc = {
    somaMais,
    somaMenos,
    somaLiquidos,
    somaScores,
    ok:
      somaMais === TOTAL_DE_BLOCOS_DISC &&
      somaMenos === TOTAL_DE_BLOCOS_DISC &&
      somaLiquidos === 0 &&
      Math.abs(somaScores - SOMA_ESPERADA_DOS_SCORES_DISC) <=
        TOLERANCIA_DA_SOMA_DISC,
  };

  const porDimensao = Object.fromEntries(
    notas.map((n) => [n.dimensao, n.score]),
  ) as Record<DimensaoDisc, number>;

  return {
    teste: "DISC",
    notas,
    porDimensao,
    perfil: classificarPerfilDisc(notas),
    conferencia,
  };
}

// ─── Interpretação (§3.6) ──────────────────────────────────────────────────

/**
 * Tabela de leitura do §3.6. Dado, não texto pronto de relatório — e vale a
 * ressalva do manual: DISC descreve ESTILO, não competência nem caráter.
 */
export const INTERPRETACAO_DISC: Record<
  DimensaoDisc,
  { resumo: string; fortes: string[]; atencao: string[] }
> = {
  D: {
    resumo: "Orientado a resultados e desafios",
    fortes: [
      "Decisão rápida",
      "Iniciativa",
      "Foco em meta",
      "Assume responsabilidade",
    ],
    atencao: ["Impaciência", "Pouca escuta", "Pode atropelar processos"],
  },
  I: {
    resumo: "Orientado a pessoas e influência",
    fortes: ["Comunicação", "Entusiasmo", "Networking", "Vende ideias"],
    atencao: ["Dispersão", "Otimismo excessivo", "Pouco foco em detalhe"],
  },
  S: {
    resumo: "Orientado a estabilidade e cooperação",
    fortes: ["Consistência", "Lealdade", "Trabalho em equipe", "Escuta"],
    atencao: [
      "Resistência a mudança",
      "Evita conflito",
      "Dificuldade de dizer não",
    ],
  },
  C: {
    resumo: "Orientado a precisão e processos",
    fortes: ["Qualidade", "Análise", "Disciplina", "Cumprimento de normas"],
    atencao: ["Perfeccionismo", "Lentidão na decisão", "Crítica excessiva"],
  },
};

/**
 * Os três perfis combinados que o §3.6 descreve com texto próprio. Os demais
 * pares são compostos pela regra do manual ("descrever pela junção: a dimensão
 * secundária tempera a dominante"), o que é trabalho da camada de relatório —
 * este módulo só entrega o que o manual fixou.
 */
export const PERFIS_COMBINADOS_DISC: Record<string, string> = {
  "D/I": "Conquista resultados através de pessoas",
  "S/C": "Executor confiável e preciso",
  "I/S": "Comunicador que mantém o clima da equipe",
};

// ─── Ponte para o resultado gravado (`baterias.ts`) ────────────────────────

/**
 * Reduz a apuração ao `ResultadoDisc` de `baterias.ts`, que é o que vai para
 * `Assessment.moduleResults`.
 *
 * Os líquidos vão junto com os scores de propósito: são o dado CRU do §3.4, do
 * qual o score é derivado. Guardando os dois, uma eventual correção da régua de
 * conversão pode ser reprocessada sem pedir ao candidato que refaça a prova.
 *
 * O que fica de fora é o que só serve para conferir na hora (contagens de MAIS
 * e MENOS, conferência de consistência): já foram verificados em `pontuarDisc`,
 * e gravá-los seria guardar o rascunho junto com a resposta.
 */
export function paraResultadoDeModuloDisc(
  apuracao: ApuracaoDisc,
): ResultadoDiscDeModulo {
  const liquidos = Object.fromEntries(
    apuracao.notas.map((n) => [n.dimensao, n.liquido]),
  ) as Record<DimensaoDisc, number>;

  return {
    teste: "DISC",
    dimensoes: apuracao.porDimensao,
    liquidos,
    dominante: apuracao.perfil.dominante,
    secundaria: apuracao.perfil.secundaria,
    rotulo: apuracao.perfil.rotulo,
  };
}
