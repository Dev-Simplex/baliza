import { describe, expect, it } from "vitest";

import { CATALOGO_DE_TESTES } from "./baterias";
import {
  ADJETIVOS_POR_BLOCO_DISC,
  AMPLITUDE_DO_LIQUIDO_DISC,
  BLOCOS_DISC,
  DIMENSOES_DISC,
  LIMIAR_DA_SECUNDARIA_DISC,
  LIQUIDO_MAXIMO_DISC,
  LIQUIDO_MINIMO_DISC,
  SOMA_ESPERADA_DOS_SCORES_DISC,
  TOLERANCIA_DA_SOMA_DISC,
  TOTAL_DE_BLOCOS_DISC,
  blocosParaCandidatoDisc,
  escoreDoLiquidoDisc,
  montarFormaDisc,
  paraResultadoDeModuloDisc,
  pontuarDisc,
  validarRespostasDisc,
  type DimensaoDisc,
  type RespostaDisc,
} from "./disc";

/**
 * Testes do DISC — manual §3.
 *
 * O gabarito é o exemplo resolvido do §3.5 (67/63/42/29, perfil D/I) e a
 * verificação de consistência do §3.4.
 */

// ─── Ajudantes ─────────────────────────────────────────────────────────────

/** Adjetivo de uma dimensão dentro de um bloco (índice 0..11). */
function adjetivo(bloco: number, dimensao: DimensaoDisc) {
  return BLOCOS_DISC[bloco].adjetivos.find((a) => a.dimensao === dimensao)!;
}

/**
 * Constrói as 12 respostas a partir dos pares [MAIS, MENOS] por bloco. Trabalhar
 * em dimensões (e não em ids) é o que deixa o caso de teste conferível contra a
 * tabela do §3.5.
 */
function responder(
  pares: Array<[DimensaoDisc, DimensaoDisc]>,
): RespostaDisc[] {
  return pares.map(([mais, menos], bloco) => ({
    blocoId: BLOCOS_DISC[bloco].id,
    maisId: adjetivo(bloco, mais).id,
    menosId: adjetivo(bloco, menos).id,
  }));
}

/** O candidato do §3.5: D 5/1 · I 4/1 · S 2/4 · C 1/6. */
const CANDIDATO_DO_MANUAL: Array<[DimensaoDisc, DimensaoDisc]> = [
  ["D", "C"],
  ["D", "C"],
  ["D", "C"],
  ["D", "C"],
  ["D", "S"],
  ["I", "C"],
  ["I", "C"],
  ["I", "S"],
  ["I", "S"],
  ["S", "D"],
  ["S", "I"],
  ["C", "S"],
];

// ─── Banco de blocos (§3.3) ────────────────────────────────────────────────

describe("banco de blocos do DISC", () => {
  it("tem 12 blocos de 4 adjetivos", () => {
    expect(TOTAL_DE_BLOCOS_DISC).toBe(12);
    for (const bloco of BLOCOS_DISC)
      expect(bloco.adjetivos.length, bloco.id).toBe(ADJETIVOS_POR_BLOCO_DISC);
  });

  it("cada bloco cobre as quatro dimensões, uma vez cada", () => {
    for (const bloco of BLOCOS_DISC) {
      const dimensoes = bloco.adjetivos.map((a) => a.dimensao).sort();
      expect(dimensoes, bloco.id).toEqual(["C", "D", "I", "S"]);
    }
  });

  it("não repete id nem texto de adjetivo em todo o banco", () => {
    const todos = BLOCOS_DISC.flatMap((b) => b.adjetivos);
    expect(todos.length).toBe(48);
    expect(new Set(todos.map((a) => a.id)).size).toBe(48);
    expect(new Set(todos.map((a) => a.texto)).size).toBe(48);
  });

  it("reproduz o primeiro e o último bloco do §3.3", () => {
    expect(BLOCOS_DISC[0].adjetivos.map((a) => a.texto)).toEqual([
      "Decidido",
      "Comunicativo",
      "Paciente",
      "Detalhista",
    ]);
    expect(BLOCOS_DISC[11].adjetivos.map((a) => a.texto)).toEqual([
      "Independente",
      "Convincente",
      "Previsível",
      "Perfeccionista",
    ]);
  });

  it("o id do adjetivo vem do texto, não da posição — não entrega a dimensão", () => {
    // Se o id fosse posicional (…-1, …-2), o primeiro seria sempre D.
    expect(adjetivo(0, "D").id).toBe("disc-b01-decidido");
    expect(adjetivo(8, "D").id).toBe("disc-b09-rapido-nas-decisoes");
    for (const bloco of BLOCOS_DISC)
      for (const a of bloco.adjetivos)
        expect(a.id.endsWith(`-${a.dimensao.toLowerCase()}`), a.id).toBe(false);
  });
});

// ─── Equações (§3.4) ───────────────────────────────────────────────────────

describe("equações do §3.4", () => {
  it("o líquido vai de −12 a +12, amplitude 24", () => {
    expect(LIQUIDO_MINIMO_DISC).toBe(-12);
    expect(LIQUIDO_MAXIMO_DISC).toBe(12);
    expect(AMPLITUDE_DO_LIQUIDO_DISC).toBe(24);
  });

  it("converte o líquido para 0–100 com o neutro em 50", () => {
    expect(escoreDoLiquidoDisc(-12)).toBe(0);
    expect(escoreDoLiquidoDisc(0)).toBe(50);
    expect(escoreDoLiquidoDisc(12)).toBe(100);
  });

  it("arredonda como o §3.5 (66,7 → 67 · 62,5 → 63 · 41,7 → 42 · 29,2 → 29)", () => {
    expect(escoreDoLiquidoDisc(4)).toBe(67);
    expect(escoreDoLiquidoDisc(3)).toBe(63);
    expect(escoreDoLiquidoDisc(-2)).toBe(42);
    expect(escoreDoLiquidoDisc(-5)).toBe(29);
  });

  it("o limiar da secundária é o ponto neutro (50)", () => {
    expect(LIMIAR_DA_SECUNDARIA_DISC).toBe(50);
    expect(SOMA_ESPERADA_DOS_SCORES_DISC).toBe(200);
  });
});

// ─── Exemplo resolvido do §3.5 ─────────────────────────────────────────────

describe("exemplo resolvido do §3.5", () => {
  const resultado = pontuarDisc(responder(CANDIDATO_DO_MANUAL));

  it("reproduz MAIS, MENOS e líquido da tabela", () => {
    expect(
      resultado.notas.map((n) => [n.dimensao, n.mais, n.menos, n.liquido]),
    ).toEqual([
      ["D", 5, 1, 4],
      ["I", 4, 1, 3],
      ["S", 2, 4, -2],
      ["C", 1, 6, -5],
    ]);
  });

  it("reproduz os scores 67 · 63 · 42 · 29", () => {
    expect(resultado.porDimensao).toEqual({ D: 67, I: 63, S: 42, C: 29 });
  });

  it("passa na verificação de consistência (MAIS 12 · MENOS 12 · líquidos 0 · scores ≈ 200)", () => {
    expect(resultado.conferencia.somaMais).toBe(12);
    expect(resultado.conferencia.somaMenos).toBe(12);
    expect(resultado.conferencia.somaLiquidos).toBe(0);
    expect(resultado.conferencia.somaScores).toBe(201); // o ±2 do manual
    expect(
      Math.abs(
        resultado.conferencia.somaScores - SOMA_ESPERADA_DOS_SCORES_DISC,
      ),
    ).toBeLessThanOrEqual(TOLERANCIA_DA_SOMA_DISC);
    expect(resultado.conferencia.ok).toBe(true);
  });

  it("classifica como perfil D/I (dominante D 67, secundária I 63 ≥ 50)", () => {
    expect(resultado.perfil).toEqual({
      dominante: "D",
      secundaria: "I",
      tipo: "composto",
      rotulo: "D/I",
    });
  });
});

// ─── Extremos e classificação ──────────────────────────────────────────────

describe("extremos", () => {
  it("uma dimensão em todos os MAIS e outra em todos os MENOS → 100 e 0", () => {
    const resultado = pontuarDisc(
      responder(Array(12).fill(["D", "C"]) as Array<[DimensaoDisc, DimensaoDisc]>),
    );

    expect(resultado.porDimensao).toEqual({ D: 100, I: 50, S: 50, C: 0 });
    expect(resultado.conferencia.somaScores).toBe(200);
    expect(resultado.conferencia.ok).toBe(true);
  });

  it("perfil puro: a segunda maior abaixo de 50 não vira secundária", () => {
    // MAIS sempre D; MENOS distribuído entre I, S e C → todas as outras < 50.
    const resultado = pontuarDisc(
      responder([
        ["D", "I"],
        ["D", "I"],
        ["D", "I"],
        ["D", "I"],
        ["D", "S"],
        ["D", "S"],
        ["D", "S"],
        ["D", "S"],
        ["D", "C"],
        ["D", "C"],
        ["D", "C"],
        ["D", "C"],
      ]),
    );

    expect(resultado.porDimensao).toEqual({ D: 100, I: 33, S: 33, C: 33 });
    expect(resultado.perfil).toEqual({
      dominante: "D",
      secundaria: null,
      tipo: "puro",
      rotulo: "D",
    });
  });

  it("empate na dominante desempata pelo maior nº de MAIS", () => {
    // D e I chegam ao mesmo líquido (+4), mas I foi escolhido MAIS 6 vezes
    // contra 5 de D → dominante I.
    const resultado = pontuarDisc(
      responder([
        ["D", "I"],
        ["D", "I"],
        ["D", "C"],
        ["D", "C"],
        ["D", "C"],
        ["I", "C"],
        ["I", "D"],
        ["I", "S"],
        ["I", "S"],
        ["I", "S"],
        ["I", "S"],
        ["S", "C"],
      ]),
    );

    expect(resultado.porDimensao).toEqual({ D: 67, I: 67, S: 38, C: 29 });
    expect(resultado.notas.find((n) => n.dimensao === "D")!.mais).toBe(5);
    expect(resultado.notas.find((n) => n.dimensao === "I")!.mais).toBe(6);
    expect(resultado.perfil).toEqual({
      dominante: "I",
      secundaria: "D",
      tipo: "composto",
      rotulo: "I/D",
    });
  });

  it("empate que persiste no nº de MAIS vira perfil equilibrado", () => {
    const resultado = pontuarDisc(
      responder([
        ["D", "S"],
        ["D", "S"],
        ["D", "S"],
        ["D", "C"],
        ["D", "C"],
        ["D", "C"],
        ["I", "S"],
        ["I", "S"],
        ["I", "S"],
        ["I", "C"],
        ["I", "C"],
        ["I", "C"],
      ]),
    );

    expect(resultado.porDimensao).toEqual({ D: 75, I: 75, S: 25, C: 25 });
    expect(resultado.perfil.tipo).toBe("equilibrado");
    expect(resultado.perfil.rotulo).toBe("D/I equilibrado");
  });

  it("a conferência do §3.4 fecha em qualquer resposta válida", () => {
    // 200 combinações determinísticas de MAIS/MENOS por bloco.
    for (let semente = 0; semente < 200; semente++) {
      const pares = BLOCOS_DISC.map((_, bloco) => {
        const mais = DIMENSOES_DISC[(semente + bloco) % 4];
        const menos = DIMENSOES_DISC[(semente * 3 + bloco * 2 + 1) % 4];
        return [mais, menos === mais ? DIMENSOES_DISC[(semente + bloco + 1) % 4] : menos] as [
          DimensaoDisc,
          DimensaoDisc,
        ];
      });

      const resultado = pontuarDisc(responder(pares));
      expect(resultado.conferencia.ok, `semente ${semente}`).toBe(true);
    }
  });
});

// ─── Casos inválidos ───────────────────────────────────────────────────────

describe("respostas inválidas", () => {
  const validas = responder(CANDIDATO_DO_MANUAL);

  it("acusa MAIS igual a MENOS no mesmo bloco (§3.2) e recusa pontuar", () => {
    const quebradas = validas.map((r, i) =>
      i === 3 ? { ...r, menosId: r.maisId } : r,
    );

    const violacoes = validarRespostasDisc(quebradas);
    expect(violacoes.map((v) => v.regra)).toContain("mais_igual_a_menos");
    expect(() => pontuarDisc(quebradas)).toThrow(/mais_igual_a_menos/);
  });

  it("acusa bloco sem resposta", () => {
    const faltando = validas.slice(0, 11);
    expect(validarRespostasDisc(faltando).map((v) => v.regra)).toContain(
      "bloco_sem_resposta",
    );
    expect(() => pontuarDisc(faltando)).toThrow(/bloco_sem_resposta/);
  });

  it("acusa bloco repetido", () => {
    const repetido = [...validas.slice(0, 11), validas[0]];
    expect(validarRespostasDisc(repetido).map((v) => v.regra)).toContain(
      "bloco_repetido",
    );
  });

  it("acusa adjetivo de outro bloco", () => {
    const trocado = validas.map((r, i) =>
      i === 0 ? { ...r, maisId: adjetivo(5, "I").id } : r,
    );
    expect(validarRespostasDisc(trocado).map((v) => v.regra)).toContain(
      "adjetivo_fora_do_bloco",
    );
  });

  it("acusa bloco que não é do banco", () => {
    const inventado = [
      ...validas,
      { blocoId: "disc-b99", maisId: "x", menosId: "y" },
    ];
    expect(validarRespostasDisc(inventado).map((v) => v.regra)).toContain(
      "bloco_desconhecido",
    );
  });

  it("prova completa e válida não gera violação", () => {
    expect(validarRespostasDisc(validas)).toEqual([]);
  });
});

// ─── Forma: embaralhamento determinístico ──────────────────────────────────

describe("forma do DISC", () => {
  it("a mesma semente reconstrói exatamente a mesma prova", () => {
    const a = montarFormaDisc("candidato-42");
    const b = montarFormaDisc("candidato-42");
    expect(a).toEqual(b);
  });

  it("sementes diferentes produzem provas diferentes", () => {
    const ordens = new Set(
      Array.from({ length: 10 }, (_, i) =>
        JSON.stringify(montarFormaDisc(`semente-${i}`)),
      ),
    );
    expect(ordens.size).toBe(10);
  });

  it("toda forma traz os 12 blocos e os 4 adjetivos de cada um", () => {
    for (let i = 0; i < 30; i++) {
      const forma = montarFormaDisc(`s${i}`);
      expect([...forma.blocos].sort()).toEqual(
        BLOCOS_DISC.map((b) => b.id).sort(),
      );

      for (const bloco of BLOCOS_DISC)
        expect([...forma.adjetivos[bloco.id]].sort()).toEqual(
          bloco.adjetivos.map((a) => a.id).sort(),
        );
    }
  });

  it("embaralha também os 4 adjetivos dentro do bloco (§3.3)", () => {
    // Se a ordem interna nunca mudasse, a primeira coluna seria sempre D.
    let mexeu = 0;
    for (let i = 0; i < 5; i++) {
      const forma = montarFormaDisc(`s${i}`);
      for (const bloco of BLOCOS_DISC) {
        const original = bloco.adjetivos.map((a) => a.id);
        if (forma.adjetivos[bloco.id].join(",") !== original.join(",")) mexeu++;
      }
    }
    expect(mexeu).toBeGreaterThan(50); // de 60 blocos observados
  });

  it("o candidato recebe só id e texto — a dimensão fica no servidor", () => {
    const forma = montarFormaDisc("candidato-42");
    const paraCandidato = blocosParaCandidatoDisc(forma);

    expect(paraCandidato.length).toBe(12);
    for (const bloco of paraCandidato) {
      expect(Object.keys(bloco).sort()).toEqual(["adjetivos", "id"]);
      expect(bloco.adjetivos.length).toBe(4);
      for (const a of bloco.adjetivos)
        expect(Object.keys(a).sort()).toEqual(["id", "texto"]);
    }

    expect(JSON.stringify(paraCandidato)).not.toContain("dimensao");
  });

  it("a ordem entregue ao candidato é a mesma da forma", () => {
    const forma = montarFormaDisc("candidato-42");
    const paraCandidato = blocosParaCandidatoDisc(forma);

    expect(paraCandidato.map((b) => b.id)).toEqual(forma.blocos);
    for (const bloco of paraCandidato)
      expect(bloco.adjetivos.map((a) => a.id)).toEqual(forma.adjetivos[bloco.id]);
  });
});

// ─── Ponte para `baterias.ts` ──────────────────────────────────────────────

describe("resultado gravado (contrato de baterias.ts)", () => {
  it("o catálogo promete as 12 telas que o banco entrega", () => {
    expect(CATALOGO_DE_TESTES.DISC.telas).toBe(TOTAL_DE_BLOCOS_DISC);
    expect(CATALOGO_DE_TESTES.DISC.temGabarito).toBe(false);
    // DISC mede estilo, não os cinco fatores — não alimenta a aderência.
    expect(CATALOGO_DE_TESTES.DISC.produzFatores).toBe(false);
  });

  it("grava scores, líquidos e o perfil do §3.5", () => {
    const modulo = paraResultadoDeModuloDisc(
      pontuarDisc(responder(CANDIDATO_DO_MANUAL)),
    );

    expect(modulo).toEqual({
      teste: "DISC",
      dimensoes: { D: 67, I: 63, S: 42, C: 29 },
      liquidos: { D: 4, I: 3, S: -2, C: -5 },
      dominante: "D",
      secundaria: "I",
      rotulo: "D/I",
    });
  });

  it("no perfil puro a secundária vai como null", () => {
    const modulo = paraResultadoDeModuloDisc(
      pontuarDisc(
        responder([
          ["D", "I"],
          ["D", "I"],
          ["D", "I"],
          ["D", "I"],
          ["D", "S"],
          ["D", "S"],
          ["D", "S"],
          ["D", "S"],
          ["D", "C"],
          ["D", "C"],
          ["D", "C"],
          ["D", "C"],
        ]),
      ),
    );

    expect(modulo.secundaria).toBeNull();
    expect(modulo.rotulo).toBe("D");
  });
});
