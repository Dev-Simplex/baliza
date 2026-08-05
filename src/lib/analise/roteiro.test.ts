import { describe, expect, it } from "vitest";

import { montarRoteiro } from "./roteiro";
import type { ContribuicaoDeFit } from "@/lib/instrument/scoring";
import { FATORES, type Fator } from "@/lib/instrument/types";

/**
 * A regra nº 6 do produto — "o roteiro de entrevista nunca sai vazio" — não
 * tinha teste nenhum. Ela é a única das sete que depende inteiramente de
 * código: as outras são vocabulário e desenho de tela, que um humano vê. Um
 * roteiro vazio, não: ele passa despercebido até o dia em que um recrutador
 * abre a tela de um candidato e ela está em branco, dizendo "não precisa
 * conversar com esta pessoa" — o oposto exato do que o produto defende.
 */

function contribuicao(
  fator: Fator,
  parcial: Partial<ContribuicaoDeFit> = {},
): ContribuicaoDeFit {
  const escore = parcial.escore ?? 60;
  const faixa = parcial.faixa ?? ([50, 80] as [number, number]);
  return {
    fator,
    nome: fator,
    peso: 4,
    tipo: "faixa_otima",
    faixa,
    ideal: (faixa[0] + faixa[1]) / 2,
    escore,
    dentro: escore >= faixa[0] && escore <= faixa[1],
    desvio: 0,
    perda: 0,
    ...parcial,
  };
}

const ESCORES_NEUTROS = Object.fromEntries(
  FATORES.map((f) => [f, 60]),
) as Record<Fator, number>;

describe("montarRoteiro — a regra nº 6", () => {
  it("não sai vazio quando tudo está dentro da faixa e não há sinal de atenção", () => {
    const roteiro = montarRoteiro({
      contribuicoes: FATORES.map((f) => contribuicao(f)),
      sinaisDeConfianca: [],
      arquetipoId: "construtor",
      escores: ESCORES_NEUTROS,
    });

    expect(roteiro.perguntas.length).toBeGreaterThan(0);
  });

  it("não sai vazio no caso degenerado: nenhum peso, nenhum sinal, nenhum arquétipo", () => {
    // Perfil-alvo com tudo em peso zero é montável pelo recrutador, e
    // `archetypeId` pode não ter sido gravado. Sem o piso absoluto, os quatro
    // passos do roteiro ficam mudos ao mesmo tempo e a tela sai em branco.
    const roteiro = montarRoteiro({
      contribuicoes: [],
      sinaisDeConfianca: [],
      arquetipoId: null,
      escores: ESCORES_NEUTROS,
    });

    expect(roteiro.perguntas.length).toBeGreaterThan(0);
    expect(roteiro.perguntas.every((p) => p.pergunta.trim().length > 0)).toBe(
      true,
    );
  });

  it("não quebra quando a dimensão de maior peso não tem banco de perguntas", () => {
    // Um fator novo no modelo antes de entrar no banco de perguntas costumava
    // derrubar a página inteira com TypeError — a pior forma possível de o
    // roteiro "não sair vazio".
    const roteiro = montarRoteiro({
      contribuicoes: [contribuicao("C", { fator: "Z" as Fator, peso: 5 })],
      sinaisDeConfianca: [],
      arquetipoId: null,
      escores: ESCORES_NEUTROS,
    });

    expect(roteiro.perguntas.length).toBeGreaterThan(0);
  });

  it("nunca repete a mesma pergunta", () => {
    // `linha_reta` e `velocidade` compartilharam a mesma pergunta durante um
    // tempo; dimensões distintas podem voltar a compartilhar.
    const roteiro = montarRoteiro({
      contribuicoes: FATORES.map((f) =>
        contribuicao(f, { escore: 20, faixa: [50, 80], perda: 1 }),
      ),
      sinaisDeConfianca: ["linha_reta", "velocidade", "desejabilidade"],
      arquetipoId: "construtor",
      escores: ESCORES_NEUTROS,
    });

    const textos = roteiro.perguntas.map((p) => p.pergunta);
    expect(new Set(textos).size).toBe(textos.length);
  });

  it("prioriza a dimensão que mais custou aderência", () => {
    const roteiro = montarRoteiro({
      contribuicoes: [
        contribuicao("C", { escore: 20, faixa: [70, 90], perda: 0.9 }),
        contribuicao("O", { escore: 45, faixa: [50, 80], perda: 0.1 }),
      ],
      sinaisDeConfianca: [],
      arquetipoId: null,
      escores: ESCORES_NEUTROS,
    });

    expect(roteiro.perguntas[0].fator).toBe("C");
  });

  it("resume o gap dizendo de que lado a dimensão saiu", () => {
    const roteiro = montarRoteiro({
      contribuicoes: [contribuicao("E", { escore: 20, faixa: [50, 80], perda: 1 })],
      sinaisDeConfianca: [],
      arquetipoId: null,
      escores: ESCORES_NEUTROS,
    });

    expect(roteiro.resumoDoGap).toContain("abaixo");
    expect(roteiro.resumoDoGap).toContain("fora de prumo");
  });
});
