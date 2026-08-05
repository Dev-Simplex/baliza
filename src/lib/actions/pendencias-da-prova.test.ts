import { describe, expect, it } from "vitest";

import { pendenciasDaProva } from "./pendencias-da-prova";

const tudoVisivel = () => true;

function contar(entrada: Partial<Parameters<typeof pendenciasDaProva>[0]>) {
  return pendenciasDaProva({
    itensDaForma: [],
    cenariosDaForma: [],
    itensRespondidos: [],
    cenariosRespondidos: [],
    itemVisivel: tudoVisivel,
    cenarioVisivel: tudoVisivel,
    ...entrada,
  });
}

describe("pendências da prova", () => {
  it("prova completa não tem pendência", () => {
    const r = contar({
      itensDaForma: ["a", "b"],
      cenariosDaForma: ["c1"],
      itensRespondidos: ["a", "b"],
      cenariosRespondidos: ["c1"],
    });
    expect(r.total).toBe(0);
  });

  it("conta afirmação e situação na mesma medida", () => {
    const r = contar({
      itensDaForma: ["a", "b"],
      cenariosDaForma: ["c1", "c2"],
      itensRespondidos: ["a"],
      cenariosRespondidos: ["c1"],
    });
    expect(r.itens).toEqual(["b"]);
    expect(r.cenarios).toEqual(["c2"]);
    expect(r.total).toBe(2);
  });

  it("item aposentado do instrumento NÃO tranca a conclusão", () => {
    // O laço sem saída: a tela não desenha o item, a pessoa não tem como
    // respondê-lo, e a conclusão era recusada para sempre por causa dele.
    const r = contar({
      itensDaForma: ["a", "aposentado"],
      itensRespondidos: ["a"],
      itemVisivel: (id) => id !== "aposentado",
    });
    expect(r.total).toBe(0);
  });

  it("bloco de cenário aposentado também não tranca", () => {
    const r = contar({
      cenariosDaForma: ["c1", "sumiu"],
      cenariosRespondidos: ["c1"],
      cenarioVisivel: (id) => id !== "sumiu",
    });
    expect(r.total).toBe(0);
  });

  it("id repetido na forma conta uma pendência só", () => {
    const r = contar({ itensDaForma: ["a", "a"] });
    expect(r.itens).toEqual(["a"]);
    expect(r.total).toBe(1);
  });

  it("resposta de item que não está na forma não abate pendência", () => {
    const r = contar({
      itensDaForma: ["a"],
      itensRespondidos: ["intruso"],
    });
    expect(r.total).toBe(1);
  });
});
