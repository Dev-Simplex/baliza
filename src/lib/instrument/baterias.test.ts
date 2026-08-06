import { describe, expect, it } from "vitest";

import {
  BATERIA_PADRAO,
  CATALOGO_DE_TESTES,
  FATOR_PRUMO_DE_BIG_FIVE,
  TESTES,
  escoresParaFit,
  lerBateria,
  lerResultados,
  minutosDaBateria,
  normalizarBateria,
  produzFatores,
  telasDaBateria,
  validarBateria,
  type ResultadosPorModulo,
} from "./baterias";
import { CENARIOS_POR_PROVA, TOTAL_DE_ITENS, TOTAL_DE_TELAS } from "./form";
import {
  SEGUNDOS_POR_AFIRMACAO,
  SEGUNDOS_POR_SITUACAO,
} from "@/components/teste/tempo-estimado";
import { FATORES } from "./types";

const FATORES_NEUTROS = { C: 50, E: 50, X: 50, A: 50, O: 50 };

describe("catálogo", () => {
  /**
   * `baterias.ts` repete os números do Prumo em vez de importar `form.ts` —
   * importar arrastaria o banco de 128 itens para o pacote do navegador, e a
   * tela de seleção da vaga é componente de cliente. O preço da cópia é este
   * teste: se alguém mexer no tamanho da prova, os dois lados divergem aqui e
   * não em produção.
   */
  it("o Prumo do catálogo bate com a forma de verdade", () => {
    expect(CATALOGO_DE_TESTES.PRUMO.telas).toBe(TOTAL_DE_TELAS);
    expect(CATALOGO_DE_TESTES.PRUMO.segundos).toBe(
      TOTAL_DE_ITENS * SEGUNDOS_POR_AFIRMACAO +
        CENARIOS_POR_PROVA * SEGUNDOS_POR_SITUACAO,
    );
  });

  it("todo teste tem ficha, e a ficha é dele", () => {
    for (const teste of TESTES) {
      const ficha = CATALOGO_DE_TESTES[teste];
      expect(ficha.id).toBe(teste);
      expect(ficha.telas).toBeGreaterThan(0);
      expect(ficha.segundos).toBeGreaterThan(0);
    }
  });

  it("só o SJT tem gabarito", () => {
    const comGabarito = TESTES.filter((t) => CATALOGO_DE_TESTES[t].temGabarito);
    expect(comGabarito).toEqual(["SJT"]);
  });

  it("Prumo e Big Five são as únicas fontes dos cinco fatores", () => {
    const fontes = TESTES.filter((t) => CATALOGO_DE_TESTES[t].produzFatores);
    expect(fontes).toEqual(["PRUMO", "BIG_FIVE"]);
  });
});

describe("normalização", () => {
  it("põe na ordem de aplicação, não na ordem de clique", () => {
    expect(normalizarBateria(["SJT", "PRUMO", "DISC"])).toEqual([
      "PRUMO",
      "DISC",
      "SJT",
    ]);
  });

  it("elimina repetição e valor desconhecido", () => {
    expect(normalizarBateria(["DISC", "DISC", "MBTI", 7, null])).toEqual([
      "DISC",
    ]);
  });

  it("entrada vazia continua vazia — quem decide o erro é quem chamou", () => {
    expect(normalizarBateria([])).toEqual([]);
  });
});

describe("leitura do banco", () => {
  /**
   * A garantia que sustenta a migração: vaga e avaliação gravadas antes da
   * coluna existir se comportam como sempre se comportaram.
   */
  it("linha sem bateria vira Prumo", () => {
    expect(lerBateria(null)).toEqual(["PRUMO"]);
    expect(lerBateria(undefined)).toEqual(["PRUMO"]);
    expect(lerBateria([])).toEqual(["PRUMO"]);
    expect(lerBateria("PRUMO")).toEqual(["PRUMO"]);
  });

  it("lixo no meio não derruba o que dá para aproveitar", () => {
    expect(lerBateria(["DISC", "coisa"])).toEqual(["DISC"]);
  });

  it("o default do código é o mesmo do banco", () => {
    expect(BATERIA_PADRAO).toEqual(["PRUMO"]);
  });
});

describe("validação da escolha do recrutador", () => {
  it("recusa bateria vazia", () => {
    const r = validarBateria([]);
    expect(r.ok).toBe(false);
  });

  it("recusa bateria que só tem valor inválido — não vira Prumo por engano", () => {
    const r = validarBateria(["ENEAGRAMA"]);
    expect(r.ok).toBe(false);
  });

  it("aceita e normaliza", () => {
    const r = validarBateria(["SJT", "BIG_FIVE"]);
    expect(r).toEqual({ ok: true, bateria: ["BIG_FIVE", "SJT"] });
  });
});

describe("custo da bateria", () => {
  it("soma telas e tempo dos testes marcados", () => {
    expect(telasDaBateria(["BIG_FIVE", "DISC"])).toBe(32);
    expect(minutosDaBateria(["BIG_FIVE", "DISC"])).toBe(11);
  });

  it("bateria vazia não custa nada", () => {
    expect(telasDaBateria([])).toBe(0);
    expect(minutosDaBateria([])).toBe(0);
  });

  /** O manual (§1) promete ~20–25 min para os três dele juntos. */
  it("os três do manual cabem na promessa do manual", () => {
    const minutos = minutosDaBateria(["BIG_FIVE", "DISC", "SJT"]);
    expect(minutos).toBeGreaterThanOrEqual(20);
    expect(minutos).toBeLessThanOrEqual(25);
  });
});

describe("aderência", () => {
  it("Prumo ou Big Five ligam o ranking", () => {
    expect(produzFatores(["PRUMO"])).toBe(true);
    expect(produzFatores(["BIG_FIVE", "SJT"])).toBe(true);
  });

  /**
   * O caso que precisa continuar funcionando SEM inventar número: a vaga
   * existe, o candidato responde, e a resposta certa é "não há aderência".
   */
  it("DISC e SJT sozinhos não medem aderência", () => {
    expect(produzFatores(["DISC", "SJT"])).toBe(false);
    expect(escoresParaFit({ DISC: undefined, SJT: undefined })).toBeNull();
    expect(escoresParaFit({})).toBeNull();
  });

  it("com os dois na bateria, o Prumo é a fonte — não a média dos dois", () => {
    const resultados: ResultadosPorModulo = {
      PRUMO: { teste: "PRUMO", fatores: { ...FATORES_NEUTROS, C: 80 } },
      BIG_FIVE: {
        teste: "BIG_FIVE",
        fatores: { ...FATORES_NEUTROS, C: 20 },
        brutos: { O: 12, C: 7, E: 12, A: 12, N: 12 },
      },
    };
    const fonte = escoresParaFit(resultados);
    expect(fonte?.origem).toBe("PRUMO");
    expect(fonte?.escores.C).toBe(80);
  });

  it("só Big Five: ele vira a fonte", () => {
    const fonte = escoresParaFit({
      BIG_FIVE: {
        teste: "BIG_FIVE",
        fatores: { ...FATORES_NEUTROS, X: 75 },
        brutos: { O: 12, C: 12, E: 16, A: 12, N: 12 },
      },
    });
    expect(fonte?.origem).toBe("BIG_FIVE");
    expect(fonte?.escores.X).toBe(75);
  });
});

describe("mapa de fator do Big Five", () => {
  /**
   * As duas colisões que este mapa existe para evitar: `E` é Extroversão no
   * manual e Estabilidade no Prumo, e `N` não tem equivalente direto — vira
   * `E` (Estabilidade), invertido.
   */
  it("E do manual é X do Prumo; N do manual é E do Prumo", () => {
    expect(FATOR_PRUMO_DE_BIG_FIVE.E).toBe("X");
    expect(FATOR_PRUMO_DE_BIG_FIVE.N).toBe("E");
  });

  it("cobre os cinco fatores do Prumo, sem sobrar nem faltar", () => {
    const destinos = Object.values(FATOR_PRUMO_DE_BIG_FIVE);
    expect(new Set(destinos).size).toBe(5);
    for (const f of FATORES) expect(destinos).toContain(f);
  });
});

describe("leitura dos resultados por módulo", () => {
  it("JSON com forma errada vira nenhum módulo, em vez de estourar", () => {
    expect(lerResultados(null)).toEqual({});
    expect(lerResultados("{}")).toEqual({});
    expect(lerResultados([1, 2])).toEqual({});
    expect(lerResultados({ PRUMO: 7 })).toEqual({});
  });

  it("módulo com discriminante trocado é descartado", () => {
    expect(lerResultados({ DISC: { teste: "SJT", score: 10 } })).toEqual({});
  });

  it("mantém o que está bem formado", () => {
    const prumo = { teste: "PRUMO", fatores: FATORES_NEUTROS };
    expect(lerResultados({ PRUMO: prumo })).toEqual({ PRUMO: prumo });
  });
});
