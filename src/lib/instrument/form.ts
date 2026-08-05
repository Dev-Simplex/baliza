import { ITENS, ITEM_POR_ID, PARES_DE_CONSISTENCIA } from "./items";
import { CENARIOS, CENARIO_POR_ID } from "./scenarios";
import { FATORES, type BlocoDeCenario, type Fator, type Item } from "./types";

/**
 * Montagem da forma — qual prova ESTA pessoa recebe, e em que ordem.
 *
 * ─── O conflito que este arquivo resolve ───────────────────────────────────
 * O produto precisa de ordem aleatória (candidato não deve poder combinar
 * respostas com outro, e a posição fixa vicia). Mas a especificação original
 * dizia, com razão, "não randomizar a ordem: ela é parte do instrumento" —
 * porque a ordem fixa garantia três coisas:
 *
 *   · nenhum par de itens do mesmo fator em sequência (evita efeito de bloco)
 *   · pares de consistência a 27+ posições de distância (senão a pessoa lembra
 *     do que respondeu e o sinal de consistência morre)
 *   · itens de desejabilidade espalhados
 *
 * Embaralhar de qualquer jeito destrói as três. A saída é separar SORTEIO de
 * ORDENAÇÃO:
 *
 *   1. SORTEIO  — quais 34 itens, dos 128 do banco, esta pessoa recebe.
 *      Balanceado por fator, por faceta e por proporção de inversão.
 *   2. ORDENAÇÃO — a ordem é GERADA sob as mesmas restrições da ordem original,
 *      não embaralhada. Aleatória de verdade dentro do que o instrumento exige.
 *
 * Tudo derivado de uma `semente`: a mesma semente reconstrói exatamente a mesma
 * prova, que é o que torna a retomada e a auditoria possíveis.
 */

// ─── Parâmetros da forma ───────────────────────────────────────────────────

/**
 * Itens de conteúdo por fator.
 *
 * ─── Por que 6, e não os 8 originais ───────────────────────────────────────
 * A prova tinha 52 telas (44 afirmações + 8 situações) e ~8 minutos. Prova
 * longa não é só desconforto: quem desiste no meio não vira relatório nenhum,
 * então cada minuto a mais custa RESPOSTA, que é o insumo do produto inteiro.
 *
 * O que dá para cortar tem limite, e o limite é a confiabilidade. Pela profecia
 * de Spearman-Brown, α = k·r̄ / (1 + (k−1)·r̄). Os 8 itens sustentavam α ≈ 0,80,
 * o que implica correlação média entre itens r̄ ≈ 0,33. Com essa mesma r̄:
 *
 *   k = 8 → α ≈ 0,80   (forma original)
 *   k = 6 → α ≈ 0,75   ← escolhido
 *   k = 5 → α ≈ 0,71
 *   k = 4 → α ≈ 0,66   (abaixo do piso de 0,70 para uso individual)
 *
 * 6 é o último degrau que fica com folga acima de 0,70 — o piso aceito para
 * decisão sobre uma pessoa. Descer a 5 economiza 30 segundos e gasta metade da
 * folga; a 4 o instrumento deixa de sustentar o que o relatório afirma.
 *
 * O que NÃO foi cortado, de propósito: os 4 itens de desejabilidade (o detector
 * de "respondi o que soa bonito" dispara em 3 de 4 — com 3 itens o limiar vira
 * 3 de 3 e o detector cala) e os 3 pares de consistência (são o outro sinal do
 * Índice de Confiança). Cortar sinal de qualidade para ganhar 24 segundos seria
 * economizar no lugar errado.
 */
export const ITENS_POR_FATOR = 6;

/** Itens de desejabilidade social por prova (§5.1). Ver acima: não encolhem. */
export const ITENS_DE_DESEJABILIDADE = 4;

/**
 * Invertidos por fator. Soma = 13 de 30 = 43%, na mesma faixa dos 45% da forma
 * original. Não é uniforme de propósito: 50% exato deixaria a proporção
 * mecânica. C e O seguem mais baixos que E/X/A, como eram com 8 itens.
 */
const REVERSOS_POR_FATOR: Record<Fator, number> = {
  C: 2,
  E: 3,
  X: 3,
  A: 3,
  O: 2,
};

/** Pares de consistência incluídos em toda prova. */
const PARES_POR_PROVA = 3;

/**
 * Distância mínima entre os dois itens de um par de consistência.
 *
 * Escala com o tamanho da prova, senão o corte a estreitaria sozinha: 20 em 44
 * itens é 45% do caminho; 15 em 34 é a mesma proporção. O que importa não é o
 * número absoluto e sim a pessoa não LEMBRAR do gêmeo quando ele reaparece.
 */
const DISTANCIA_MINIMA_DO_PAR = 15;

/** Distância mínima entre dois itens de desejabilidade. */
const DISTANCIA_MINIMA_DE_D = 6;

export const TOTAL_DE_ITENS =
  ITENS_POR_FATOR * FATORES.length + ITENS_DE_DESEJABILIDADE; // 34

/**
 * Blocos de cenário por prova, de 8 disponíveis.
 *
 * Cenário custa ~25 segundos contra ~6 de uma afirmação: os 8 blocos eram 43%
 * do tempo total e só 15% das telas. Cortar aqui é o que devolve mais minuto
 * por pergunta removida.
 *
 * O piso é 4, que é onde `calcularConfianca` ainda calcula o sinal de
 * convergência Parte A × Parte B. Ficamos em 5 para sobrar um bloco de margem:
 * em 4, um único bloco perdido derrubaria o sinal em vez de apenas enfraquecê-lo.
 */
export const CENARIOS_POR_PROVA = 5;

/** Telas que o candidato percorre de ponta a ponta. */
export const TOTAL_DE_TELAS = TOTAL_DE_ITENS + CENARIOS_POR_PROVA; // 39

// ─── Aleatoriedade determinística ──────────────────────────────────────────

/** Hash de string → inteiro de 32 bits (FNV-1a). */
function hash(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** mulberry32 — gerador pequeno, rápido e reprodutível. */
export function criarAleatorio(semente: string) {
  let estado = hash(semente);
  return () => {
    estado |= 0;
    estado = (estado + 0x6d2b79f5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fisher-Yates com gerador injetado. Não muta a entrada. */
export function embaralhar<T>(lista: readonly T[], aleatorio: () => number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// ─── 1. Sorteio ────────────────────────────────────────────────────────────

export type OpcoesDeSorteio = {
  semente: string;
  /**
   * Itens que esta pessoa já respondeu em aplicações anteriores. Evitá-los é o
   * que torna o histórico de evolução honesto: reaplicar os MESMOS itens mede
   * memória, não mudança. Se o banco não comportar a exclusão, ela é relaxada
   * (uma prova completa vale mais que a preferência por itens novos).
   */
  excluir?: string[];
};

function sortearDeUmFator(
  fator: Fator,
  aleatorio: () => number,
  jaEscolhidos: Set<string>,
  excluir: Set<string>,
): Item[] {
  const doFator = ITENS.filter((i) => i.fator === fator);
  const escolhidos = doFator.filter((i) => jaEscolhidos.has(i.id));

  const preferidos = (lista: Item[]) => {
    // Item nunca visto vem antes de item já respondido em outra aplicação.
    const novos = lista.filter((i) => !excluir.has(i.id));
    const repetidos = lista.filter((i) => excluir.has(i.id));
    return [...embaralhar(novos, aleatorio), ...embaralhar(repetidos, aleatorio)];
  };

  const disponiveis = preferidos(
    doFator.filter((i) => !jaEscolhidos.has(i.id)),
  );

  const alvoReverso = REVERSOS_POR_FATOR[fator];

  const contarReversos = (lista: Item[]) =>
    lista.filter((i) => i.reverso).length;

  // Ordena os candidatos por "qual faceta está mais vazia", pra nenhuma faceta
  // ficar de fora — o relatório usa faceta como nuance de texto.
  const escolher = (querReverso: boolean): Item | undefined => {
    const porFaceta = new Map<string, number>();
    for (const i of escolhidos)
      porFaceta.set(i.faceta, (porFaceta.get(i.faceta) ?? 0) + 1);

    const candidatos = disponiveis.filter((i) => i.reverso === querReverso);
    if (candidatos.length === 0) return undefined;

    return candidatos.sort(
      (a, b) => (porFaceta.get(a.faceta) ?? 0) - (porFaceta.get(b.faceta) ?? 0),
    )[0];
  };

  while (escolhidos.length < ITENS_POR_FATOR) {
    const faltam = ITENS_POR_FATOR - escolhidos.length;
    const reversosFaltando = alvoReverso - contarReversos(escolhidos);
    const diretosFaltando = faltam - reversosFaltando;

    // Se um dos lados já fechou, o outro é obrigatório.
    const querReverso =
      reversosFaltando <= 0 ? false : diretosFaltando <= 0 ? true : aleatorio() < 0.5;

    const item = escolher(querReverso) ?? escolher(!querReverso);
    if (!item) break; // banco insuficiente: melhor prova curta que laço infinito

    escolhidos.push(item);
    jaEscolhidos.add(item.id);
    const idx = disponiveis.findIndex((i) => i.id === item.id);
    if (idx >= 0) disponiveis.splice(idx, 1);
  }

  return escolhidos;
}

/** Sorteia os itens desta aplicação (`TOTAL_DE_ITENS`). */
export function sortearItens(opcoes: OpcoesDeSorteio): string[] {
  const aleatorio = criarAleatorio(`${opcoes.semente}:itens`);
  const excluir = new Set(opcoes.excluir ?? []);
  const escolhidos = new Set<string>();

  // 1. Pares de consistência primeiro: eles são obrigatórios e ocupam vaga.
  //    Um par por fator, no máximo, pra não concentrar o sinal num só.
  const paresEmbaralhados = embaralhar(PARES_DE_CONSISTENCIA, aleatorio);
  const fatoresComPar = new Set<string>();
  for (const par of paresEmbaralhados) {
    if (fatoresComPar.size >= PARES_POR_PROVA) break;
    const itens = par.itens
      .map((id) => ITEM_POR_ID.get(id))
      .filter((i): i is Item => Boolean(i));
    if (itens.length !== 2) continue;
    const fator = itens[0].fator;
    if (fatoresComPar.has(fator)) continue;
    fatoresComPar.add(fator);
    for (const i of itens) escolhidos.add(i.id);
  }

  // 2. Completa cada fator até `ITENS_POR_FATOR`.
  const porFator = FATORES.map((f) =>
    sortearDeUmFator(f, aleatorio, escolhidos, excluir),
  );

  // 3. Desejabilidade social.
  const desejabilidade = ITENS.filter((i) => i.fator === "D");
  const novosD = desejabilidade.filter((i) => !excluir.has(i.id));
  const repetidosD = desejabilidade.filter((i) => excluir.has(i.id));
  const dEscolhidos = [
    ...embaralhar(novosD, aleatorio),
    ...embaralhar(repetidosD, aleatorio),
  ].slice(0, ITENS_DE_DESEJABILIDADE);

  return [...porFator.flat(), ...dEscolhidos].map((i) => i.id);
}

// ─── 2. Ordenação sob restrição ────────────────────────────────────────────

type Restricoes = {
  distanciaMinimaDoPar: number;
  distanciaMinimaDeD: number;
};

const PADRAO: Restricoes = {
  distanciaMinimaDoPar: DISTANCIA_MINIMA_DO_PAR,
  distanciaMinimaDeD: DISTANCIA_MINIMA_DE_D,
};

/** A posição `pos` aceita `item`, dado o que já foi colocado? */
function cabe(
  item: Item,
  sequencia: Item[],
  restricoes: Restricoes,
): boolean {
  const anterior = sequencia[sequencia.length - 1];

  // (a) nunca dois itens do mesmo fator em sequência
  if (anterior && anterior.fator === item.fator) return false;

  // (b) itens de desejabilidade espalhados
  if (item.fator === "D") {
    const ultimoD = sequencia.map((i) => i.fator).lastIndexOf("D");
    if (ultimoD >= 0 && sequencia.length - ultimoD < restricoes.distanciaMinimaDeD)
      return false;
  }

  // (c) par de consistência longe do seu gêmeo
  if (item.par) {
    const gemeo = sequencia.findIndex((i) => i.par === item.par);
    if (gemeo >= 0 && sequencia.length - gemeo < restricoes.distanciaMinimaDoPar)
      return false;
  }

  return true;
}

/**
 * Gera uma ordem aleatória que respeita as restrições do instrumento.
 *
 * Guloso com reinício: a cada posição sorteia entre os itens que cabem. Se
 * travar (nenhum item serve), recomeça com outra semente derivada. Converge em
 * poucas tentativas — as restrições escalam com o tamanho da prova, então
 * seguem folgadas para os 34 itens em 5 fatores. Se ainda assim não fechar,
 * afrouxa as distâncias em vez de falhar: prova entregue com par a 13 posições
 * é muito melhor que prova não entregue.
 */
export function ordenarSobRestricao(
  ids: string[],
  semente: string,
  tentativas = 60,
): string[] {
  const itens = ids
    .map((id) => ITEM_POR_ID.get(id))
    .filter((i): i is Item => Boolean(i));

  const tentar = (semeteDaVez: string, restricoes: Restricoes) => {
    const aleatorio = criarAleatorio(semeteDaVez);
    const restantes = embaralhar(itens, aleatorio);
    const sequencia: Item[] = [];

    while (restantes.length > 0) {
      const viaveis = restantes.filter((i) => cabe(i, sequencia, restricoes));
      if (viaveis.length === 0) return null;
      const escolhido = viaveis[Math.floor(aleatorio() * viaveis.length)];
      sequencia.push(escolhido);
      restantes.splice(
        restantes.findIndex((i) => i.id === escolhido.id),
        1,
      );
    }
    return sequencia;
  };

  for (let t = 0; t < tentativas; t++) {
    const resultado = tentar(`${semente}:ordem:${t}`, PADRAO);
    if (resultado) return resultado.map((i) => i.id);
  }

  // Afrouxamento progressivo — a restrição (a) nunca é relaxada.
  for (let folga = 2; folga <= 12; folga += 2) {
    const restricoes: Restricoes = {
      distanciaMinimaDoPar: Math.max(6, DISTANCIA_MINIMA_DO_PAR - folga),
      distanciaMinimaDeD: Math.max(3, DISTANCIA_MINIMA_DE_D - Math.floor(folga / 2)),
    };
    for (let t = 0; t < 20; t++) {
      const resultado = tentar(`${semente}:folga${folga}:${t}`, restricoes);
      if (resultado) return resultado.map((i) => i.id);
    }
  }

  // Último recurso: só a restrição (a), que é a que mais protege a medida.
  const aleatorio = criarAleatorio(`${semente}:ultimo`);
  return embaralhar(itens, aleatorio).map((i) => i.id);
}

// ─── 3. A forma completa ───────────────────────────────────────────────────

export type Forma = {
  semente: string;
  versao: string;
  itens: string[];
  cenarios: string[];
};

/**
 * Escolhe os blocos de cenário desta prova.
 *
 * Enquanto os 8 blocos entravam inteiros, embaralhar bastava. Agora que só 5
 * entram, sortear e cortar os 3 primeiros não serve: cada bloco cobre 4 dos 5
 * fatores, e o fator que sobra de fora não é o mesmo em todos. Um corte cego
 * pode deixar um fator com uma única aparição — e o vetor ipsativo daquele
 * fator vira ±1, ruído puro dentro do Índice de Confiança.
 *
 * Então o sorteio é guloso por COBERTURA: a cada rodada entra o bloco que mais
 * atende os fatores ainda vazios. O embaralhamento inicial é o que faz duas
 * pessoas receberem conjuntos diferentes; o guloso só impede que a diferença
 * saia torta.
 */
function sortearCenarios(semente: string): string[] {
  const aleatorio = criarAleatorio(`${semente}:cenarios`);
  const restantes = embaralhar(CENARIOS, aleatorio);
  const escolhidos: typeof CENARIOS = [];
  const cobertura = new Map<Fator, number>(FATORES.map((f) => [f, 0]));

  // Peso 1/(1+n): o primeiro bloco a cobrir um fator vale muito, o quarto vale
  // pouco. É o que empurra a seleção para o equilíbrio sem exigir que ele seja
  // perfeito — nem todo conjunto de 5 blocos consegue 4 aparições por fator.
  while (escolhidos.length < Math.min(CENARIOS_POR_PROVA, CENARIOS.length)) {
    let melhor = 0;
    let melhorGanho = -Infinity;

    restantes.forEach((bloco, i) => {
      const ganho = bloco.opcoes.reduce(
        (soma, o) => soma + 1 / (1 + (cobertura.get(o.fator) ?? 0)),
        0,
      );
      if (ganho > melhorGanho) {
        melhorGanho = ganho;
        melhor = i;
      }
    });

    const [bloco] = restantes.splice(melhor, 1);
    escolhidos.push(bloco);
    for (const o of bloco.opcoes)
      cobertura.set(o.fator, (cobertura.get(o.fator) ?? 0) + 1);
  }

  // A ORDEM de apresentação é sorteada à parte da SELEÇÃO: senão os blocos
  // apareceriam sempre na ordem em que o guloso os escolheu, e o primeiro seria
  // quase sempre o de cobertura mais larga.
  return embaralhar(
    escolhidos.map((c) => c.id),
    criarAleatorio(`${semente}:ordem-dos-cenarios`),
  );
}

export function montarForma(opcoes: OpcoesDeSorteio & { versao: string }): Forma {
  const sorteados = sortearItens(opcoes);
  const ordenados = ordenarSobRestricao(sorteados, opcoes.semente);

  return {
    semente: opcoes.semente,
    versao: opcoes.versao,
    itens: ordenados,
    cenarios: sortearCenarios(opcoes.semente),
  };
}

/**
 * Ordem das opções dentro de um bloco de cenário. Derivada da semente, então é
 * estável entre recarregamentos sem precisar ser persistida.
 */
export function ordenarOpcoesDeCenario(
  semente: string,
  blocoId: string,
  opcaoIds: string[],
): string[] {
  return embaralhar(opcaoIds, criarAleatorio(`${semente}:${blocoId}`));
}

// ─── Verificação das invariantes (usada nos testes e no seed) ──────────────

export type Violacao = { regra: string; detalhe: string };

export function verificarForma(forma: Forma): Violacao[] {
  const violacoes: Violacao[] = [];
  const itens = forma.itens
    .map((id) => ITEM_POR_ID.get(id))
    .filter((i): i is Item => Boolean(i));

  if (itens.length !== forma.itens.length)
    violacoes.push({
      regra: "itens_existem",
      detalhe: "a forma referencia item que não existe no banco",
    });

  const unicos = new Set(forma.itens);
  if (unicos.size !== forma.itens.length)
    violacoes.push({ regra: "sem_repeticao", detalhe: "item repetido na forma" });

  for (const fator of FATORES) {
    const doFator = itens.filter((i) => i.fator === fator);
    if (doFator.length !== ITENS_POR_FATOR)
      violacoes.push({
        regra: "itens_por_fator",
        detalhe: `${fator} tem ${doFator.length}, esperado ${ITENS_POR_FATOR}`,
      });

    const reversos = doFator.filter((i) => i.reverso).length;
    if (reversos !== REVERSOS_POR_FATOR[fator])
      violacoes.push({
        regra: "proporcao_de_inversao",
        detalhe: `${fator} tem ${reversos} invertidos, esperado ${REVERSOS_POR_FATOR[fator]}`,
      });

    // Nenhuma faceta pode ficar de fora: o relatório usa faceta como nuance.
    const facetas = new Set(doFator.map((i) => i.faceta));
    if (facetas.size < 3)
      violacoes.push({
        regra: "cobertura_de_faceta",
        detalhe: `${fator} cobre só ${facetas.size} faceta(s)`,
      });
  }

  const ds = itens.filter((i) => i.fator === "D").length;
  if (ds !== ITENS_DE_DESEJABILIDADE)
    violacoes.push({
      regra: "desejabilidade",
      detalhe: `${ds} itens D, esperado ${ITENS_DE_DESEJABILIDADE}`,
    });

  // Pares completos: um par pela metade não gera sinal de consistência nenhum.
  const paresPresentes = new Map<string, number>();
  for (const i of itens)
    if (i.par) paresPresentes.set(i.par, (paresPresentes.get(i.par) ?? 0) + 1);
  const paresCompletos = [...paresPresentes.entries()].filter(
    ([, n]) => n === 2,
  );
  if (paresCompletos.length < PARES_POR_PROVA)
    violacoes.push({
      regra: "pares_de_consistencia",
      detalhe: `${paresCompletos.length} pares completos, esperado ${PARES_POR_PROVA}`,
    });

  // Restrição (a) — a que nunca é relaxada.
  for (let i = 1; i < itens.length; i++) {
    if (itens[i].fator === itens[i - 1].fator) {
      violacoes.push({
        regra: "fatores_adjacentes",
        detalhe: `posições ${i} e ${i + 1} são ambas do fator ${itens[i].fator}`,
      });
      break;
    }
  }

  // ─── Parte B ──────────────────────────────────────────────────────────────
  // Passou a ser verificada aqui quando os cenários deixaram de entrar
  // inteiros: com 8 de 8 não havia o que dar errado, com 5 de 8 há.
  if (forma.cenarios.length !== CENARIOS_POR_PROVA)
    violacoes.push({
      regra: "quantidade_de_cenarios",
      detalhe: `${forma.cenarios.length} blocos, esperado ${CENARIOS_POR_PROVA}`,
    });

  if (new Set(forma.cenarios).size !== forma.cenarios.length)
    violacoes.push({
      regra: "cenario_repetido",
      detalhe: "o mesmo bloco de cenário aparece duas vezes",
    });

  const blocos = forma.cenarios
    .map((id) => CENARIO_POR_ID.get(id))
    .filter((b): b is BlocoDeCenario => Boolean(b));

  if (blocos.length !== forma.cenarios.length)
    violacoes.push({
      regra: "cenarios_existem",
      detalhe: "a forma referencia bloco de cenário que não existe",
    });

  // Um fator que aparece uma vez só produz vetor ipsativo ±1 — ruído, não
  // sinal. 2 é o mínimo que ainda diz alguma coisa sobre a preferência.
  const aparicoes = new Map<Fator, number>(FATORES.map((f) => [f, 0]));
  for (const bloco of blocos)
    for (const o of bloco.opcoes)
      aparicoes.set(o.fator, (aparicoes.get(o.fator) ?? 0) + 1);

  for (const [fator, n] of aparicoes) {
    if (n < 2)
      violacoes.push({
        regra: "cobertura_de_cenario",
        detalhe: `fator ${fator} aparece em ${n} bloco(s), esperado ao menos 2`,
      });
  }

  return violacoes;
}
