import { describe, expect, it } from "vitest";

import { CATALOGO_DE_TESTES } from "./baterias";
import {
  ALTERNATIVAS_POR_CENARIO_SJT,
  CENARIOS_POR_PROCESSO_SJT,
  CENARIOS_SJT,
  COMPETENCIAS_SJT,
  DISTRIBUICAO_DE_PONTOS_SJT,
  MAXIMO_DE_CENARIOS_SJT,
  MINIMO_DE_CENARIOS_SJT,
  PONTOS_DA_MELHOR_SJT,
  cenariosParaCandidatoSjt,
  escoreSjt,
  faixaSjt,
  montarFormaSjt,
  paraResultadoDeModuloSjt,
  pontuarSjt,
  validarRespostasSjt,
  type PontosSjt,
  type RespostaSjt,
} from "./sjt";

/**
 * Testes do SJT — manual §4.
 *
 * O gabarito é o exemplo resolvido do §4.5 (score 69 e a abertura por
 * competência) e as regras de montagem do §4.2.
 */

// ─── Ajudantes ─────────────────────────────────────────────────────────────

/**
 * Escolhe, em cada cenário, a primeira alternativa que vale os pontos pedidos.
 * Trabalhar em PONTOS (e não em ids) é o que deixa o caso conferível contra o
 * §4.5, que descreve o candidato por "pontos obtidos por cenário".
 */
function responderComPontos(pontos: number[]): RespostaSjt[] {
  return pontos.map((valor, indice) => {
    const cenario = CENARIOS_SJT[indice];
    const alternativa = cenario.alternativas.find((a) => a.pontos === valor)!;
    return { cenarioId: cenario.id, alternativaId: alternativa.id };
  });
}

// ─── Banco de cenários (§4.3) e regras de montagem (§4.2) ──────────────────

describe("banco de cenários do SJT", () => {
  it("tem 8 cenários, cada um com 4 alternativas", () => {
    expect(CENARIOS_SJT.length).toBe(CENARIOS_POR_PROCESSO_SJT);
    expect(CENARIOS_SJT.length).toBe(8);
    for (const cenario of CENARIOS_SJT)
      expect(cenario.alternativas.length, cenario.id).toBe(
        ALTERNATIVAS_POR_CENARIO_SJT,
      );
  });

  it("cada cenário distribui exatamente {2, 1, 1, 0} pontos (§4.2 e §6.4)", () => {
    for (const cenario of CENARIOS_SJT) {
      const pontos = cenario.alternativas.map((a) => a.pontos).sort();
      expect(pontos, cenario.id).toEqual([0, 1, 1, 2]);
    }
    expect([...DISTRIBUICAO_DE_PONTOS_SJT]).toEqual([2, 1, 1, 0]);
    expect(PONTOS_DA_MELHOR_SJT).toBe(2);
  });

  it("cada cenário tem uma competência, e as 8 são distintas", () => {
    const competencias = CENARIOS_SJT.map((c) => c.competencia);
    expect(new Set(competencias).size).toBe(8);
    expect(new Set(Object.keys(COMPETENCIAS_SJT))).toEqual(
      new Set(competencias),
    );
  });

  it("não repete id nem texto de alternativa", () => {
    const todas = CENARIOS_SJT.flatMap((c) => c.alternativas);
    expect(todas.length).toBe(32);
    expect(new Set(todas.map((a) => a.id)).size).toBe(32);
    expect(new Set(todas.map((a) => a.texto)).size).toBe(32);
  });

  it("a letra do id não corresponde sempre à mesma pontuação", () => {
    // Se os ids seguissem a ordem didática do banco, "…-d" seria sempre a
    // alternativa de 0 ponto e o id entregaria o gabarito.
    const porLetra = new Map<string, Set<PontosSjt>>();
    for (const cenario of CENARIOS_SJT)
      for (const a of cenario.alternativas) {
        const letra = a.id.slice(-1);
        porLetra.set(letra, (porLetra.get(letra) ?? new Set()).add(a.pontos));
      }

    expect(porLetra.size).toBe(4);
    for (const [letra, pontos] of porLetra)
      expect(pontos.size, `letra ${letra}`).toBeGreaterThan(1);
  });

  it("reproduz o cenário 1 do §4.3", () => {
    const cenario = CENARIOS_SJT[0];
    expect(cenario.titulo).toBe("Cliente insatisfeito");
    expect(cenario.competencia).toBe("foco_no_cliente");
    expect(cenario.situacao).toContain("Um cliente liga irritado");
    expect(cenario.alternativas.find((a) => a.pontos === 2)!.texto).toContain(
      "peço desculpas em nome da empresa",
    );
    expect(cenario.alternativas.find((a) => a.pontos === 0)!.texto).toContain(
      "não foi culpa do meu setor",
    );
  });
});

// ─── Equações (§4.4) ───────────────────────────────────────────────────────

describe("equações do §4.4", () => {
  it("score = (obtidos / (2 × cenários)) × 100", () => {
    expect(escoreSjt(0, 8)).toBe(0);
    expect(escoreSjt(8, 8)).toBe(50);
    expect(escoreSjt(16, 8)).toBe(100);
    expect(escoreSjt(6, 6)).toBe(50);
    expect(escoreSjt(12, 6)).toBe(100);
  });

  it("arredonda como o §4.5 (68,75 → 69)", () => {
    expect(escoreSjt(11, 8)).toBe(69);
  });

  it("faixas do §4.6: 0–49 · 50–74 · 75–100", () => {
    expect(faixaSjt(0).nome).toBe("divergente");
    expect(faixaSjt(49).nome).toBe("divergente");
    expect(faixaSjt(50).nome).toBe("adequado");
    expect(faixaSjt(69).nome).toBe("adequado");
    expect(faixaSjt(74).nome).toBe("adequado");
    expect(faixaSjt(75).nome).toBe("consistente");
    expect(faixaSjt(100).nome).toBe("consistente");
  });
});

// ─── Exemplo resolvido do §4.5 ─────────────────────────────────────────────

describe("exemplo resolvido do §4.5", () => {
  // "pontos obtidos por cenário: 2, 1, 2, 0, 1, 2, 1, 2"
  const resultado = pontuarSjt(responderComPontos([2, 1, 2, 0, 1, 2, 1, 2]));

  it("obtidos 11 de 16 → score 69", () => {
    expect(resultado.obtidos).toBe(11);
    expect(resultado.maximos).toBe(16);
    expect(resultado.score).toBe(69);
    expect(resultado.faixa.nome).toBe("adequado");
  });

  it("reproduz a abertura por competência do manual", () => {
    const porCompetencia = Object.fromEntries(
      resultado.porCompetencia.map((n) => [n.competencia, n.score]),
    );

    expect(porCompetencia).toEqual({
      foco_no_cliente: 100,
      responsabilidade: 50,
      organizacao: 100,
      trabalho_em_equipe: 0,
      integridade: 50,
      adaptabilidade: 100,
      comunicacao: 50,
      proatividade: 100,
    });
  });

  it("marca a alternativa [0] do cenário Conflito com colega (§4.6 e §5.2)", () => {
    expect(resultado.pioresEscolhas).toEqual([
      {
        cenarioId: "sjt-c04",
        titulo: "Conflito com colega",
        competencia: "trabalho_em_equipe",
        rotulo: "Trabalho em equipe",
      },
    ]);
  });

  it("o score geral esconde o zero — é o ponto do §4.5", () => {
    expect(resultado.score).toBeGreaterThan(50);
    expect(
      resultado.porCompetencia.find(
        (n) => n.competencia === "trabalho_em_equipe",
      )!.score,
    ).toBe(0);
  });
});

// ─── Extremos ──────────────────────────────────────────────────────────────

describe("extremos", () => {
  it("a melhor alternativa em tudo → 100, sem gatilho de entrevista", () => {
    const resultado = pontuarSjt(responderComPontos(Array(8).fill(2)));
    expect(resultado.obtidos).toBe(16);
    expect(resultado.score).toBe(100);
    expect(resultado.faixa.nome).toBe("consistente");
    expect(resultado.pioresEscolhas).toEqual([]);
    for (const nota of resultado.porCompetencia) expect(nota.score).toBe(100);
  });

  it("a pior alternativa em tudo → 0, e as 8 competências viram gatilho", () => {
    const resultado = pontuarSjt(responderComPontos(Array(8).fill(0)));
    expect(resultado.obtidos).toBe(0);
    expect(resultado.score).toBe(0);
    expect(resultado.faixa.nome).toBe("divergente");
    expect(resultado.pioresEscolhas.length).toBe(8);
    for (const nota of resultado.porCompetencia) expect(nota.score).toBe(0);
  });

  it("só alternativas aceitáveis → 50 em tudo", () => {
    const resultado = pontuarSjt(responderComPontos(Array(8).fill(1)));
    expect(resultado.obtidos).toBe(8);
    expect(resultado.score).toBe(50);
    for (const nota of resultado.porCompetencia) expect(nota.score).toBe(50);
  });

  it("o denominador vem dos cenários APLICADOS, não do tamanho do banco", () => {
    // Processo de 6 cenários (§4.2 permite 6 a 10).
    const resultado = pontuarSjt(
      responderComPontos([2, 1, 2, 0, 1, 2]).slice(0, 6),
    );
    expect(resultado.maximos).toBe(12);
    expect(resultado.obtidos).toBe(8);
    expect(resultado.score).toBe(67); // 66,67 → 67
    expect(resultado.porCompetencia.length).toBe(6);
  });
});

// ─── Casos inválidos ───────────────────────────────────────────────────────

describe("respostas inválidas", () => {
  const validas = responderComPontos([2, 1, 2, 0, 1, 2, 1, 2]);

  it("acusa menos cenários que o mínimo do §4.2", () => {
    const poucas = validas.slice(0, MINIMO_DE_CENARIOS_SJT - 1);
    expect(validarRespostasSjt(poucas).map((v) => v.regra)).toContain(
      "cenarios_de_menos",
    );
    expect(() => pontuarSjt(poucas)).toThrow(/cenarios_de_menos/);
  });

  it("acusa cenário repetido", () => {
    const repetido = [...validas, validas[0]];
    expect(validarRespostasSjt(repetido).map((v) => v.regra)).toContain(
      "cenario_repetido",
    );
    expect(() => pontuarSjt(repetido)).toThrow(/cenario_repetido/);
  });

  it("acusa alternativa de outro cenário", () => {
    const trocada = validas.map((r, i) =>
      i === 0 ? { ...r, alternativaId: CENARIOS_SJT[3].alternativas[0].id } : r,
    );
    expect(validarRespostasSjt(trocada).map((v) => v.regra)).toContain(
      "alternativa_fora_do_cenario",
    );
  });

  it("acusa cenário que não é do banco", () => {
    const inventado = [
      ...validas,
      { cenarioId: "sjt-c99", alternativaId: "sjt-c99-a" },
    ];
    expect(validarRespostasSjt(inventado).map((v) => v.regra)).toContain(
      "cenario_desconhecido",
    );
  });

  it("prova completa e válida não gera violação", () => {
    expect(validarRespostasSjt(validas)).toEqual([]);
  });
});

// ─── Forma: embaralhamento determinístico ──────────────────────────────────

describe("forma do SJT", () => {
  it("a mesma semente reconstrói exatamente a mesma prova", () => {
    expect(montarFormaSjt("candidato-42")).toEqual(
      montarFormaSjt("candidato-42"),
    );
  });

  it("sementes diferentes produzem provas diferentes", () => {
    const formas = new Set(
      Array.from({ length: 10 }, (_, i) =>
        JSON.stringify(montarFormaSjt(`semente-${i}`)),
      ),
    );
    expect(formas.size).toBe(10);
  });

  it("aplica 8 cenários por padrão, com as 4 alternativas de cada", () => {
    for (let i = 0; i < 30; i++) {
      const forma = montarFormaSjt(`s${i}`);
      expect(forma.cenarios.length).toBe(8);
      expect([...forma.cenarios].sort()).toEqual(
        CENARIOS_SJT.map((c) => c.id).sort(),
      );

      for (const cenario of CENARIOS_SJT)
        expect([...forma.alternativas[cenario.id]].sort()).toEqual(
          cenario.alternativas.map((a) => a.id).sort(),
        );
    }
  });

  it("respeita a faixa de 6 a 10 cenários do §4.2", () => {
    expect(montarFormaSjt("s", 6).cenarios.length).toBe(6);
    expect(montarFormaSjt("s", 1).cenarios.length).toBe(MINIMO_DE_CENARIOS_SJT);
    // O teto é o banco: 8 cenários, ainda que o máximo do manual seja 10.
    expect(montarFormaSjt("s", MAXIMO_DE_CENARIOS_SJT).cenarios.length).toBe(8);
  });

  it("embaralha as 4 alternativas (§4.2) — senão marcar a primeira dá 100", () => {
    let mexeu = 0;
    for (let i = 0; i < 5; i++) {
      const forma = montarFormaSjt(`s${i}`);
      for (const cenario of CENARIOS_SJT) {
        const didatica = cenario.alternativas.map((a) => a.id).join(",");
        if (forma.alternativas[cenario.id].join(",") !== didatica) mexeu++;
      }
    }
    expect(mexeu).toBeGreaterThan(35); // de 40 cenários observados
  });
});

// ─── O gabarito nunca sai (§4.2) ───────────────────────────────────────────

describe("o que o candidato recebe", () => {
  const forma = montarFormaSjt("candidato-42");
  const paraCandidato = cenariosParaCandidatoSjt(forma);

  it("traz só situação e alternativas — sem pontos, competência ou título", () => {
    expect(paraCandidato.length).toBe(8);
    for (const cenario of paraCandidato) {
      expect(Object.keys(cenario).sort()).toEqual([
        "alternativas",
        "id",
        "situacao",
      ]);
      expect(cenario.alternativas.length).toBe(4);
      for (const a of cenario.alternativas)
        expect(Object.keys(a).sort()).toEqual(["id", "texto"]);
    }
  });

  it("nem serializado o gabarito vaza", () => {
    const bruto = JSON.stringify(paraCandidato);
    expect(bruto).not.toContain("pontos");
    expect(bruto).not.toContain("competencia");
    expect(bruto).not.toContain("titulo");

    // Nem os títulos dos cenários, que anunciariam o tema e induziriam a
    // resposta socialmente desejável.
    for (const cenario of CENARIOS_SJT)
      expect(bruto, cenario.titulo).not.toContain(cenario.titulo);

    // Nem os nomes das competências.
    for (const nomes of Object.values(COMPETENCIAS_SJT))
      expect(bruto, nomes.rotulo).not.toContain(nomes.rotulo);
  });

  it("a ordem entregue ao candidato é a mesma da forma", () => {
    expect(paraCandidato.map((c) => c.id)).toEqual(forma.cenarios);
    for (const cenario of paraCandidato)
      expect(cenario.alternativas.map((a) => a.id)).toEqual(
        forma.alternativas[cenario.id],
      );
  });
});

// ─── Ponte para `baterias.ts` ──────────────────────────────────────────────

describe("resultado gravado (contrato de baterias.ts)", () => {
  it("o catálogo promete as 8 telas que o banco entrega, e é o único com gabarito", () => {
    expect(CATALOGO_DE_TESTES.SJT.telas).toBe(CENARIOS_SJT.length);
    expect(CATALOGO_DE_TESTES.SJT.temGabarito).toBe(true);
    expect(CATALOGO_DE_TESTES.SJT.produzFatores).toBe(false);
  });

  it("grava o score, a abertura por competência e as escolhas [0] do §4.5", () => {
    const modulo = paraResultadoDeModuloSjt(
      pontuarSjt(responderComPontos([2, 1, 2, 0, 1, 2, 1, 2])),
    );

    expect(modulo.teste).toBe("SJT");
    expect(modulo.score).toBe(69);
    expect(modulo.pontosObtidos).toBe(11);
    expect(modulo.pontosMaximos).toBe(16);

    expect(modulo.porCompetencia).toContainEqual({
      competencia: "Trabalho em equipe",
      score: 0,
      cenarios: 1,
    });
    expect(modulo.porCompetencia.length).toBe(8);

    expect(modulo.piores).toEqual([
      { blocoId: "sjt-c04", competencia: "Trabalho em equipe" },
    ]);
  });

  it("o gabarito não atravessa a fronteira da persistência", () => {
    const bruto = JSON.stringify(
      paraResultadoDeModuloSjt(
        pontuarSjt(responderComPontos([2, 1, 2, 0, 1, 2, 1, 2])),
      ),
    );

    // Nem os textos das alternativas, nem qual delas era a certa.
    for (const cenario of CENARIOS_SJT)
      for (const a of cenario.alternativas)
        expect(bruto).not.toContain(a.texto);
    expect(bruto).not.toContain("alternativa");
  });
});
