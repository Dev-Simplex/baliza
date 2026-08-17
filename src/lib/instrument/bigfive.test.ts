import { describe, expect, it } from "vitest";

import { CATALOGO_DE_TESTES } from "./baterias";
import {
  AMPLITUDE_DO_BRUTO_BIG_FIVE,
  BRUTO_MAXIMO_BIG_FIVE,
  BRUTO_MINIMO_BIG_FIVE,
  ESPELHO_DA_ESCALA,
  FATORES_BIG_FIVE,
  FATORES_EXIBIDOS_BIG_FIVE,
  ITENS_BIG_FIVE,
  ITENS_BIG_FIVE_POR_FATOR,
  ITENS_POR_FATOR_BIG_FIVE,
  ROTULOS_BIG_FIVE,
  TOTAL_DE_ITENS_BIG_FIVE,
  escoreDoBrutoBigFive,
  faixaBigFive,
  itensParaCandidatoBigFive,
  montarFormaBigFive,
  paraResultadoDeModuloBigFive,
  ordenarItensBigFive,
  pontuarBigFive,
  valorDoItemBigFive,
  validarRespostasBigFive,
  type FatorBigFive,
  type RespostasBigFive,
} from "./bigfive";

/**
 * Testes do Big Five (Mini-IPIP) — manual §2.
 *
 * O gabarito são os exemplos resolvidos do §2.5 e a ficha preenchida do §5.1.
 * Se a conta daqui divergir do manual, é a conta que está errada.
 */

// ─── Ajudantes ─────────────────────────────────────────────────────────────

/** Resposta neutra (3) em todos os 20 itens — bruto 12 em todo fator, score 50. */
function todosNeutros(): RespostasBigFive {
  return Object.fromEntries(ITENS_BIG_FIVE.map((i) => [i.id, 3]));
}

/** Mesma resposta crua nos 20 itens, como um candidato de padrão uniforme faria. */
function tudoIgual(valor: number): RespostasBigFive {
  return Object.fromEntries(ITENS_BIG_FIVE.map((i) => [i.id, valor]));
}

/**
 * Constrói as respostas CRUAS que produzem os VALORES pedidos (já invertidos)
 * nos 4 itens de cada fator, na ordem do banco. É o caminho inverso do passo 1
 * do §2.4 — útil para mirar um bruto exato.
 */
function respostasComValores(
  valores: Record<FatorBigFive, [number, number, number, number]>,
): RespostasBigFive {
  const respostas: RespostasBigFive = {};
  for (const fator of FATORES_BIG_FIVE) {
    ITENS_BIG_FIVE_POR_FATOR[fator].forEach((item, i) => {
      const valor = valores[fator][i];
      respostas[item.id] = item.reverso ? ESPELHO_DA_ESCALA - valor : valor;
    });
  }
  return respostas;
}

// ─── Banco de itens (§2.3) ─────────────────────────────────────────────────

describe("banco de itens do Big Five", () => {
  it("tem os 20 itens do §2.3, sem id nem texto repetido", () => {
    expect(TOTAL_DE_ITENS_BIG_FIVE).toBe(20);
    expect(new Set(ITENS_BIG_FIVE.map((i) => i.id)).size).toBe(20);
    expect(new Set(ITENS_BIG_FIVE.map((i) => i.texto)).size).toBe(20);
    expect(ITENS_BIG_FIVE.map((i) => i.numero)).toEqual(
      Array.from({ length: 20 }, (_, i) => i + 1),
    );
  });

  it("tem 4 itens por fator (§2.1)", () => {
    for (const fator of FATORES_BIG_FIVE)
      expect(ITENS_BIG_FIVE_POR_FATOR[fator].length, fator).toBe(
        ITENS_POR_FATOR_BIG_FIVE,
      );
  });

  it("reproduz o mapa por fator do §2.3, item a item, com as marcações (R)", () => {
    // "O = itens 5, 10R, 15R, 20R · C = 3, 8R, 13, 18R · E = 1, 6R, 11, 16R ·
    //  A = 2, 7R, 12, 17R · N = 4, 9R, 14, 19R"
    const mapa: Record<FatorBigFive, Array<[number, boolean]>> = {
      O: [
        [5, false],
        [10, true],
        [15, true],
        [20, true],
      ],
      C: [
        [3, false],
        [8, true],
        [13, false],
        [18, true],
      ],
      E: [
        [1, false],
        [6, true],
        [11, false],
        [16, true],
      ],
      A: [
        [2, false],
        [7, true],
        [12, false],
        [17, true],
      ],
      N: [
        [4, false],
        [9, true],
        [14, false],
        [19, true],
      ],
    };

    for (const fator of FATORES_BIG_FIVE) {
      const doFator = ITENS_BIG_FIVE_POR_FATOR[fator].map(
        (i) => [i.numero, i.reverso] as [number, boolean],
      );
      expect(doFator, `fator ${fator}`).toEqual(mapa[fator]);
    }
  });
});

// ─── Equações (§2.4) ───────────────────────────────────────────────────────

describe("equações do §2.4", () => {
  it("passo 1 — item invertido: resposta 5 vira valor 1 (§6.4)", () => {
    const invertido = ITENS_BIG_FIVE.find((i) => i.reverso)!;
    const direto = ITENS_BIG_FIVE.find((i) => !i.reverso)!;

    expect(valorDoItemBigFive(invertido, 5)).toBe(1);
    expect(valorDoItemBigFive(invertido, 4)).toBe(2);
    expect(valorDoItemBigFive(invertido, 3)).toBe(3);
    expect(valorDoItemBigFive(invertido, 1)).toBe(5);
    expect(valorDoItemBigFive(direto, 5)).toBe(5);
  });

  it("passo 3 — bruto 4 a 20 vira score 0 a 100", () => {
    expect(BRUTO_MINIMO_BIG_FIVE).toBe(4);
    expect(BRUTO_MAXIMO_BIG_FIVE).toBe(20);
    expect(AMPLITUDE_DO_BRUTO_BIG_FIVE).toBe(16);

    expect(escoreDoBrutoBigFive(4)).toBe(0);
    expect(escoreDoBrutoBigFive(12)).toBe(50);
    expect(escoreDoBrutoBigFive(20)).toBe(100);
  });

  it("arredonda meio para cima, como o manual (18,75 → 19; 62,5 → 63)", () => {
    expect(escoreDoBrutoBigFive(7)).toBe(19); // 18,75 — §2.5
    expect(escoreDoBrutoBigFive(14)).toBe(63); // 62,5
    expect(escoreDoBrutoBigFive(13)).toBe(56); // 56,25
    expect(escoreDoBrutoBigFive(15)).toBe(69); // 68,75
  });

  it("faixas do §2.6: 0–34 Baixo · 35–64 Moderado · 65–100 Alto", () => {
    expect(faixaBigFive(0).nome).toBe("baixo");
    expect(faixaBigFive(34).nome).toBe("baixo");
    expect(faixaBigFive(35).nome).toBe("moderado");
    expect(faixaBigFive(64).nome).toBe("moderado");
    expect(faixaBigFive(65).nome).toBe("alto");
    expect(faixaBigFive(100).nome).toBe("alto");
  });
});

// ─── Exemplo resolvido do §2.5 ─────────────────────────────────────────────

describe("exemplo resolvido do §2.5", () => {
  /**
   * Respostas CRUAS ditadas pelo manual, sem passar pelo ajudante — é a forma
   * mais fiel de conferir: item 1 = 4 · item 6 (R) = 2 · item 11 = 5 ·
   * item 16 (R) = 3; item 4 = 2 · item 9 (R) = 4 · item 14 = 1 · item 19 (R) = 4.
   */
  const respostas: RespostasBigFive = {
    ...todosNeutros(),
    bf01: 4,
    bf06: 2,
    bf11: 5,
    bf16: 3,
    bf04: 2,
    bf09: 4,
    bf14: 1,
    bf19: 4,
  };

  const resultado = pontuarBigFive(respostas);

  it("Extroversão: bruto 16 → score 75", () => {
    expect(resultado.brutos.E).toBe(16);
    expect(resultado.porChave.E).toBe(75);
  });

  it("Neuroticismo: bruto 7 → score 19 → Estabilidade Emocional 81", () => {
    expect(resultado.brutos.N).toBe(7);
    expect(resultado.escoresInternos.N).toBe(19);
    expect(resultado.porChave.EE).toBe(81);
  });

  it("as faixas saem do §2.6", () => {
    expect(resultado.notas.find((n) => n.chave === "E")!.faixa.rotulo).toBe(
      "Alto",
    );
    expect(resultado.notas.find((n) => n.chave === "EE")!.faixa.rotulo).toBe(
      "Alto",
    );
  });
});

describe("ficha preenchida do §5.1 (candidata Maria)", () => {
  // Brutos que produzem O 56 · C 63 · E 75 · A 69 · EE 81.
  const resultado = pontuarBigFive(
    respostasComValores({
      O: [4, 3, 3, 3], // bruto 13 → 56
      C: [4, 4, 3, 3], // bruto 14 → 63
      E: [4, 4, 5, 3], // bruto 16 → 75 (o mesmo do §2.5)
      A: [4, 4, 4, 3], // bruto 15 → 69
      N: [2, 2, 1, 2], // bruto  7 → 19 → EE 81 (o mesmo do §2.5)
    }),
  );

  it("reproduz os cinco números da ficha", () => {
    expect(resultado.porChave).toEqual({
      O: 56,
      C: 63,
      E: 75,
      A: 69,
      EE: 81,
    });
  });

  it("reproduz as faixas da ficha (Moderado, Moderado, Alto, Alto, Alto)", () => {
    expect(resultado.notas.map((n) => n.faixa.rotulo)).toEqual([
      "Moderado",
      "Moderado",
      "Alto",
      "Alto",
      "Alto",
    ]);
  });
});

// ─── Extremos ──────────────────────────────────────────────────────────────

describe("extremos", () => {
  it("todo item no valor mínimo → 0 em tudo, e EE 100", () => {
    const resultado = pontuarBigFive(
      respostasComValores({
        O: [1, 1, 1, 1],
        C: [1, 1, 1, 1],
        E: [1, 1, 1, 1],
        A: [1, 1, 1, 1],
        N: [1, 1, 1, 1],
      }),
    );

    for (const fator of FATORES_BIG_FIVE) expect(resultado.brutos[fator]).toBe(4);
    expect(resultado.porChave).toEqual({ O: 0, C: 0, E: 0, A: 0, EE: 100 });
  });

  it("todo item no valor máximo → 100 em tudo, e EE 0", () => {
    const resultado = pontuarBigFive(
      respostasComValores({
        O: [5, 5, 5, 5],
        C: [5, 5, 5, 5],
        E: [5, 5, 5, 5],
        A: [5, 5, 5, 5],
        N: [5, 5, 5, 5],
      }),
    );

    for (const fator of FATORES_BIG_FIVE)
      expect(resultado.brutos[fator]).toBe(20);
    expect(resultado.porChave).toEqual({ O: 100, C: 100, E: 100, A: 100, EE: 0 });
  });

  it("padrão uniforme (a mesma resposta nos 20 itens) NÃO satura a escala", () => {
    // A inversão é justamente o que impede "marcar tudo 5" de virar 100. O que
    // sobra é o desbalanço do banco: O tem 3 invertidos de 4, os outros 2 de 4.
    expect(pontuarBigFive(tudoIgual(3)).porChave).toEqual({
      O: 50,
      C: 50,
      E: 50,
      A: 50,
      EE: 50,
    });

    expect(pontuarBigFive(tudoIgual(1)).porChave).toEqual({
      O: 75,
      C: 50,
      E: 50,
      A: 50,
      EE: 50,
    });

    expect(pontuarBigFive(tudoIgual(5)).porChave).toEqual({
      O: 25,
      C: 50,
      E: 50,
      A: 50,
      EE: 50,
    });
  });
});

// ─── Casos inválidos ───────────────────────────────────────────────────────

describe("respostas inválidas", () => {
  it("acusa item sem resposta e recusa pontuar", () => {
    const respostas = todosNeutros();
    delete respostas.bf07;

    const violacoes = validarRespostasBigFive(respostas);
    expect(violacoes.map((v) => v.regra)).toContain("item_sem_resposta");
    expect(() => pontuarBigFive(respostas)).toThrow(/item_sem_resposta/);
  });

  it("acusa valor fora da escala 1–5", () => {
    for (const valor of [0, 6, -1, 2.5]) {
      const respostas = { ...todosNeutros(), bf01: valor };
      expect(
        validarRespostasBigFive(respostas).map((v) => v.regra),
        `valor ${valor}`,
      ).toContain("valor_fora_da_escala");
      expect(() => pontuarBigFive(respostas)).toThrow();
    }
  });

  it("acusa item que não é do banco", () => {
    const respostas = { ...todosNeutros(), bf99: 3 };
    expect(validarRespostasBigFive(respostas).map((v) => v.regra)).toContain(
      "item_desconhecido",
    );
  });

  it("prova completa e válida não gera violação", () => {
    expect(validarRespostasBigFive(todosNeutros())).toEqual([]);
  });
});

// ─── "Neuroticismo" nunca sai (§2.4 e §6.4) ────────────────────────────────

describe("rótulo de Neuroticismo", () => {
  it("não existe chave N entre os fatores exibidos", () => {
    expect(FATORES_EXIBIDOS_BIG_FIVE).toEqual(["O", "C", "E", "A", "EE"]);
    expect(FATORES_EXIBIDOS_BIG_FIVE).not.toContain("N");
  });

  it("a palavra não aparece em nenhum rótulo nem no resultado exibível", () => {
    const rotulos = JSON.stringify(ROTULOS_BIG_FIVE);
    expect(rotulos.toLowerCase()).not.toContain("neurotic");
    expect(ROTULOS_BIG_FIVE.EE.rotulo).toBe("Estabilidade Emocional");

    const notas = JSON.stringify(pontuarBigFive(todosNeutros()).notas);
    expect(notas.toLowerCase()).not.toContain("neurotic");
  });
});

// ─── Forma: embaralhamento determinístico ──────────────────────────────────

describe("forma do Big Five", () => {
  it("a mesma semente reconstrói exatamente a mesma prova", () => {
    const a = montarFormaBigFive("candidato-42");
    const b = montarFormaBigFive("candidato-42");
    expect(a.itens).toEqual(b.itens);
    // e nas duas chamadas seguidas, sem estado compartilhado escondido
    expect(ordenarItensBigFive("candidato-42")).toEqual(a.itens);
  });

  it("sementes diferentes produzem provas diferentes", () => {
    const ordens = new Set(
      Array.from({ length: 10 }, (_, i) =>
        montarFormaBigFive(`semente-${i}`).itens.join(","),
      ),
    );
    expect(ordens.size).toBeGreaterThan(1);
  });

  it("toda forma tem os 20 itens, sem repetir nem perder nenhum", () => {
    for (let i = 0; i < 50; i++) {
      const forma = montarFormaBigFive(`s${i}`);
      expect(forma.itens.length).toBe(20);
      expect(new Set(forma.itens).size).toBe(20);
      expect([...forma.itens].sort()).toEqual(
        ITENS_BIG_FIVE.map((it) => it.id).sort(),
      );
    }
  });

  it("nunca põe dois itens do mesmo fator em sequência", () => {
    for (let i = 0; i < 50; i++) {
      const forma = montarFormaBigFive(`s${i}`);
      const fatores = forma.itens.map(
        (id) => ITENS_BIG_FIVE.find((it) => it.id === id)!.fator,
      );
      for (let p = 1; p < fatores.length; p++)
        expect(fatores[p], `semente s${i}, posição ${p}`).not.toBe(
          fatores[p - 1],
        );
    }
  });

  it("o candidato recebe só id e texto — fator e inversão ficam no servidor", () => {
    const forma = montarFormaBigFive("candidato-42");
    const paraCandidato = itensParaCandidatoBigFive(forma);

    expect(paraCandidato.length).toBe(20);
    for (const item of paraCandidato)
      expect(Object.keys(item).sort()).toEqual(["id", "texto"]);

    const bruto = JSON.stringify(paraCandidato);
    expect(bruto).not.toContain("fator");
    expect(bruto).not.toContain("reverso");
  });
});

// ─── Ponte para `baterias.ts` ──────────────────────────────────────────────

describe("resultado gravado (contrato de baterias.ts)", () => {
  it("o catálogo promete as 20 telas que o banco entrega", () => {
    expect(CATALOGO_DE_TESTES.BIG_FIVE.telas).toBe(TOTAL_DE_ITENS_BIG_FIVE);
    expect(CATALOGO_DE_TESTES.BIG_FIVE.temGabarito).toBe(false);
    expect(CATALOGO_DE_TESTES.BIG_FIVE.produzFatores).toBe(true);
  });

  it("traduz o alfabeto do Mini-IPIP para o da Baliza (E→X, N→E)", () => {
    // Candidata do §5.1: O 56 · C 63 · E 75 · A 69 · EE 81.
    const apuracao = pontuarBigFive(
      respostasComValores({
        O: [4, 3, 3, 3],
        C: [4, 4, 3, 3],
        E: [4, 4, 5, 3],
        A: [4, 4, 4, 3],
        N: [2, 2, 1, 2],
      }),
    );

    const modulo = paraResultadoDeModuloBigFive(apuracao);

    expect(modulo.teste).toBe("BIG_FIVE");
    expect(modulo.fatores).toEqual({
      O: 56, // Abertura         → Abertura ao Novo
      C: 63, // Conscienciosidade → Organização e Entrega
      X: 75, // Extroversão      → Energia Social   (E do Mini-IPIP)
      A: 69, // Amabilidade      → Cooperação
      E: 81, // 100 − score_N    → Estabilidade sob Pressão
    });
  });

  it("grava o bruto do manual para permitir reconferir a conta", () => {
    const apuracao = pontuarBigFive(todosNeutros());
    expect(paraResultadoDeModuloBigFive(apuracao).brutos).toEqual({
      O: 12,
      C: 12,
      E: 12,
      A: 12,
      N: 12,
    });
  });

  it("o fator gravado como Estabilidade é sempre 100 − score_N", () => {
    for (const valor of [1, 2, 3, 4, 5]) {
      const apuracao = pontuarBigFive(tudoIgual(valor));
      expect(paraResultadoDeModuloBigFive(apuracao).fatores.E).toBe(
        100 - apuracao.escoresInternos.N,
      );
    }
  });
});
