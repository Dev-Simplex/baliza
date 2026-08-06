import { describe, expect, it } from "vitest";

import {
  lerProvaDaBateria,
  montarEtapas,
  montarProvaDaBateria,
} from "@/lib/actions/forma-da-bateria";
import { CATALOGO_DE_TESTES, TESTES, type Teste } from "@/lib/instrument/baterias";

import {
  minutosDasPerguntas,
  rotuloDoRestante,
  segundosDasPerguntas,
  SEGUNDOS_POR_BLOCO_DE_PALAVRAS,
  SEGUNDOS_POR_CENARIO,
} from "./tempo-estimado";

/** As perguntas de um teste, do jeito exato que o candidato as recebe. */
function perguntasDe(teste: Teste, semente = "tempo") {
  const bateria = [teste];
  const guardada = montarProvaDaBateria({ semente, bateria });
  const prova = lerProvaDaBateria({
    semente,
    bateria,
    itensGuardados: guardada.itens,
    blocosGuardados: guardada.blocos,
  });
  return montarEtapas({ semente, prova })[0].perguntas;
}

const afirmacoes = (n: number) =>
  Array.from({ length: n }, () => ({ tipo: "likert" as const }));

describe("tempo estimado", () => {
  /**
   * Este teste ocupa o lugar do que fixava a prova em 39 telas.
   *
   * Aquele número era verdade enquanto existia UMA prova; hoje a vaga escolhe a
   * bateria, e travar 39 travaria o produto no instrumento da casa. O que
   * continua tendo que ser verdade é a relação entre as duas estimativas: a de
   * dentro da prova nunca pode passar da que foi prometida na abertura. Se
   * alguém encarecer um tipo de tela sem revisar o catálogo, é aqui que aparece.
   */
  it("o que falta nunca soma mais do que o teste prometeu", () => {
    for (const teste of TESTES) {
      const perguntas = perguntasDe(teste);
      const ficha = CATALOGO_DE_TESTES[teste];

      expect(perguntas.length, `telas de ${teste}`).toBe(ficha.telas);
      expect(
        segundosDasPerguntas(perguntas),
        `${teste} promete ${ficha.segundos}s`,
      ).toBeLessThanOrEqual(ficha.segundos);
    }
  });

  it("a bateria inteira também cabe na soma das promessas", () => {
    const semente = "bateria-cheia";
    const bateria = [...TESTES];
    const guardada = montarProvaDaBateria({ semente, bateria });
    const prova = lerProvaDaBateria({
      semente,
      bateria,
      itensGuardados: guardada.itens,
      blocosGuardados: guardada.blocos,
    });
    const perguntas = montarEtapas({ semente, prova }).flatMap((e) => e.perguntas);

    const prometido = bateria.reduce(
      (a, t) => a + CATALOGO_DE_TESTES[t].segundos,
      0,
    );
    expect(segundosDasPerguntas(perguntas)).toBeLessThanOrEqual(prometido);
  });

  /**
   * Os dois pesos que o manual (§1) fixa por tabela, e não por medição nossa:
   * 12 blocos em 6 minutos e 8 cenários em 12. Mexer neles sem mexer no catálogo
   * é o erro que o teste de cima pega — este diz de onde os números vieram.
   */
  it("os pesos do DISC e do SJT batem com a tabela do manual", () => {
    expect(SEGUNDOS_POR_BLOCO_DE_PALAVRAS * 12).toBe(
      CATALOGO_DE_TESTES.DISC.segundos,
    );
    expect(SEGUNDOS_POR_CENARIO * 8).toBe(CATALOGO_DE_TESTES.SJT.segundos);
  });

  it("respeita o piso, para não prometer curto demais", () => {
    expect(minutosDasPerguntas(afirmacoes(4), 6)).toBe(6);
    expect(minutosDasPerguntas([])).toBe(0);
  });

  it("cala a boca perto do fim, onde a contagem de telas já basta", () => {
    expect(rotuloDoRestante(afirmacoes(2))).toBeNull();
    expect(rotuloDoRestante([])).toBeNull();
  });

  it("arredonda para minutos redondos no meio da prova", () => {
    expect(rotuloDoRestante(afirmacoes(10))).toBe("cerca de 1 min");
    expect(
      rotuloDoRestante([...afirmacoes(20), ...Array(4).fill({ tipo: "ordenar" })]),
    ).toBe("cerca de 4 min");
  });

  it("tipo desconhecido não vira tempo negativo nem NaN", () => {
    // A lista vem do servidor, mas uma etapa nova mal cadastrada não pode
    // transformar o rodapé em "cerca de NaN min".
    const estranho = [{ tipo: "inventado" as never }];
    expect(segundosDasPerguntas(estranho)).toBe(0);
  });
});
