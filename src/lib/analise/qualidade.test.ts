import { describe, expect, it } from "vitest";

import { ITENS_BIG_FIVE } from "@/lib/instrument/bigfive";

import {
  PARES_ESPELHADOS_BIG_FIVE,
  avaliarQualidade,
  divergenciaDoPar,
  seloDoBigFive,
} from "@/lib/analise/qualidade";

/**
 * Controle de qualidade do §6.3, conferido contra os gatilhos do manual.
 */

const numeroPorId = new Map(ITENS_BIG_FIVE.map((i) => [i.id, i.numero]));
const idDoItem = (numero: number) =>
  ITENS_BIG_FIVE.find((i) => i.numero === numero)!.id;

/** 20 respostas do Big Five, todas com o mesmo tempo, a partir do número do item. */
function respostasBigFive(
  valor: (numero: number) => number,
  tempoMs: number | null = 9000,
) {
  return ITENS_BIG_FIVE.map((item) => ({
    itemId: item.id,
    valor: valor(item.numero),
    tempoMs,
  }));
}

/**
 * O candidato que respondeu direito: concorda com o item direto e discorda do
 * gêmeo invertido. Nenhum dos três alertas dispara — é a linha de base contra a
 * qual os testes de gatilho se comparam.
 */
function respostasCoerentes(tempoMs: number | null = 9000) {
  return ITENS_BIG_FIVE.map((item) => ({
    itemId: item.id,
    valor: item.reverso ? 2 : 4,
    tempoMs,
  }));
}

describe("pares espelhados do §6.3", () => {
  it("são os cinco do manual — 1×16, 2×17, 3×18, 4×19, 5×20", () => {
    const pares = PARES_ESPELHADOS_BIG_FIVE.map(
      (p) => `${numeroPorId.get(p.direto.id)}×${numeroPorId.get(p.reverso.id)}`,
    ).sort();

    // O manual cita 2×17 e 5×20 como exemplo; a regra que os produz é o
    // primeiro item direto de cada fator contra o último invertido.
    expect(pares).toEqual(["1×16", "2×17", "3×18", "4×19", "5×20"]);
  });

  it("resposta coerente NÃO conta como divergência", () => {
    // Item 2 ("tenho empatia") = 5 e item 17 ("não me interesso") = 1 é a
    // mesma pessoa dizendo a mesma coisa duas vezes. A leitura literal de
    // "diferença ≥ 3 antes da inversão" acusaria justamente esse caso.
    expect(divergenciaDoPar(5, 1)).toBe(0);
    expect(divergenciaDoPar(4, 2)).toBe(0);
  });

  it("contradição de verdade conta", () => {
    // Concordar com os dois lados do espelho.
    expect(divergenciaDoPar(5, 5)).toBe(4);
    expect(divergenciaDoPar(1, 1)).toBe(4);
    expect(divergenciaDoPar(5, 4)).toBe(3);
  });
});

describe("prova respondida com atenção", () => {
  it("não levanta alerta nenhum", () => {
    const q = avaliarQualidade({ bigFive: respostasCoerentes() });

    expect(q.avaliavel).toBe(true);
    expect(q.alertas).toEqual([]);
  });
});

describe("alerta de respostas apressadas", () => {
  it("dispara abaixo de 2s medianos por tela", () => {
    const q = avaliarQualidade({ bigFive: respostasCoerentes(1200) });

    expect(q.alertas.map((a) => a.chave)).toEqual(["apressadas"]);
    expect(q.medidas.segundosPorItemBigFive).toBe(1.2);
  });

  it("não dispara em 2s exatos — o limiar é ABAIXO de 2", () => {
    const q = avaliarQualidade({ bigFive: respostasCoerentes(2000) });
    expect(q.alertas).toEqual([]);
  });

  it("também olha o DISC", () => {
    const q = avaliarQualidade({
      disc: Array.from({ length: 12 }, (_, i) => ({
        blocoId: `disc${i}`,
        tempoMs: 900,
      })),
    });

    expect(q.alertas.map((a) => a.chave)).toEqual(["apressadas"]);
    expect(q.alertas[0].detalhe).toContain("DISC");
  });

  it("sem cronômetro em respostas suficientes, não mede nem acusa", () => {
    const q = avaliarQualidade({ bigFive: respostasCoerentes(null) });

    expect(q.medidas.segundosPorItemBigFive).toBeNull();
    expect(q.alertas).toEqual([]);
    // Continua avaliável: os outros dois alertas não dependem de tempo.
    expect(q.avaliavel).toBe(true);
  });
});

describe("alerta de padrão uniforme", () => {
  it("dispara com 90% ou mais das respostas no mesmo valor", () => {
    // 18 de 20 = exatamente 90%.
    const q = avaliarQualidade({
      bigFive: respostasBigFive((n) => (n <= 18 ? 4 : 2)),
    });

    expect(q.alertas.map((a) => a.chave)).toContain("uniforme");
    expect(q.medidas.maiorProporcaoIgual).toBe(0.9);
  });

  it("não dispara com 17 de 20 (85%)", () => {
    const q = avaliarQualidade({
      bigFive: respostasBigFive((n) => (n <= 17 ? 4 : 2)),
    });

    expect(q.alertas.map((a) => a.chave)).not.toContain("uniforme");
  });
});

describe("alerta de inconsistência", () => {
  it("dispara com dois pares divergentes", () => {
    const contraditorio: Record<number, number> = {
      // 2×17 e 5×20 concordando dos dois lados do espelho.
      2: 5,
      17: 5,
      5: 5,
      20: 5,
    };
    const q = avaliarQualidade({
      bigFive: respostasBigFive((n) => contraditorio[n] ?? 3),
    });

    expect(q.alertas.map((a) => a.chave)).toContain("inconsistencia");
    expect(q.medidas.paresDivergentes).toBe(2);
    expect(q.medidas.paresConferidos).toBe(5);
  });

  it("não dispara com um par só", () => {
    const q = avaliarQualidade({
      bigFive: respostasBigFive((n) => (n === 2 || n === 17 ? 5 : 3)),
    });

    expect(q.alertas.map((a) => a.chave)).not.toContain("inconsistencia");
    expect(q.medidas.paresDivergentes).toBe(1);
  });

  it("ignora par com item sem resposta", () => {
    const q = avaliarQualidade({
      bigFive: respostasBigFive((n) => (n === 2 || n === 17 ? 5 : 3)).filter(
        (r) => r.itemId !== idDoItem(17),
      ),
    });

    expect(q.medidas.paresConferidos).toBe(4);
    expect(q.medidas.paresDivergentes).toBe(0);
  });
});

describe("prova sem resposta bruta", () => {
  it("é não-avaliável, e isso é diferente de sem alertas", () => {
    const q = avaliarQualidade({});

    expect(q.avaliavel).toBe(false);
    expect(q.alertas).toEqual([]);
  });
});

describe("selo de confiança do Big Five", () => {
  it("sem alerta chega no máximo a média — nunca a alta", () => {
    const selo = seloDoBigFive(avaliarQualidade({ bigFive: respostasCoerentes() }));

    expect(selo.selo).toBe("media");
    expect(selo.texto).toContain("Big Five");
  });

  it("com alerta cai para baixa e lista o que disparou", () => {
    const selo = seloDoBigFive(
      avaliarQualidade({ bigFive: respostasCoerentes(500) }),
    );

    expect(selo.selo).toBe("baixa");
    expect(selo.sinais).toEqual(["apressadas"]);
  });

  it("prova expurgada diz que não deu para conferir", () => {
    const selo = seloDoBigFive(avaliarQualidade({}));
    expect(selo.texto).toContain("apagadas");
  });
});
