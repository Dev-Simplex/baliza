import { describe, expect, it } from "vitest";

import { CENARIOS_POR_PROVA, TOTAL_DE_ITENS } from "@/lib/instrument/form";

import {
  minutosEstimados,
  rotuloDoRestante,
  segundosEstimados,
} from "./tempo-estimado";

describe("tempo estimado", () => {
  it("a prova cheia bate com os ~6 minutos que o produto promete", () => {
    // Lê a forma real em vez de repetir números: encurtar a prova sem revisar a
    // promessa é exatamente o erro que este teste existe para pegar. A página
    // inicial, o FAQ, a `<meta>` de compartilhamento e a tela de acesso todos
    // dizem "seis minutos" — se este teste cair, é lá que precisa mudar junto.
    expect(minutosEstimados(TOTAL_DE_ITENS, CENARIOS_POR_PROVA)).toBe(5);

    // O que o candidato vê na abertura passa pelo piso de 6, que arredonda a
    // promessa para cima de propósito: prometer 5 e levar 6 irrita, o contrário
    // não.
    expect(minutosEstimados(TOTAL_DE_ITENS, CENARIOS_POR_PROVA, 6)).toBe(6);
  });

  it("respeita o piso, para não prometer curto demais", () => {
    expect(minutosEstimados(4, 0, 6)).toBe(6);
    expect(minutosEstimados(0, 0)).toBe(0);
  });

  it("cala a boca perto do fim, onde a contagem de telas já basta", () => {
    expect(rotuloDoRestante(2, 0)).toBeNull();
    expect(rotuloDoRestante(0, 0)).toBeNull();
  });

  it("arredonda para minutos redondos no meio da prova", () => {
    expect(rotuloDoRestante(10, 0)).toBe("cerca de 1 min");
    expect(rotuloDoRestante(20, 4)).toBe("cerca de 4 min");
  });

  it("não deixa contagem negativa virar tempo negativo", () => {
    expect(segundosEstimados(-3, -1)).toBe(0);
  });
});
