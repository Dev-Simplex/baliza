import type { Fator } from "./types";

/**
 * Bateria de testes — quais provas uma vaga aplica.
 *
 * ─── O que este arquivo resolve ────────────────────────────────────────────
 * Até aqui existia UM instrumento e ponto: 34 afirmações + 5 situações, cinco
 * fatores (C/E/X/A/O). O produto passou a precisar de mais de um: a empresa
 * escolhe, POR VAGA, quais testes o candidato responde, e cada teste vira uma
 * aba separada na prova.
 *
 * A decisão que estrutura tudo: o instrumento que já existe NÃO foi substituído
 * nem fatiado. Ele continua inteiro, com o nome de `PRUMO`, como uma das opções.
 * Toda vaga que existia antes desta mudança tem bateria `["PRUMO"]` — é o
 * default da coluna — e por isso continua se comportando exatamente como antes.
 * Os três do manual (Big Five, DISC e SJT) entram AO LADO dele.
 *
 * ─── Este arquivo é um contrato ────────────────────────────────────────────
 * Ele não implementa banco de item, equação nem tela. Ele declara o vocabulário
 * que o resto do sistema usa para falar de bateria: os identificadores, quanto
 * cada teste custa de tempo e de telas, e a FORMA do resultado que cada módulo
 * grava. Quem implementar os bancos preenche esses tipos; quem monta a prova e
 * quem lê o relatório consomem daqui.
 *
 * Mantido sem dependência pesada de propósito: importa só tipos de `types.ts` e
 * nada de `items.ts`/`scenarios.ts`/`form.ts`. Assim ele pode ser importado de
 * componente de cliente (a tela de seleção da vaga precisa dos tempos) sem
 * arrastar o banco de itens inteiro para o pacote do navegador.
 */

// ─── Os testes ─────────────────────────────────────────────────────────────

/**
 * Ordem canônica de aplicação, e não uma lista qualquer: é nesta ordem que as
 * abas aparecem para o candidato e que a bateria é normalizada antes de gravar.
 *
 * PRUMO primeiro por ser o instrumento mais longo e o único que alimenta o
 * ranking sozinho — prova longa no começo, quando a atenção ainda está inteira.
 * Os outros três seguem a ordem recomendada pelo manual (§1): Big Five → DISC →
 * SJT, do mais leve e impessoal ao mais custoso de responder.
 */
export const TESTES = [
  "PRUMO",
  "BIG_FIVE",
  "DISC",
  "ESTILO_EMOCIONAL",
  "SJT",
] as const;

export type Teste = (typeof TESTES)[number];

/** Bateria: os testes de uma vaga, já na ordem canônica e sem repetição. */
export type Bateria = Teste[];

/**
 * O que toda vaga que já existe tem, e o que a tela de criação vem marcando.
 *
 * É o mesmo valor do `@default` da coluna no banco: mudar um sem o outro faz a
 * vaga criada pela interface divergir da criada por seed/importação.
 */
export const BATERIA_PADRAO: Bateria = ["PRUMO"];

// ─── Catálogo ──────────────────────────────────────────────────────────────

export type FichaDeTeste = {
  id: Teste;
  /** Nome exibido ao recrutador na seleção da vaga. */
  nome: string;
  /** Uma linha: o que o teste responde. Vai no cartão de seleção. */
  resumo: string;
  /** O que o candidato faz em cada tela. */
  formato: string;
  /** Quantas telas o candidato atravessa (uma pergunta por tela). */
  telas: number;
  /**
   * Tempo estimado da prova inteira, em segundos.
   *
   * Sempre o teto da faixa do manual, nunca o piso: prometer 4 min e a pessoa
   * levar 6 vira sensação de enrolação, e desistir no meio custa a resposta
   * inteira — prova incompleta não vira relatório.
   */
  segundos: number;
  /**
   * O teste produz os cinco fatores (C/E/X/A/O)?
   *
   * Esta é a linha que separa "dá para calcular aderência" de "não dá". Ver
   * `escoresParaFit`.
   */
  produzFatores: boolean;
  /**
   * O teste tem gabarito (resposta certa)?
   *
   * Só o SJT tem. Consequência prática, não rótulo: gabarito e competência
   * NUNCA vão ao front do candidato, nem depois de terminar — expor queima o
   * banco de cenários (manual §4.2). E o resultado do SJT não entra na
   * devolutiva do candidato (manual §5.1).
   */
  temGabarito: boolean;
};

export const CATALOGO_DE_TESTES: Record<Teste, FichaDeTeste> = {
  PRUMO: {
    id: "PRUMO",
    nome: "Mapeamento Baliza",
    resumo:
      "Os cinco fatores com facetas, arquétipo e selo de confiança. É o único que sozinho já produz a aderência à vaga.",
    formato: "Afirmações de 1 a 5 e situações de trabalho",
    // Espelham `TOTAL_DE_TELAS` de form.ts (34 itens + 5 situações) e os pesos
    // de tempo-estimado.ts (6s por afirmação, 25s por situação). Duplicar aqui
    // é o preço de manter este arquivo leve o bastante para o navegador; o
    // teste `baterias.test.ts` compara os dois lados e falha se divergirem.
    telas: 39,
    segundos: 34 * 6 + 5 * 25,
    produzFatores: true,
    temGabarito: false,
  },
  BIG_FIVE: {
    id: "BIG_FIVE",
    nome: "Big Five (Mini-IPIP)",
    resumo:
      "Os cinco fatores em versão curta e de domínio público. Mede o mesmo terreno do Mapeamento Baliza com um quarto do tempo — e menos nuance.",
    formato: "20 afirmações de 1 a 5",
    telas: 20,
    segundos: 5 * 60, // manual §1: 4–5 min
    produzFatores: true,
    temGabarito: false,
  },
  DISC: {
    id: "DISC",
    nome: "DISC — estilo de trabalho",
    resumo:
      "Como a pessoa tende a trabalhar e se comunicar. Descreve estilo, não competência: é contexto para a entrevista, não nota.",
    formato: "25 perguntas, uma alternativa por tela",
    telas: 25,
    segundos: 8 * 60,
    produzFatores: false,
    temGabarito: false,
  },
  ESTILO_EMOCIONAL: {
    id: "ESTILO_EMOCIONAL",
    nome: "Estilo Emocional do Cérebro",
    resumo:
      "Mapeia resiliência, atitude, intuição social, autopercepção, sensibilidade ao contexto e atenção.",
    formato: "60 afirmações de Verdadeiro ou Falso",
    telas: 60,
    segundos: 10 * 60,
    produzFatores: false,
    temGabarito: false,
  },
  SJT: {
    id: "SJT",
    nome: "Julgamento situacional (SJT)",
    resumo:
      "Decisão em situações reais de trabalho, com gabarito e nota por competência. É o mais ligado ao desempenho na vaga.",
    formato: "8 cenários, uma alternativa por cenário",
    telas: 8,
    segundos: 12 * 60, // manual §1: 10–12 min
    produzFatores: false,
    temGabarito: true,
  },
};

export const FICHAS_DE_TESTE: readonly FichaDeTeste[] = TESTES.map(
  (t) => CATALOGO_DE_TESTES[t],
);

// ─── Leitura e normalização ────────────────────────────────────────────────

export function ehTeste(valor: unknown): valor is Teste {
  return typeof valor === "string" && (TESTES as readonly string[]).includes(valor);
}

/**
 * Põe a bateria na forma canônica: sem repetição, sem desconhecido, na ordem de
 * aplicação.
 *
 * A ordem é imposta aqui e não confiada a quem chamou porque ela é a ordem das
 * ABAS da prova. Deixar a ordem de clique do recrutador virar ordem de aplicação
 * faria dois candidatos da mesma vaga responderem sequências diferentes por
 * acidente de interface.
 *
 * Devolve lista vazia para entrada vazia — de propósito. "Nenhum teste" é um
 * erro que precisa chegar até quem decide (ver `validarBateria`); trocar por
 * um default silencioso aplicaria uma prova que ninguém pediu.
 */
export function normalizarBateria(entrada: readonly unknown[]): Bateria {
  const escolhidos = new Set(entrada.filter(ehTeste));
  return TESTES.filter((t) => escolhidos.has(t));
}

/**
 * Lê a bateria de onde ela veio do banco (coluna de enum) ou de um JSON antigo.
 *
 * Nunca devolve vazio: linha sem bateria é linha gravada antes desta coluna
 * existir, e o comportamento dela sempre foi a Baliza. Diferente da entrada do
 * formulário, aqui o default é a leitura correta do passado, não um palpite.
 */
export function lerBateria(valor: unknown): Bateria {
  if (!Array.isArray(valor)) return [...BATERIA_PADRAO];
  const bateria = normalizarBateria(valor);
  return bateria.length > 0 ? bateria : [...BATERIA_PADRAO];
}

export type ValidacaoDeBateria =
  | { ok: true; bateria: Bateria }
  | { ok: false; erro: string };

/**
 * Validação da escolha do recrutador. A única regra: pelo menos um teste.
 *
 * Vaga sem nenhum teste não é uma vaga mais simples — é uma vaga que manda o
 * candidato para uma prova de zero telas e devolve um relatório em branco.
 */
export function validarBateria(entrada: readonly unknown[]): ValidacaoDeBateria {
  const bateria = normalizarBateria(entrada);
  if (bateria.length === 0)
    return { ok: false, erro: "Escolha pelo menos um teste para esta vaga." };
  return { ok: true, bateria };
}

// ─── Custo da bateria ──────────────────────────────────────────────────────

export function telasDaBateria(bateria: readonly Teste[]): number {
  return bateria.reduce((a, t) => a + (CATALOGO_DE_TESTES[t]?.telas ?? 0), 0);
}

export function segundosDaBateria(bateria: readonly Teste[]): number {
  return bateria.reduce((a, t) => a + (CATALOGO_DE_TESTES[t]?.segundos ?? 0), 0);
}

/** Minutos inteiros, arredondando para cima: promessa curta demais é pior. */
export function minutosDaBateria(bateria: readonly Teste[]): number {
  return Math.ceil(segundosDaBateria(bateria) / 60);
}

/** "cerca de 12 min" — rótulo pronto para a tela de seleção e para o convite. */
export function rotuloDeTempo(bateria: readonly Teste[]): string {
  const minutos = minutosDaBateria(bateria);
  if (minutos <= 0) return "sem duração";
  return `cerca de ${minutos} min`;
}

// ─── Aderência: quem alimenta o ranking ────────────────────────────────────

/**
 * A bateria produz os cinco fatores?
 *
 * O fitScore do produto inteiro — ranking da vaga, média do painel, "puxa pra
 * baixo" do relatório — é distância ponderada entre os cinco fatores do
 * candidato e o perfil-alvo da vaga. DISC e SJT medem outra coisa: DISC devolve
 * D/I/S/C (estilo) e SJT devolve acerto contra gabarito. Nenhum dos dois se
 * converte nos cinco fatores, e forçar a conversão inventaria número.
 *
 * Então uma vaga que aplique só DISC+SJT NÃO TEM aderência — e isso não é um
 * defeito a esconder: é a resposta correta. O que não pode acontecer é a tela
 * mostrar 0, que se lê como "candidato péssimo", ou quebrar. Ver a regra do
 * `fitScore = null` em `concluirAvaliacao`.
 */
export function produzFatores(bateria: readonly Teste[]): boolean {
  return bateria.some((t) => CATALOGO_DE_TESTES[t]?.produzFatores);
}

/** Os testes da bateria que alimentam o ranking. Vazio = vaga sem aderência. */
export function fontesDeFatores(bateria: readonly Teste[]): Teste[] {
  return bateria.filter((t) => CATALOGO_DE_TESTES[t]?.produzFatores);
}

// ─── Resultado por módulo ──────────────────────────────────────────────────

/**
 * Letras do Big Five como o manual as escreve (§2.1) — que NÃO são as da Baliza.
 *
 * Duas colisões, e as duas silenciosas se ninguém as declarar:
 *   · `E` no manual é Extroversão; na Baliza, `E` é Estabilidade e Extroversão é `X`.
 *   · `N` (Neuroticismo) não existe na Baliza: o equivalente é `E`, e é o INVERSO
 *     (manual §2.4, passo 4: score_EE = 100 − score_N).
 *
 * Por isso a conversão mora aqui, num lugar só, e o resultado do Big Five já é
 * gravado na convenção da Baliza — com o N transformado em EE ANTES de entrar.
 * "Neuroticismo" não aparece em tela nenhuma (manual §6.4).
 */
export type FatorBigFive = "O" | "C" | "E" | "A" | "N";

export const FATORES_BIG_FIVE: readonly FatorBigFive[] = [
  "O",
  "C",
  "E",
  "A",
  "N",
] as const;

export const FATOR_PRUMO_DE_BIG_FIVE: Record<FatorBigFive, Fator> = {
  O: "O", // Abertura            → Abertura ao Novo
  C: "C", // Conscienciosidade   → Organização e Entrega
  E: "X", // Extroversão         → Energia Social
  A: "A", // Amabilidade         → Cooperação
  N: "E", // Neuroticismo (inverso) → Estabilidade sob Pressão
};

/** O único fator do Big Five que precisa ser invertido para virar fator Baliza. */
export const FATOR_BIG_FIVE_INVERTIDO: FatorBigFive = "N";

export type DimensaoDisc = "D" | "I" | "S" | "C";

export const DIMENSOES_DISC: readonly DimensaoDisc[] = [
  "D",
  "I",
  "S",
  "C",
] as const;

export const NOMES_DE_DISC: Record<DimensaoDisc, { nome: string; foco: string }> =
  {
    D: { nome: "Dominância", foco: "Resultados, desafios, decisão rápida" },
    I: { nome: "Influência", foco: "Pessoas, comunicação, entusiasmo" },
    S: { nome: "eStabilidade", foco: "Cooperação, constância, harmonia" },
    C: { nome: "Conformidade", foco: "Precisão, regras, qualidade" },
  };

/**
 * O que a Baliza grava quando responde a própria prova.
 *
 * Os cinco fatores já estão na coluna `Assessment.scores` desde sempre; o
 * módulo repete o número aqui porque `moduleResults` precisa ser lido inteiro,
 * de um lugar só, por quem monta a ficha consolidada — inclusive quando a
 * bateria tem mais de uma fonte de fator e é preciso saber de qual veio qual.
 */
export type ResultadoPrumo = {
  teste: "PRUMO";
  /** 0–100 por fator, na convenção da Baliza. */
  fatores: Record<Fator, number>;
};

export type ResultadoBigFive = {
  teste: "BIG_FIVE";
  /** 0–100 já convertido para a convenção da Baliza, com N virado EE. */
  fatores: Record<Fator, number>;
  /** Bruto do manual (4–20 por fator), guardado para auditar a conta. */
  brutos: Record<FatorBigFive, number>;
};

export type ResultadoDisc = {
  teste: "DISC";
  /** 0–100 por dimensão. A soma dos quatro fica em ~200 (manual §3.4). */
  dimensoes: Record<DimensaoDisc, number>;
  /** MAIS − MENOS, de −12 a +12. A soma dos quatro é 0. */
  liquidos: Record<DimensaoDisc, number>;
  dominante: DimensaoDisc;
  /** Segunda maior, só quando o score dela ≥ 50; senão o perfil é "puro". */
  secundaria: DimensaoDisc | null;
  /** "D", "D/I" ou "D/I equilibrado" — o que aparece na ficha. */
  rotulo: string;
};

export type CompetenciaSjt = {
  /** Rótulo humano da competência ("Foco no cliente"). */
  competencia: string;
  /** 0–100 dentro daquela competência. */
  score: number;
  /** Quantos cenários daquela competência foram aplicados. */
  cenarios: number;
};

export type ResultadoSjt = {
  teste: "SJT";
  /** 0–100 geral. */
  score: number;
  pontosObtidos: number;
  pontosMaximos: number;
  porCompetencia: CompetenciaSjt[];
  /**
   * Cenários em que a pessoa escolheu a alternativa de 0 ponto.
   *
   * Vale por si, independentemente do score: o manual (§4.6) manda levar toda
   * escolha [0] à entrevista, porque a média esconde o zero.
   */
  piores: Array<{ blocoId: string; competencia: string }>;
};

export type DimensaoEstiloEmocional =
  | "RESILIENCIA"
  | "ATITUDE"
  | "INTUICAO_SOCIAL"
  | "AUTOPERCEPCAO"
  | "SENSIBILIDADE_CONTEXTO"
  | "ATENCAO";

export type ResultadoEstiloEmocional = {
  teste: "ESTILO_EMOCIONAL";
  pontos: Record<DimensaoEstiloEmocional, number>;
  percentuais: Record<DimensaoEstiloEmocional, number>;
};

export type ResultadoDeModulo =
  | ResultadoPrumo
  | ResultadoBigFive
  | ResultadoDisc
  | ResultadoEstiloEmocional
  | ResultadoSjt;

/**
 * O que fica em `Assessment.moduleResults`.
 *
 * Chaveado pelo teste — e não uma lista — porque quem lê sempre pergunta "esta
 * pessoa tem DISC?", nunca "qual é o terceiro módulo?".
 */
export type ResultadosPorModulo = {
  PRUMO?: ResultadoPrumo;
  BIG_FIVE?: ResultadoBigFive;
  DISC?: ResultadoDisc;
  ESTILO_EMOCIONAL?: ResultadoEstiloEmocional;
  SJT?: ResultadoSjt;
};

/** Leitura defensiva do JSON do banco: forma errada vira "nenhum módulo". */
export function lerResultados(valor: unknown): ResultadosPorModulo {
  if (typeof valor !== "object" || valor === null || Array.isArray(valor))
    return {};

  const bruto = valor as Record<string, unknown>;
  const saida: ResultadosPorModulo = {};

  for (const teste of TESTES) {
    const modulo = bruto[teste];
    if (
      typeof modulo === "object" &&
      modulo !== null &&
      (modulo as { teste?: unknown }).teste === teste
    ) {
      // A validação para no discriminante: o conteúdo é gravado pelo próprio
      // sistema, e reconferir campo a campo aqui seria reescrever o módulo de
      // escoragem numa segunda cópia que envelheceria em silêncio.
      Object.assign(saida, { [teste]: modulo });
    }
  }

  return saida;
}

/**
 * De onde saem os cinco fatores para o cálculo de aderência — ou `null`.
 *
 * Com Baliza e Big Five juntos na bateria, ganha a Baliza: 34 itens contra 20,
 * com facetas e sinal de consistência. Misturar os dois (média) produziria um
 * número que não corresponde a nenhum dos dois instrumentos e que ninguém
 * conseguiria explicar ao candidato — e explicabilidade não é opcional aqui
 * (LGPD art. 20).
 *
 * `null` significa "esta bateria não mede os cinco fatores". Quem chama tem que
 * tratar como ausência, nunca como zero.
 */
export function escoresParaFit(
  resultados: ResultadosPorModulo,
): { escores: Record<Fator, number>; origem: Teste } | null {
  if (resultados.PRUMO) return { escores: resultados.PRUMO.fatores, origem: "PRUMO" };
  if (resultados.BIG_FIVE)
    return { escores: resultados.BIG_FIVE.fatores, origem: "BIG_FIVE" };
  return null;
}
