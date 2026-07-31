import { ARQUETIPOS, ARQUETIPO_POR_ID, LIMIAR_MISTO } from "./archetypes";
import { ITEM_POR_ID } from "./items";
import { CENARIO_POR_ID, ESCORAGEM_DE_CENARIO } from "./scenarios";
import {
  CORTES_QUALITATIVOS,
  FATORES,
  NOMES_DE_FACETA,
  NOMES_DE_FATOR,
  type DimensaoAlvo,
  type Fator,
  type PerfilAlvo,
  type RespostaDeCenario,
  type Respostas,
} from "./types";

/**
 * Motor de escoragem — porte fiel de `docs/scorer_referencia.rb`.
 *
 * Toda constante aqui tem justificativa na especificação. A que mais importa:
 *
 *   DENTRO_DA_FAIXA = 0,35
 *
 * Não pode ser 0: com penalidade zero dentro da faixa, todo candidato acima do
 * piso satura em 100 e o ranking perde resolução justamente no topo — que é o
 * único lugar onde o recrutador olha. Não pode ser 1: aí a faixa não
 * significaria nada. Regressão: o espalhamento entre 1º e 3º nos candidatos
 * simulados tem que ficar em torno de 25 pontos (ver scoring.test.ts).
 */
export const DENTRO_DA_FAIXA = 0.35;

// ─── §4.1 Escore por fator ─────────────────────────────────────────────────

export type Escores = Record<Fator, number>;

/** Aplica a inversão. O banco guarda sempre o valor CRU. */
export function valorDoItem(itemId: string, resposta: number): number {
  const item = ITEM_POR_ID.get(itemId);
  if (!item) return resposta;
  return item.reverso ? 6 - resposta : resposta;
}

/**
 * Média (não soma) dos itens do fator, normalizada para 0-100.
 * Média mantém o escore válido mesmo se um item for descartado no futuro.
 */
export function calcularEscores(
  respostas: Respostas,
  itensDaForma: string[],
): Escores {
  const escores = {} as Escores;

  for (const fator of FATORES) {
    const doFator = itensDaForma.filter(
      (id) => ITEM_POR_ID.get(id)?.fator === fator,
    );
    const valores = doFator
      .filter((id) => respostas[id] != null)
      .map((id) => valorDoItem(id, respostas[id]));

    if (valores.length === 0) {
      escores[fator] = 50; // neutro; só acontece em avaliação incompleta
      continue;
    }

    const media = valores.reduce((a, b) => a + b, 0) / valores.length;
    escores[fator] = Math.round(((media - 1) / 4) * 100 * 10) / 10;
  }

  return escores;
}

export function faixaQualitativa(escore: number) {
  return (
    CORTES_QUALITATIVOS.find((c) => escore >= c.min && escore < c.max) ??
    CORTES_QUALITATIVOS[CORTES_QUALITATIVOS.length - 1]
  );
}

// ─── §4.2 Facetas — nuance qualitativa, NUNCA número ───────────────────────

export type NotaDeFaceta = {
  faceta: string;
  nome: string;
  fator: Fator;
  /** Posição relativa DENTRO da pessoa. Nunca comparável entre pessoas. */
  tendencia: "acima" | "media" | "abaixo";
  texto: string;
};

/**
 * Faceta tem 2-3 itens na prova: a confiabilidade é fraca por construção.
 * Por isso ela sai daqui como TEXTO, e a regra do §4.2 é dura — faceta nunca
 * vira número, nunca entra em gráfico, nunca entra no ranking. Prometer
 * precisão de faceta com 2 itens é o tipo de mentira que derruba a
 * credibilidade do produto na primeira leitura de alguém com formação.
 */
export function notasDeFaceta(
  respostas: Respostas,
  itensDaForma: string[],
): NotaDeFaceta[] {
  const notas: NotaDeFaceta[] = [];

  for (const fator of FATORES) {
    const doFator = itensDaForma.filter(
      (id) => ITEM_POR_ID.get(id)?.fator === fator,
    );

    const porFaceta = new Map<string, number[]>();
    for (const id of doFator) {
      const item = ITEM_POR_ID.get(id);
      if (!item || respostas[id] == null) continue;
      porFaceta.set(item.faceta, [
        ...(porFaceta.get(item.faceta) ?? []),
        valorDoItem(id, respostas[id]),
      ]);
    }

    const medias = [...porFaceta.entries()].map(([faceta, valores]) => ({
      faceta,
      media: valores.reduce((a, b) => a + b, 0) / valores.length,
    }));
    if (medias.length < 2) continue;

    const mediaDoFator =
      medias.reduce((a, b) => a + b.media, 0) / medias.length;

    for (const { faceta, media } of medias) {
      const delta = media - mediaDoFator;
      const tendencia =
        delta > 0.45 ? "acima" : delta < -0.45 ? "abaixo" : "media";
      if (tendencia === "media") continue;

      const nomeFaceta = NOMES_DE_FACETA[faceta] ?? faceta;
      const nomeFator = NOMES_DE_FATOR[fator].ui;
      notas.push({
        faceta,
        nome: nomeFaceta,
        fator,
        tendencia,
        texto:
          tendencia === "acima"
            ? `Dentro de ${nomeFator}, ${nomeFaceta.toLowerCase()} é o lado mais forte.`
            : `Dentro de ${nomeFator}, ${nomeFaceta.toLowerCase()} é o lado mais fraco.`,
      });
    }
  }

  return notas;
}

// ─── §5 Índice de Confiança ────────────────────────────────────────────────

export type SinalDeConfianca =
  | "desejabilidade"
  | "inconsistencia"
  | "linha_reta"
  | "velocidade"
  | "convergencia";

export type Confianca = {
  selo: "alta" | "media" | "baixa";
  rotulo: string;
  emoji: string;
  sinais: SinalDeConfianca[];
  detalhe: {
    desejabilidade: number;
    inconsistencia: number;
    maiorSequencia: number;
    segundosPorItem: number;
    convergencia: number | null;
  };
  /** Texto exibido ao recrutador. Calibra confiança, nunca acusa a pessoa. */
  texto: string;
};

const TEXTO_DO_SELO: Record<Confianca["selo"], string> = {
  alta: "O padrão de respostas não levantou nenhum sinal de atenção. Trate este perfil como pista sólida — e ainda assim confirme na entrevista.",
  media:
    "Um sinal de atenção apareceu no padrão de respostas. Nada grave, mas vale confirmar na entrevista os pontos que o roteiro sugere.",
  baixa:
    "O padrão de respostas sugere que esta pessoa respondeu pensando em causar boa impressão — algo comum e compreensível num processo seletivo. Trate este perfil como pista fraca e confirme na entrevista.",
};

/** Correlação de postos de Spearman, com tratamento de empates. */
export function spearman(a: number[], b: number[]): number | null {
  if (a.length !== b.length || a.length < 3) return null;

  const postos = (v: number[]) => {
    const ordenado = v
      .map((valor, i) => ({ valor, i }))
      .sort((x, y) => x.valor - y.valor);
    const r = new Array<number>(v.length);
    let i = 0;
    while (i < ordenado.length) {
      let j = i;
      while (j + 1 < ordenado.length && ordenado[j + 1].valor === ordenado[i].valor)
        j++;
      const postoMedio = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) r[ordenado[k].i] = postoMedio;
      i = j + 1;
    }
    return r;
  };

  const ra = postos(a);
  const rb = postos(b);
  const media = (v: number[]) => v.reduce((x, y) => x + y, 0) / v.length;
  const ma = media(ra);
  const mb = media(rb);

  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < ra.length; i++) {
    num += (ra[i] - ma) * (rb[i] - mb);
    da += (ra[i] - ma) ** 2;
    db += (rb[i] - mb) ** 2;
  }
  if (da === 0 || db === 0) return null;
  return num / Math.sqrt(da * db);
}

/** Vetor ipsativo da Parte B: +1 pro que faria primeiro, −1 pro que deixaria por último. */
export function vetorIpsativo(
  respostasDeCenario: RespostaDeCenario[],
): Record<Fator, number> {
  const vetor = { C: 0, E: 0, X: 0, A: 0, O: 0 } as Record<Fator, number>;

  for (const r of respostasDeCenario) {
    const bloco = CENARIO_POR_ID.get(r.blocoId);
    if (!bloco) continue;
    const primeira = bloco.opcoes.find((o) => o.id === r.primeiraId);
    const ultima = bloco.opcoes.find((o) => o.id === r.ultimaId);
    if (primeira) vetor[primeira.fator] += ESCORAGEM_DE_CENARIO.primeiro;
    if (ultima) vetor[ultima.fator] += ESCORAGEM_DE_CENARIO.ultimo;
  }

  return vetor;
}

export function calcularConfianca(opcoes: {
  respostas: Respostas;
  itensDaForma: string[];
  escores: Escores;
  respostasDeCenario?: RespostaDeCenario[];
  segundosPorItem: number;
}): Confianca {
  const { respostas, itensDaForma, escores, segundosPorItem } = opcoes;

  // §5.1 Desejabilidade social
  const itensD = itensDaForma.filter((id) => ITEM_POR_ID.get(id)?.fator === "D");
  const desejabilidade = itensD.filter((id) => (respostas[id] ?? 0) >= 4).length;

  // §5.2 Pares de consistência
  const pares = new Map<string, number[]>();
  for (const id of itensDaForma) {
    const item = ITEM_POR_ID.get(id);
    if (!item?.par || respostas[id] == null) continue;
    pares.set(item.par, [...(pares.get(item.par) ?? []), respostas[id]]);
  }
  const divergencias = [...pares.values()]
    .filter((v) => v.length === 2)
    .map(([a, b]) => Math.abs(a - b));
  const inconsistencia =
    divergencias.length > 0
      ? divergencias.reduce((a, b) => a + b, 0) / divergencias.length
      : 0;

  // §5.3 Resposta em linha reta — na ordem em que a pessoa VIU os itens
  let maiorSequencia = 0;
  let atual = 0;
  let anterior: number | null = null;
  for (const id of itensDaForma) {
    const v = respostas[id];
    if (v == null) continue;
    atual = v === anterior ? atual + 1 : 1;
    anterior = v;
    maiorSequencia = Math.max(maiorSequencia, atual);
  }

  // §5.5 Convergência Parte A × Parte B
  let convergencia: number | null = null;
  if (opcoes.respostasDeCenario && opcoes.respostasDeCenario.length >= 4) {
    const ipsativo = vetorIpsativo(opcoes.respostasDeCenario);
    const mediaDosEscores =
      FATORES.reduce((a, f) => a + escores[f], 0) / FATORES.length;
    // O escore normativo precisa ser centrado na pessoa pra ser comparável a um
    // vetor ipsativo — que, por construção, soma zero.
    const centrado = FATORES.map((f) => escores[f] - mediaDosEscores);
    convergencia = spearman(
      centrado,
      FATORES.map((f) => ipsativo[f]),
    );
  }

  const sinais: SinalDeConfianca[] = [];
  if (desejabilidade >= 3) sinais.push("desejabilidade");
  if (inconsistencia >= 2.0) sinais.push("inconsistencia");
  if (maiorSequencia >= 8) sinais.push("linha_reta");
  if (segundosPorItem > 0 && segundosPorItem < 1.8) sinais.push("velocidade");
  if (
    convergencia !== null &&
    convergencia < ESCORAGEM_DE_CENARIO.limiarDeConvergencia
  )
    sinais.push("convergencia");

  const selo: Confianca["selo"] =
    sinais.length === 0 ? "alta" : sinais.length === 1 ? "media" : "baixa";

  return {
    selo,
    rotulo: selo === "alta" ? "Alta" : selo === "media" ? "Média" : "Baixa",
    emoji: selo === "alta" ? "🟢" : selo === "media" ? "🟡" : "🔴",
    sinais,
    detalhe: {
      desejabilidade,
      inconsistencia: Math.round(inconsistencia * 100) / 100,
      maiorSequencia,
      segundosPorItem: Math.round(segundosPorItem * 10) / 10,
      convergencia:
        convergencia === null ? null : Math.round(convergencia * 100) / 100,
    },
    texto: TEXTO_DO_SELO[selo],
  };
}

// ─── §6 Arquétipo ──────────────────────────────────────────────────────────

export type ResultadoDeArquetipo = {
  id: string;
  nome: string;
  misto: boolean;
  segundoId?: string;
  segundoNome?: string;
  nomeExibido: string;
};

export function atribuirArquetipo(escores: Escores): ResultadoDeArquetipo {
  const distancias = ARQUETIPOS.map((a) => ({
    arquetipo: a,
    distancia: Math.sqrt(
      FATORES.reduce((soma, f) => soma + (escores[f] - a.prototipo[f]) ** 2, 0),
    ),
  })).sort((x, y) => x.distancia - y.distancia);

  const [primeiro, segundo] = distancias;
  const misto = segundo.distancia - primeiro.distancia < LIMIAR_MISTO;

  return {
    id: primeiro.arquetipo.id,
    nome: primeiro.arquetipo.nome,
    misto,
    segundoId: misto ? segundo.arquetipo.id : undefined,
    segundoNome: misto ? segundo.arquetipo.nome : undefined,
    nomeExibido: misto
      ? `${primeiro.arquetipo.nome} / ${segundo.arquetipo.nome}`
      : primeiro.arquetipo.nome,
  };
}

// ─── §4.4 Fit Score ────────────────────────────────────────────────────────

export type ContribuicaoDeFit = {
  fator: Fator;
  nome: string;
  peso: number;
  tipo: DimensaoAlvo["tipo"];
  faixa: [number, number];
  ideal: number;
  escore: number;
  dentro: boolean;
  desvio: number;
  perda: number;
};

export type ResultadoDeFit = {
  score: number;
  puxaramPraCima: ContribuicaoDeFit[];
  puxaramPraBaixo: ContribuicaoDeFit[];
  ignoradas: Fator[];
  contribuicoes: ContribuicaoDeFit[];
};

export function idealDaDimensao(cfg: DimensaoAlvo): number {
  if (cfg.ideal != null) return cfg.ideal;
  const [lo, hi] = cfg.faixa;
  if (cfg.tipo === "maior_melhor") return hi;
  if (cfg.tipo === "menor_melhor") return lo;
  return (lo + hi) / 2;
}

/**
 * Aderência à vaga. NÃO é média: é distância ponderada a um perfil-alvo, e cada
 * dimensão tem um tipo. Explicabilidade não é opcional (§4.4 e LGPD art. 20) —
 * por isso o retorno sempre carrega o que puxou pra cima e pra baixo.
 */
export function calcularFit(
  escores: Escores,
  perfil: PerfilAlvo,
): ResultadoDeFit {
  const contribuicoes: ContribuicaoDeFit[] = [];
  const ignoradas: Fator[] = [];

  for (const fator of FATORES) {
    const cfg = perfil[fator];
    if (!cfg || cfg.peso === 0) {
      ignoradas.push(fator);
      continue;
    }

    const [lo, hi] = cfg.faixa;
    const escore = escores[fator];
    const ideal = idealDaDimensao(cfg);
    const dentro = escore >= lo && escore <= hi;
    const desvio =
      (Math.abs(escore - ideal) / 100) * (dentro ? DENTRO_DA_FAIXA : 1.0);

    contribuicoes.push({
      fator,
      nome: NOMES_DE_FATOR[fator].ui,
      peso: cfg.peso,
      tipo: cfg.tipo,
      faixa: cfg.faixa,
      ideal,
      escore,
      dentro,
      desvio,
      perda: cfg.peso * desvio,
    });
  }

  const pesoTotal = contribuicoes.reduce((a, c) => a + c.peso, 0);
  const score =
    pesoTotal === 0
      ? 0
      : Math.round(
          (100 -
            (contribuicoes.reduce((a, c) => a + c.perda, 0) / pesoTotal) * 100) *
            10,
        ) / 10;

  const porPerda = [...contribuicoes].sort((a, b) => b.perda - a.perda);

  return {
    score: Math.max(0, Math.min(100, score)),
    puxaramPraBaixo: porPerda
      .filter((c) => !(c.dentro && c.desvio < 0.05))
      .slice(0, 3),
    puxaramPraCima: [...porPerda]
      .reverse()
      .filter((c) => c.dentro && c.peso >= 3)
      .slice(0, 3),
    ignoradas,
    contribuicoes,
  };
}

// ─── Resultado consolidado ─────────────────────────────────────────────────

export type ResultadoCompleto = {
  escores: Escores;
  faixas: Record<Fator, { nome: string; rotulo: string }>;
  facetas: NotaDeFaceta[];
  confianca: Confianca;
  arquetipo: ResultadoDeArquetipo;
  fit: ResultadoDeFit;
};

export function escorar(opcoes: {
  respostas: Respostas;
  itensDaForma: string[];
  perfilAlvo: PerfilAlvo;
  respostasDeCenario?: RespostaDeCenario[];
  duracaoMs?: number;
}): ResultadoCompleto {
  const escores = calcularEscores(opcoes.respostas, opcoes.itensDaForma);
  const respondidos = opcoes.itensDaForma.filter(
    (id) => opcoes.respostas[id] != null,
  ).length;
  const segundosPorItem =
    opcoes.duracaoMs && respondidos > 0
      ? opcoes.duracaoMs / 1000 / respondidos
      : 0;

  const faixas = {} as ResultadoCompleto["faixas"];
  for (const f of FATORES) {
    const faixa = faixaQualitativa(escores[f]);
    faixas[f] = { nome: faixa.nome, rotulo: faixa.rotulo };
  }

  return {
    escores,
    faixas,
    facetas: notasDeFaceta(opcoes.respostas, opcoes.itensDaForma),
    confianca: calcularConfianca({
      respostas: opcoes.respostas,
      itensDaForma: opcoes.itensDaForma,
      escores,
      respostasDeCenario: opcoes.respostasDeCenario,
      segundosPorItem,
    }),
    arquetipo: atribuirArquetipo(escores),
    fit: calcularFit(escores, opcoes.perfilAlvo),
  };
}

export { ARQUETIPO_POR_ID };
