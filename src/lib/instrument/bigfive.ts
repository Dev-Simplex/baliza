import {
  FATORES_BIG_FIVE,
  FATOR_BIG_FIVE_INVERTIDO,
  FATOR_PRUMO_DE_BIG_FIVE,
  type FatorBigFive,
  type ResultadoBigFive as ResultadoBigFiveDeModulo,
} from "./baterias";
import { criarAleatorio, embaralhar } from "./form";
import type { Fator } from "./types";

/**
 * BATERIA 1 — Big Five (Mini-IPIP). Manual §2.
 *
 * ─── O que este arquivo é ───────────────────────────────────────────────────
 * Só DADO e MATEMÁTICA: o banco dos 20 itens, as quatro equações do §2.4 e a
 * montagem da forma (que ordem esta pessoa vê). Nada de tela e nada de banco de
 * dados — quem persiste e quem renderiza são outros módulos.
 *
 * ─── Divisão com `baterias.ts` ──────────────────────────────────────────────
 * `baterias.ts` é o CONTRATO (o vocabulário: quais testes existem, e a forma
 * enxuta do resultado que vai para `Assessment.moduleResults`). Este arquivo é o
 * MOTOR. Por isso as letras de fator vêm de lá — uma definição só — e a saída
 * rica daqui se chama `ApuracaoBigFive`, com `paraResultadoDeModuloBigFive`
 * fazendo a ponte para o tipo gravável. A apuração tem o que a conferência
 * precisa (brutos, faixas, escores internos); o módulo gravado tem só o que o
 * relatório lê.
 *
 * ─── Atenção à colisão de letras ────────────────────────────────────────────
 * O instrumento PRUMO (types.ts) também usa letras de fator, mas NÃO são as
 * mesmas:
 *
 *   PRUMO:     E = Estabilidade Emocional · X = Extroversão
 *   Mini-IPIP: E = Extroversão            · N = Neuroticismo
 *
 * Por isso tudo aqui é nomeado com sufixo `_BIG_FIVE` / `BigFive` e nada é
 * importado de types.ts. Misturar os dois alfabetos silenciosamente trocaria
 * Extroversão por Estabilidade no relatório, que é o pior erro possível.
 *
 * ─── Base legal ─────────────────────────────────────────────────────────────
 * O Mini-IPIP é de domínio público (§1, regra 6). Os 20 textos abaixo são a
 * tradução usada no manual, transcritos item a item da tabela do §2.3.
 */

// ─── Fatores ───────────────────────────────────────────────────────────────

/**
 * Fatores INTERNOS, reexportados de `baterias.ts` para quem só importa este
 * módulo. `N` (Neuroticismo) existe porque é o que o banco de itens mede — mas
 * ele nunca chega a uma tela: vira EE no passo 4 do §2.4.
 */
export { FATORES_BIG_FIVE };
export type { FatorBigFive };

/**
 * Fatores EXIBIDOS. Repare que `N` não está na união: o tipo é a garantia, em
 * tempo de compilação, de que "Neuroticismo" não vaza para a ficha (§2.4).
 */
export type FatorExibidoBigFive = "O" | "C" | "E" | "A" | "EE";

/** Ordem da ficha (§5.1 e §5.2): O, C, E, A, EE. */
export const FATORES_EXIBIDOS_BIG_FIVE: readonly FatorExibidoBigFive[] = [
  "O",
  "C",
  "E",
  "A",
  "EE",
] as const;

/**
 * Rótulos de exibição. A entrada de N simplesmente não existe: a única forma de
 * falar do fator na interface é pela chave EE.
 *
 * O porquê está no §2.4: com a inversão, "mais alto" passa a ter leitura
 * positiva ou neutra em TODOS os cinco fatores, e nenhum rótulo soa pejorativo
 * para o candidato que recebe a devolutiva.
 */
export const ROTULOS_BIG_FIVE: Record<
  FatorExibidoBigFive,
  { rotulo: string; resumo: string }
> = {
  O: {
    rotulo: "Abertura",
    resumo: "Curiosidade, imaginação, interesse por ideias novas",
  },
  C: {
    rotulo: "Conscienciosidade",
    resumo: "Organização, disciplina, cumprimento de prazos",
  },
  E: {
    rotulo: "Extroversão",
    resumo: "Energia social, comunicação, iniciativa de contato",
  },
  A: {
    rotulo: "Amabilidade",
    resumo: "Empatia, cooperação, interesse pelas pessoas",
  },
  EE: {
    rotulo: "Estabilidade Emocional",
    resumo: "Como lida com pressão, frustração e oscilação de humor",
  },
};

// ─── Escala e instrução (§2.2) ─────────────────────────────────────────────

/** Texto exato da instrução ao candidato (§2.2). Não parafrasear. */
export const INSTRUCAO_BIG_FIVE =
  "A seguir você verá 20 frases. Indique o quanto cada uma descreve você, " +
  "usando a escala de 1 a 5. Não existem respostas certas ou erradas — " +
  "responda com sinceridade, pensando em como você é na maior parte do tempo.";

/** Mesma escala para os 20 itens (§2.2). */
export const ESCALA_BIG_FIVE = [
  { valor: 1, rotulo: "Discordo totalmente" },
  { valor: 2, rotulo: "Discordo" },
  { valor: 3, rotulo: "Neutro" },
  { valor: 4, rotulo: "Concordo" },
  { valor: 5, rotulo: "Concordo totalmente" },
] as const;

export const VALOR_MINIMO_BIG_FIVE = 1;
export const VALOR_MAXIMO_BIG_FIVE = 5;

/**
 * Constante da inversão: `6 − resposta` (§2.4, passo 1).
 *
 * 6 não é mágico — é `mínimo + máximo` da escala (1 + 5). É o que faz 5 virar
 * 1, 4 virar 2 e 3 ficar 3, ou seja, espelhar em torno do ponto neutro. Se a
 * escala um dia virar 1–7, esta constante vira 8 sozinha.
 */
export const ESPELHO_DA_ESCALA = VALOR_MINIMO_BIG_FIVE + VALOR_MAXIMO_BIG_FIVE; // 6

// ─── Banco de itens (§2.3) ─────────────────────────────────────────────────

export type ItemBigFive = {
  /** Estável e opaco: é o que o front devolve como chave de resposta. */
  id: string;
  /** Número na tabela do §2.3 — é o que permite auditar item a item. */
  numero: number;
  texto: string;
  /** USO INTERNO. Nunca exibir (§2.3). */
  fator: FatorBigFive;
  /** USO INTERNO. Nunca exibir. Item de pontuação invertida, o `(R)` do manual. */
  reverso: boolean;
};

/**
 * A tabela do §2.3, transcrita na mesma ordem e com as mesmas marcações, para
 * que a conferência contra o manual seja linha a linha.
 *
 *   [ número, texto, fator, invertido? ]
 */
const TABELA_DO_MANUAL: Array<[number, string, FatorBigFive, boolean]> = [
  [1, "Sou a alma da festa.", "E", false],
  [2, "Tenho empatia pelos sentimentos dos outros.", "A", false],
  [3, "Termino minhas tarefas imediatamente.", "C", false],
  [4, "Tenho mudanças de humor frequentes.", "N", false],
  [5, "Tenho uma imaginação vívida.", "O", false],
  [6, "Falo pouco.", "E", true],
  [7, "Não me interesso pelos problemas dos outros.", "A", true],
  [8, "Frequentemente esqueço de colocar as coisas de volta no lugar.", "C", true],
  [9, "Fico relaxado(a) a maior parte do tempo.", "N", true],
  [10, "Não me interesso por ideias abstratas.", "O", true],
  [11, "Converso com muitas pessoas diferentes em eventos.", "E", false],
  [12, "Consigo sentir as emoções dos outros.", "A", false],
  [13, "Gosto de ordem e organização.", "C", false],
  [14, "Fico chateado(a) com facilidade.", "N", false],
  [15, "Tenho dificuldade para entender ideias abstratas.", "O", true],
  [16, "Prefiro ficar em segundo plano.", "E", true],
  [17, "Não me interesso de verdade pelas outras pessoas.", "A", true],
  [18, "Costumo fazer bagunça com as coisas.", "C", true],
  [19, "Raramente me sinto triste.", "N", true],
  [20, "Não tenho uma boa imaginação.", "O", true],
];

export const ITENS_BIG_FIVE: readonly ItemBigFive[] = TABELA_DO_MANUAL.map(
  ([numero, texto, fator, reverso]) => ({
    id: `bf${String(numero).padStart(2, "0")}`,
    numero,
    texto,
    fator,
    reverso,
  }),
);

export const ITEM_BIG_FIVE_POR_ID = new Map<string, ItemBigFive>(
  ITENS_BIG_FIVE.map((i) => [i.id, i]),
);

/** 4 itens por fator (§2.1). É o `k` das equações do §2.4. */
export const ITENS_POR_FATOR_BIG_FIVE = 4;

export const TOTAL_DE_ITENS_BIG_FIVE = ITENS_BIG_FIVE.length; // 20

/** Mapa por fator do §2.3 — O = 5,10R,15R,20R · C = 3,8R,13,18R · … */
export const ITENS_BIG_FIVE_POR_FATOR = Object.fromEntries(
  FATORES_BIG_FIVE.map((f) => [f, ITENS_BIG_FIVE.filter((i) => i.fator === f)]),
) as Record<FatorBigFive, ItemBigFive[]>;

/** O que o candidato recebe: texto e id. Fator e inversão ficam no servidor. */
export type ItemBigFiveParaCandidato = { id: string; texto: string };

// ─── Equações (§2.4) ───────────────────────────────────────────────────────

/**
 * Passo 1 — valor de um item.
 *
 *   item normal:      valor = resposta
 *   item invertido R: valor = 6 − resposta
 *
 * O banco guarda sempre a resposta CRUA (1..5). A inversão é cálculo, não
 * armazenamento: assim uma correção de gabarito não exige reescrever resposta
 * de candidato nenhum.
 */
export function valorDoItemBigFive(item: ItemBigFive, resposta: number): number {
  return item.reverso ? ESPELHO_DA_ESCALA - resposta : resposta;
}

/** Passo 2 — bruto do fator: 4 itens × 1..5, logo 4 a 20. */
export const BRUTO_MINIMO_BIG_FIVE =
  ITENS_POR_FATOR_BIG_FIVE * VALOR_MINIMO_BIG_FIVE; // 4
export const BRUTO_MAXIMO_BIG_FIVE =
  ITENS_POR_FATOR_BIG_FIVE * VALOR_MAXIMO_BIG_FIVE; // 20
/** Amplitude do bruto — o "16" que aparece escrito no §2.4. */
export const AMPLITUDE_DO_BRUTO_BIG_FIVE =
  BRUTO_MAXIMO_BIG_FIVE - BRUTO_MINIMO_BIG_FIVE; // 16

/**
 * Passo 3 — conversão para 0–100:
 *
 *   score = ((bruto − 4) / 16) × 100     (arredondar para inteiro)
 *
 * É uma régua linear: desloca o piso do bruto para o zero e divide pela
 * amplitude. A escala 0–100 é a convenção declarada no §1 — sem ela, comparar
 * Big Five com DISC e SJT na mesma ficha não faria sentido.
 *
 * O arredondamento é `Math.round` (meio para cima), que é o que reproduz o
 * exemplo do §2.5: 18,75 → 19.
 */
export function escoreDoBrutoBigFive(bruto: number): number {
  return Math.round(
    ((bruto - BRUTO_MINIMO_BIG_FIVE) / AMPLITUDE_DO_BRUTO_BIG_FIVE) * 100,
  );
}

/**
 * Passo 4 — Estabilidade Emocional: `score_EE = 100 − score_N`.
 *
 * A inversão é feita sobre o score JÁ ARREDONDADO, exatamente como o manual
 * escreve (§2.5: 18,75 → 19 → EE 81). Inverter antes do arredondamento daria
 * 81,25 → 81 no exemplo, mas divergiria em outros brutos — e o manual é o
 * gabarito.
 */
export function estabilidadeEmocional(scoreN: number): number {
  return 100 - scoreN;
}

// ─── Faixas de interpretação (§2.6) ────────────────────────────────────────

/**
 * Faixas iguais para os 5 fatores. Limites INCLUSIVOS em inteiro, porque o
 * score já sai arredondado do passo 3 — não existe 34,5 para cair no vão.
 */
export const FAIXAS_BIG_FIVE = [
  { nome: "baixo", rotulo: "Baixo", min: 0, max: 34 },
  { nome: "moderado", rotulo: "Moderado", min: 35, max: 64 },
  { nome: "alto", rotulo: "Alto", min: 65, max: 100 },
] as const;

export type FaixaBigFive = (typeof FAIXAS_BIG_FIVE)[number];

export function faixaBigFive(score: number): FaixaBigFive {
  return (
    FAIXAS_BIG_FIVE.find((f) => score >= f.min && score <= f.max) ??
    FAIXAS_BIG_FIVE[FAIXAS_BIG_FIVE.length - 1]
  );
}

/**
 * Tabela de leitura do §2.6. É dado, não texto de relatório: quem monta a
 * devolutiva combina isto com a vaga (§2.6, nota para o RH — não existe perfil
 * "bom" universal).
 */
export const INTERPRETACAO_BIG_FIVE: Record<
  FatorExibidoBigFive,
  { alto: string; baixo: string }
> = {
  O: {
    alto: "Curioso, criativo, aberto a mudanças e ideias novas; pode se entediar com rotina",
    baixo: "Prático, prefere o conhecido e o concreto; consistente em rotinas",
  },
  C: {
    alto: "Organizado, disciplinado, confiável com prazos; risco de rigidez/perfeccionismo",
    baixo: "Flexível e espontâneo; risco de desorganização e atraso",
  },
  E: {
    alto: "Comunicativo, energizado por pessoas, toma iniciativa social",
    baixo: "Reservado, prefere trabalho concentrado e interações menores",
  },
  A: {
    alto: "Cooperativo, empático, bom em relações; pode evitar confrontos necessários",
    baixo: "Direto, competitivo, questionador; pode gerar atrito",
  },
  EE: {
    alto: "Calmo sob pressão, humor constante, recupera-se rápido de frustrações",
    baixo: "Mais reativo a estresse e críticas; humor oscilante sob pressão",
  },
};

// ─── Forma: qual ordem ESTA pessoa vê ──────────────────────────────────────

export type FormaBigFive = {
  semente: string;
  /** Ids dos 20 itens, na ordem de apresentação. */
  itens: string[];
};

/**
 * Ordem dos itens, derivada da semente.
 *
 * Duas exigências ao mesmo tempo:
 *
 *   · §1, regra 2 — embaralhar por candidato (posição fixa vicia e permite
 *     combinar respostas entre candidatos);
 *   · a mesma semente tem que reconstruir a MESMA prova, senão retomar a prova
 *     mostra outra coisa e a auditoria não fecha.
 *
 * O gerador é o mesmo `criarAleatorio`/`embaralhar` do form.ts do instrumento
 * PRUMO — de propósito: uma única implementação de aleatoriedade determinística
 * no repositório.
 *
 * A restrição adicional (nunca dois itens do mesmo fator em sequência) é
 * herdada da restrição (a) do form.ts: itens do mesmo fator lado a lado criam
 * efeito de bloco, a pessoa percebe o tema e passa a responder o tema em vez da
 * frase. Com 20 itens e 4 por fator ela é folgada; o laço reinicia com semente
 * derivada nos raros becos, e no pior caso entrega o embaralhamento simples —
 * prova entregue vale mais que prova perfeita não entregue.
 */
export function ordenarItensBigFive(semente: string, tentativas = 40): string[] {
  const tentar = (semeteDaVez: string): ItemBigFive[] | null => {
    const aleatorio = criarAleatorio(semeteDaVez);
    const restantes = embaralhar(ITENS_BIG_FIVE, aleatorio);
    const sequencia: ItemBigFive[] = [];

    while (restantes.length > 0) {
      const anterior = sequencia[sequencia.length - 1];
      const viaveis = restantes.filter(
        (i) => !anterior || i.fator !== anterior.fator,
      );
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
    const resultado = tentar(`${semente}:bigfive:ordem:${t}`);
    if (resultado) return resultado.map((i) => i.id);
  }

  return embaralhar(
    ITENS_BIG_FIVE,
    criarAleatorio(`${semente}:bigfive:ultimo`),
  ).map((i) => i.id);
}

export function montarFormaBigFive(semente: string): FormaBigFive {
  return { semente, itens: ordenarItensBigFive(semente) };
}

/**
 * A visão do candidato — só id e texto.
 *
 * Existe como função (e não como "o front que escolha os campos") porque é aqui
 * que a regra do §2.3 é cumprida: fator e inversão são de uso interno e não
 * podem sair do servidor.
 */
export function itensParaCandidatoBigFive(
  forma: FormaBigFive,
): ItemBigFiveParaCandidato[] {
  return forma.itens
    .map((id) => ITEM_BIG_FIVE_POR_ID.get(id))
    .filter((i): i is ItemBigFive => Boolean(i))
    .map((i) => ({ id: i.id, texto: i.texto }));
}

// ─── Respostas e validação ─────────────────────────────────────────────────

/** Id do item → resposta CRUA de 1 a 5, sem inversão aplicada. */
export type RespostasBigFive = Record<string, number>;

export type ViolacaoBigFive = { regra: string; detalhe: string };

/**
 * Valida antes de pontuar. Separado de `pontuarBigFive` para o front conseguir
 * checar sem provocar exceção (e para o teste conferir cada regra isolada).
 */
export function validarRespostasBigFive(
  respostas: RespostasBigFive,
): ViolacaoBigFive[] {
  const violacoes: ViolacaoBigFive[] = [];

  for (const id of Object.keys(respostas)) {
    if (!ITEM_BIG_FIVE_POR_ID.has(id))
      violacoes.push({
        regra: "item_desconhecido",
        detalhe: `"${id}" não é item do Big Five`,
      });
  }

  for (const item of ITENS_BIG_FIVE) {
    const valor = respostas[item.id];

    if (valor == null) {
      violacoes.push({
        regra: "item_sem_resposta",
        detalhe: `item ${item.numero} (${item.id}) não foi respondido`,
      });
      continue;
    }

    // O bruto do §2.4 é SOMA de 4 itens: um item faltando ou fora da escala não
    // produz escore "aproximado", produz escore errado. Por isso é violação, e
    // não um valor neutro assumido.
    if (!Number.isInteger(valor) || valor < VALOR_MINIMO_BIG_FIVE || valor > VALOR_MAXIMO_BIG_FIVE)
      violacoes.push({
        regra: "valor_fora_da_escala",
        detalhe: `item ${item.numero} (${item.id}) respondeu ${valor}, esperado inteiro de 1 a 5`,
      });
  }

  return violacoes;
}

// ─── Resultado ─────────────────────────────────────────────────────────────

export type NotaBigFive = {
  chave: FatorExibidoBigFive;
  /** "Estabilidade Emocional" para EE — a palavra "Neuroticismo" não existe aqui. */
  rotulo: string;
  /** Bruto do fator interno (4 a 20). No caso da EE, é o bruto de N. */
  bruto: number;
  /** Já com o passo 4 aplicado quando a chave é EE. */
  score: number;
  faixa: FaixaBigFive;
};

/**
 * A saída rica da apuração — tudo que a conferência contra o manual precisa.
 * Para o que é GRAVADO, ver `paraResultadoDeModuloBigFive` no fim do arquivo.
 */
export type ApuracaoBigFive = {
  /** Discriminante do enum `Teste` de `baterias.ts`. */
  teste: "BIG_FIVE";
  /** Brutos por fator INTERNO, inclusive N. Para auditoria/reprocessamento. */
  brutos: Record<FatorBigFive, number>;
  /**
   * Escores por fator INTERNO, inclusive o score de N sem a transformação do
   * passo 4. NUNCA exibir: existe para conferir a conta contra o manual.
   */
  escoresInternos: Record<FatorBigFive, number>;
  /** O que vai para a ficha, na ordem O, C, E, A, EE (§5.2). */
  notas: NotaBigFive[];
  /** Atalho para leitura: chave exibida → score. */
  porChave: Record<FatorExibidoBigFive, number>;
};

/**
 * Aplica os quatro passos do §2.4 sobre as 20 respostas cruas.
 *
 * Exige a prova completa: lança se `validarRespostasBigFive` acusar qualquer
 * violação. O contrato é duro de propósito — pontuar prova incompleta produz um
 * número que PARECE válido e vira decisão sobre uma pessoa.
 */
export function pontuarBigFive(respostas: RespostasBigFive): ApuracaoBigFive {
  const violacoes = validarRespostasBigFive(respostas);
  if (violacoes.length > 0)
    throw new Error(
      `respostas do Big Five inválidas: ${violacoes
        .map((v) => `${v.regra} (${v.detalhe})`)
        .join("; ")}`,
    );

  const brutos = {} as Record<FatorBigFive, number>;
  const escoresInternos = {} as Record<FatorBigFive, number>;

  for (const fator of FATORES_BIG_FIVE) {
    // Passo 1 + passo 2.
    const bruto = ITENS_BIG_FIVE_POR_FATOR[fator].reduce(
      (soma, item) => soma + valorDoItemBigFive(item, respostas[item.id]),
      0,
    );
    brutos[fator] = bruto;
    // Passo 3.
    escoresInternos[fator] = escoreDoBrutoBigFive(bruto);
  }

  // Passo 4: N some da saída exibida e reaparece como EE.
  const notas: NotaBigFive[] = FATORES_EXIBIDOS_BIG_FIVE.map((chave) => {
    const fatorInterno: FatorBigFive = chave === "EE" ? "N" : chave;
    const score =
      chave === "EE"
        ? estabilidadeEmocional(escoresInternos.N)
        : escoresInternos[fatorInterno];

    return {
      chave,
      rotulo: ROTULOS_BIG_FIVE[chave].rotulo,
      bruto: brutos[fatorInterno],
      score,
      faixa: faixaBigFive(score),
    };
  });

  const porChave = Object.fromEntries(
    notas.map((n) => [n.chave, n.score]),
  ) as Record<FatorExibidoBigFive, number>;

  return { teste: "BIG_FIVE", brutos, escoresInternos, notas, porChave };
}

// ─── Ponte para o resultado gravado (`baterias.ts`) ────────────────────────

/**
 * Converte a apuração no `ResultadoBigFive` de `baterias.ts`, que é o que vai
 * para `Assessment.moduleResults`.
 *
 * A conversão faz duas coisas, e é por elas que ela existe num lugar só:
 *
 *   1. TROCA O ALFABETO. O Mini-IPIP usa O/C/E/A/N; o Prumo usa C/E/X/A/O, onde
 *      `E` é Estabilidade e Extroversão é `X`. Gravar sem traduzir escreveria a
 *      Extroversão do candidato na coluna da Estabilidade — erro que ninguém
 *      percebe olhando o número.
 *   2. INVERTE O N. `FATOR_BIG_FIVE_INVERTIDO` marca o único fator que sofre o
 *      passo 4 do §2.4: o que fica gravado como Estabilidade é `100 − score_N`.
 *
 * Depois desta função "Neuroticismo" não existe mais em lugar nenhum do fluxo —
 * nem como número cru, nem como rótulo (§6.4).
 */
export function paraResultadoDeModuloBigFive(
  apuracao: ApuracaoBigFive,
): ResultadoBigFiveDeModulo {
  const fatores = {} as Record<Fator, number>;

  for (const fator of FATORES_BIG_FIVE) {
    const score = apuracao.escoresInternos[fator];
    fatores[FATOR_PRUMO_DE_BIG_FIVE[fator]] =
      fator === FATOR_BIG_FIVE_INVERTIDO ? estabilidadeEmocional(score) : score;
  }

  return { teste: "BIG_FIVE", fatores, brutos: apuracao.brutos };
}
