import { describe, expect, it } from "vitest";

import {
  FATOR_PRUMO_DE_BIG_FIVE,
  type ResultadoBigFive,
  type ResultadoDisc,
  type ResultadoSjt,
} from "@/lib/instrument/baterias";
import { CENARIOS_SJT, COMPETENCIAS_SJT } from "@/lib/instrument/sjt";
import type { Fator } from "@/lib/instrument/types";

import {
  FATOR_PRUMO_DO_BIG_FIVE_EXIBIDO,
  montarBlocoBigFive,
  montarBlocoDisc,
  montarBlocoSjt,
  montarFichaDeModulos,
  perguntasDosModulos,
} from "@/lib/analise/ficha";
import { montarRoteiro } from "@/lib/analise/roteiro";

/**
 * A ficha do analista, conferida contra os EXEMPLOS RESOLVIDOS do manual.
 *
 * Os números daqui não foram calculados por este código: são os do manual
 * (§2.5, §3.5, §4.5) e da ficha preenchida do §5.2. É o mesmo critério do
 * checklist do §6.4 — a implementação prova que reproduz o manual, não que
 * reproduz a si mesma.
 */

// ─── O candidato-exemplo do manual (§5.2, ficha preenchida) ────────────────

/**
 * Big Five do exemplo: O 56 · C 63 · E 75 · A 69 · EE 81.
 *
 * Gravado como o módulo grava — na convenção da Baliza, com o N já invertido em
 * Estabilidade. Daí `E: 81` (Estabilidade) e `X: 75` (Extroversão).
 */
const BIG_FIVE_DO_MANUAL: ResultadoBigFive = {
  teste: "BIG_FIVE",
  fatores: { O: 56, C: 63, X: 75, A: 69, E: 81 },
  brutos: { O: 13, C: 14, E: 16, A: 15, N: 7 },
};

/** DISC do exemplo (§3.5): D 67 · I 63 · S 42 · C 29, perfil D/I. */
const DISC_DO_MANUAL: ResultadoDisc = {
  teste: "DISC",
  dimensoes: { D: 67, I: 63, S: 42, C: 29 },
  liquidos: { D: 4, I: 3, S: -2, C: -5 },
  dominante: "D",
  secundaria: "I",
  rotulo: "D/I",
};

/**
 * SJT do exemplo (§4.5): pontos 2,1,2,0,1,2,1,2 → 11/16 → 69.
 *
 * Um cenário por competência neste banco, então cada nota só pode ser 0, 50 ou
 * 100 — e o zero de Trabalho em equipe é o ponto inteiro do exemplo.
 */
const SJT_DO_MANUAL: ResultadoSjt = {
  teste: "SJT",
  score: 69,
  pontosObtidos: 11,
  pontosMaximos: 16,
  porCompetencia: [
    { competencia: "Foco no cliente", score: 100, cenarios: 1 },
    { competencia: "Responsabilidade", score: 50, cenarios: 1 },
    { competencia: "Organização e priorização", score: 100, cenarios: 1 },
    { competencia: "Trabalho em equipe", score: 0, cenarios: 1 },
    { competencia: "Integridade", score: 50, cenarios: 1 },
    { competencia: "Adaptabilidade", score: 100, cenarios: 1 },
    { competencia: "Comunicação", score: 50, cenarios: 1 },
    { competencia: "Proatividade", score: 100, cenarios: 1 },
  ],
  piores: [{ blocoId: "sjt-c04", competencia: "Trabalho em equipe" }],
};

// ─── Big Five ──────────────────────────────────────────────────────────────

describe("bloco do Big Five", () => {
  it("reproduz a ficha do §5.2 com os rótulos do manual", () => {
    const bloco = montarBlocoBigFive(BIG_FIVE_DO_MANUAL);

    expect(
      bloco.notas.map((n) => [n.chave, n.score, n.faixa.rotulo]),
    ).toEqual([
      ["O", 56, "Moderado"],
      ["C", 63, "Moderado"],
      ["E", 75, "Alto"],
      ["A", 69, "Alto"],
      ["EE", 81, "Alto"],
    ]);
  });

  it("chama a Extroversão de E e a Estabilidade de EE, sem trocar os números", () => {
    const bloco = montarBlocoBigFive(BIG_FIVE_DO_MANUAL);
    const porChave = new Map(bloco.notas.map((n) => [n.chave, n]));

    // A colisão que o alfabeto da Baliza cria: lá, `E` é Estabilidade.
    expect(porChave.get("E")?.rotulo).toBe("Extroversão");
    expect(porChave.get("E")?.score).toBe(75);
    expect(porChave.get("EE")?.rotulo).toBe("Estabilidade Emocional");
    expect(porChave.get("EE")?.score).toBe(81);
  });

  it("nunca escreve a palavra Neuroticismo", () => {
    const texto = JSON.stringify(montarBlocoBigFive(BIG_FIVE_DO_MANUAL));
    expect(texto.toLowerCase()).not.toContain("neurotic");
  });

  it("o mapa de volta é o inverso exato do mapa de ida", () => {
    // Se um dia o mapa de ida mudar, este teste cai antes de a ficha começar a
    // mostrar a Extroversão de alguém na linha da Estabilidade.
    for (const [bigFive, prumo] of Object.entries(FATOR_PRUMO_DE_BIG_FIVE)) {
      const exibido = bigFive === "N" ? "EE" : bigFive;
      expect(
        FATOR_PRUMO_DO_BIG_FIVE_EXIBIDO[
          exibido as keyof typeof FATOR_PRUMO_DO_BIG_FIVE_EXIBIDO
        ],
      ).toBe(prumo);
    }
  });
});

// ─── DISC ──────────────────────────────────────────────────────────────────

describe("bloco do DISC", () => {
  it("reproduz o §3.5: 67/63/42/29 e perfil D/I", () => {
    const bloco = montarBlocoDisc(DISC_DO_MANUAL);

    expect(bloco.dimensoes.map((d) => [d.dimensao, d.score])).toEqual([
      ["D", 67],
      ["I", 63],
      ["S", 42],
      ["C", 29],
    ]);
    expect(bloco.rotulo).toBe("D/I");
    expect(bloco.resumo).toBe("Conquista resultados através de pessoas");
  });

  it("mistura a leitura da dominante com a da secundária (§3.6 e §5.2)", () => {
    const bloco = montarBlocoDisc(DISC_DO_MANUAL);

    // O exemplo do §5.2 escreve "Fortes: decisão, comunicação" — o primeiro
    // ponto forte do D e o primeiro do I. É a regra que o código aplica.
    expect(bloco.fortes).toEqual([
      "Decisão rápida", // D
      "Comunicação", // I
      "Iniciativa", // D
    ]);

    // Em "Atenção" o manual escreve "detalhe, escuta", que são o TERCEIRO item
    // do I e o segundo do D — escolha editorial do exemplo, não regra. Aqui
    // vale a mesma regra dos fortes, e o que o teste garante é o que ela
    // promete: os dois lados do perfil aparecem, começando pela dominante.
    expect(bloco.atencao).toEqual([
      "Impaciência", // D
      "Dispersão", // I
      "Pouca escuta", // D
    ]);
  });

  it("perfil puro descreve só a dominante", () => {
    const bloco = montarBlocoDisc({
      ...DISC_DO_MANUAL,
      dimensoes: { D: 83, I: 42, S: 42, C: 33 },
      secundaria: null,
      rotulo: "D",
    });

    expect(bloco.resumo).toBe("Orientado a resultados e desafios");
    expect(bloco.fortes).toEqual([
      "Decisão rápida",
      "Iniciativa",
      "Foco em meta",
    ]);
  });
});

// ─── SJT ───────────────────────────────────────────────────────────────────

describe("bloco do SJT", () => {
  it("reproduz o §4.5: 11/16 → 69, com a abertura por competência", () => {
    const bloco = montarBlocoSjt(SJT_DO_MANUAL);

    expect(bloco.score).toBe(69);
    expect(bloco.pontosObtidos).toBe(11);
    expect(bloco.pontosMaximos).toBe(16);
    expect(bloco.faixa.rotulo).toBe("Adequado");

    expect(bloco.competencias.map((c) => [c.curto, c.score])).toEqual([
      ["Foco no cliente", 100],
      ["Responsabilidade", 50],
      ["Organização", 100],
      ["Equipe", 0],
      ["Integridade", 50],
      ["Adaptação", 100],
      ["Comunicação", 50],
      ["Proatividade", 100],
    ]);
  });

  it("marca o ⚠ só abaixo de 50 — 50 não é alerta (§5.2)", () => {
    const bloco = montarBlocoSjt(SJT_DO_MANUAL);
    const atencao = bloco.competencias.filter((c) => c.atencao);

    expect(atencao.map((c) => c.curto)).toEqual(["Equipe"]);
  });

  it("nomeia o cenário da escolha [0] como a ficha do §5.2 o cita", () => {
    const bloco = montarBlocoSjt(SJT_DO_MANUAL);

    expect(bloco.piores).toEqual([
      { titulo: "Conflito com colega", competencia: "Trabalho em equipe" },
    ]);
  });

  it("não carrega o gabarito para a ficha", () => {
    // O que a ficha pode dizer é QUANTO a pessoa fez (11 de 16, §4.4). O que
    // ela não pode mostrar é qual alternativa valia quanto: o banco de cenários
    // é reutilizado entre processos e expor o gabarito o queima (§4.2).
    const texto = JSON.stringify(montarBlocoSjt(SJT_DO_MANUAL));

    for (const cenario of CENARIOS_SJT)
      for (const alternativa of cenario.alternativas)
        expect(texto).not.toContain(alternativa.texto);

    expect(texto).not.toContain("alternativas");
  });
});

// ─── §5.3: os pontos fracos viram pergunta ─────────────────────────────────

describe("perguntas sugeridas (§5.3)", () => {
  const ficha = montarFichaDeModulos({
    BIG_FIVE: BIG_FIVE_DO_MANUAL,
    DISC: DISC_DO_MANUAL,
    SJT: SJT_DO_MANUAL,
  });

  it("gera as duas perguntas da ficha preenchida do §5.2", () => {
    const perguntas = perguntasDosModulos(ficha);

    // 1. "Conte uma situação real de conflito com um colega…" (SJT: Equipe 0)
    expect(perguntas[0].pergunta).toContain("conflito com um colega");
    expect(perguntas[0].obrigatoria).toBe(true);
    expect(perguntas[0].motivo).toContain("Conflito com colega");

    // 2. "Me dê um exemplo de trabalho detalhista…" (DISC: C 29)
    const detalhista = perguntas.find((p) =>
      p.pergunta.includes("trabalho detalhista"),
    );
    expect(detalhista).toBeDefined();
    expect(detalhista?.origem).toBe("DISC");
  });

  it("não repete a pergunta quando a competência é zero E está abaixo do limiar", () => {
    const perguntas = perguntasDosModulos(ficha);
    const equipe = perguntas.filter((p) =>
      p.pergunta.includes("conflito com um colega"),
    );
    expect(equipe).toHaveLength(1);
  });

  it("respeita o peso 0 da vaga para fator do Big Five em faixa Baixa", () => {
    const baixo = montarFichaDeModulos({
      BIG_FIVE: {
        ...BIG_FIVE_DO_MANUAL,
        // Energia Social (X) em 20 — faixa Baixa.
        fatores: { ...BIG_FIVE_DO_MANUAL.fatores, X: 20 },
      },
    });

    const comPeso = perguntasDosModulos(baixo, { pesoDoFator: () => 3 });
    const semPeso = perguntasDosModulos(baixo, {
      pesoDoFator: (f: Fator) => (f === "X" ? 0 : 3),
    });

    expect(comPeso).toHaveLength(1);
    expect(semPeso).toHaveLength(0);
  });

  it("a escolha [0] nunca é cortada pelo teto do roteiro (§4.6)", () => {
    // Oito zeros: mais que o teto de sete perguntas do roteiro.
    const oitoZeros = montarFichaDeModulos({
      SJT: {
        ...SJT_DO_MANUAL,
        score: 0,
        pontosObtidos: 0,
        porCompetencia: SJT_DO_MANUAL.porCompetencia.map((c) => ({
          ...c,
          score: 0,
        })),
        piores: Object.values(COMPETENCIAS_SJT).map((c, i) => ({
          blocoId: `sjt-c0${i + 1}`,
          competencia: c.rotulo,
        })),
      },
    });

    const roteiro = montarRoteiro({
      contribuicoes: [],
      sinaisDeConfianca: [],
      arquetipoId: null,
      perguntasDeModulo: perguntasDosModulos(oitoZeros),
      semAderencia: true,
    });

    expect(roteiro.perguntas.filter((p) => p.obrigatoria)).toHaveLength(8);
    expect(roteiro.resumoDoGap).toContain("não mede os cinco fatores");
  });

  it("bateria sem módulo do manual não gera pergunta nenhuma", () => {
    expect(perguntasDosModulos(montarFichaDeModulos({}))).toEqual([]);
    expect(montarFichaDeModulos({}).temAlgum).toBe(false);
  });

  it("resultado só da Baliza não vira ficha de módulo", () => {
    const ficha = montarFichaDeModulos({
      PRUMO: { teste: "PRUMO", fatores: { C: 70, E: 60, X: 55, A: 50, O: 45 } },
    });

    expect(ficha.temAlgum).toBe(false);
    expect(ficha.bigFive).toBeNull();
    expect(ficha.disc).toBeNull();
    expect(ficha.sjt).toBeNull();
  });
});
