/**
 * Tipos do instrumento.
 *
 * A fonte da verdade conceitual é `docs/instrumento.md`. Código e banco derivam
 * dela — nunca o contrário.
 */

/** Os cinco fatores + D (desejabilidade social, que não é fator de escore). */
export type Fator = "C" | "E" | "X" | "A" | "O";
export type FatorOuD = Fator | "D";

export const FATORES: readonly Fator[] = ["C", "E", "X", "A", "O"] as const;

/** Nome técnico no banco, nome de mercado na interface (§2). */
export const NOMES_DE_FATOR: Record<
  Fator,
  { tecnico: string; ui: string; curto: string; facetas: readonly string[] }
> = {
  C: {
    tecnico: "Conscienciosidade",
    ui: "Organização e Entrega",
    curto: "Organização",
    facetas: ["organizacao", "realizacao", "confiabilidade"],
  },
  E: {
    tecnico: "Estabilidade Emocional",
    ui: "Estabilidade sob Pressão",
    curto: "Estabilidade",
    facetas: ["serenidade", "resiliencia", "autoconfianca"],
  },
  X: {
    tecnico: "Extroversão",
    ui: "Energia Social",
    curto: "Energia Social",
    facetas: ["assertividade", "sociabilidade", "entusiasmo"],
  },
  A: {
    tecnico: "Amabilidade",
    ui: "Cooperação",
    curto: "Cooperação",
    facetas: ["cooperacao", "empatia", "confianca"],
  },
  O: {
    tecnico: "Abertura",
    ui: "Abertura ao Novo",
    curto: "Abertura",
    facetas: ["curiosidade", "criatividade", "flexibilidade"],
  },
};

export const NOMES_DE_FACETA: Record<string, string> = {
  organizacao: "Organização",
  realizacao: "Realização",
  confiabilidade: "Confiabilidade",
  serenidade: "Serenidade",
  resiliencia: "Resiliência",
  autoconfianca: "Autoconfiança",
  assertividade: "Assertividade",
  sociabilidade: "Sociabilidade",
  entusiasmo: "Entusiasmo",
  cooperacao: "Cooperação",
  empatia: "Empatia",
  confianca: "Confiança",
  curiosidade: "Curiosidade",
  criatividade: "Criatividade",
  flexibilidade: "Flexibilidade",
  desejabilidade: "Desejabilidade social",
};

export type Item = {
  id: string;
  fator: FatorOuD;
  faceta: string;
  reverso: boolean;
  texto: string;
  /** Vocabulário de mercado exibido ao recrutador. NÃO é dimensão de escoragem. */
  dimensaoDeMercado?: string;
  /** Par de paráfrase para o sinal de consistência (§5.2). */
  par?: string;
};

export const ESCALA_LIKERT = [
  { valor: 1, rotulo: "Discordo totalmente", curto: "Discordo total" },
  { valor: 2, rotulo: "Discordo mais que concordo", curto: "Discordo" },
  { valor: 3, rotulo: "Fico no meio", curto: "No meio" },
  { valor: 4, rotulo: "Concordo mais que discordo", curto: "Concordo" },
  { valor: 5, rotulo: "Concordo totalmente", curto: "Concordo total" },
] as const;

export type ValorLikert = 1 | 2 | 3 | 4 | 5;

/**
 * Cortes qualitativos PROVISÓRIOS, por teoria (§4.3). Recalibrar com percentis
 * reais a partir de N=200. Deslocados pra cima de propósito: média de Likert
 * com itens invertidos tende a cair entre 3,3 e 3,5 (≈ 58-63 na escala 0-100).
 */
export const CORTES_QUALITATIVOS: Array<{
  nome: string;
  rotulo: string;
  min: number;
  max: number;
}> = [
  { nome: "baixo", rotulo: "Baixo", min: 0, max: 35 },
  { nome: "medio_baixo", rotulo: "Médio-baixo", min: 35, max: 48 },
  { nome: "medio", rotulo: "Médio", min: 48, max: 62 },
  { nome: "medio_alto", rotulo: "Médio-alto", min: 62, max: 75 },
  { nome: "alto", rotulo: "Alto", min: 75, max: 100.01 },
];

export type TipoDeDimensao =
  | "maior_melhor"
  | "faixa_otima"
  | "menor_melhor"
  | "irrelevante";

export type DimensaoAlvo = {
  tipo: TipoDeDimensao;
  /** 0 a 5. Peso 0 = a dimensão foi considerada e descartada de propósito. */
  peso: number;
  faixa: [number, number];
  /** Sobrescreve o ideal derivado do tipo. */
  ideal?: number;
};

export type PerfilAlvo = Record<Fator, DimensaoAlvo>;

export type Preset = {
  id: string;
  nome: string;
  familia: string;
  dimensoes: PerfilAlvo;
  nota: string;
};

export type Arquetipo = {
  id: string;
  nome: string;
  prototipo: Record<Fator, number>;
  essencia: string;
  perguntaChave: string;
  brilhaEm: string;
  travaEm: string;
  oGestorPrecisaDar: string;
  cuidadoAoLer: string;
};

export type AcaoDeCenario = {
  id: string;
  fator: Fator;
  texto: string;
};

export type BlocoDeCenario = {
  id: string;
  titulo: string;
  situacao: string;
  opcoes: AcaoDeCenario[];
};

/** Respostas cruas: id do item → valor 1..5, SEM inversão aplicada. */
export type Respostas = Record<string, number>;

export type RespostaDeCenario = {
  blocoId: string;
  primeiraId: string;
  ultimaId: string;
};
