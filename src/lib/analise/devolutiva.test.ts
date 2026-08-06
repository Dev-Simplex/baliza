import { describe, expect, it } from "vitest";

import type {
  ResultadoBigFive,
  ResultadoDisc,
  ResultadoSjt,
} from "@/lib/instrument/baterias";

import { montarFichaDeModulos } from "@/lib/analise/ficha";
import { montarDevolutiva } from "@/lib/analise/devolutiva";

/**
 * A devolutiva do §5.1 — a ficha do CANDIDATO.
 *
 * Ela não está ligada a rota nenhuma neste produto (ver o cabeçalho de
 * `devolutiva.ts`). O teste existe pelos dois motivos que sobrevivem a isso: a
 * função é pública e pode ser ligada um dia, e é aqui que ficam registradas as
 * proibições do manual — se alguém acrescentar um campo que vaza SJT ou
 * comparação com a vaga, o teste cai antes de a tela existir.
 */

const BIG_FIVE: ResultadoBigFive = {
  teste: "BIG_FIVE",
  fatores: { O: 56, C: 63, X: 75, A: 69, E: 81 },
  brutos: { O: 13, C: 14, E: 16, A: 15, N: 7 },
};

const DISC: ResultadoDisc = {
  teste: "DISC",
  dimensoes: { D: 67, I: 63, S: 42, C: 29 },
  liquidos: { D: 4, I: 3, S: -2, C: -5 },
  dominante: "D",
  secundaria: "I",
  rotulo: "D/I",
};

const SJT: ResultadoSjt = {
  teste: "SJT",
  score: 69,
  pontosObtidos: 11,
  pontosMaximos: 16,
  porCompetencia: [
    { competencia: "Trabalho em equipe", score: 0, cenarios: 1 },
    { competencia: "Foco no cliente", score: 100, cenarios: 1 },
  ],
  piores: [{ blocoId: "sjt-c04", competencia: "Trabalho em equipe" }],
};

const ficha = montarFichaDeModulos({ BIG_FIVE, DISC, SJT });

describe("devolutiva ao candidato (§5.1)", () => {
  it("reproduz o modelo preenchido do manual", () => {
    const d = montarDevolutiva("Maria Silva", ficha);

    expect(d.saudacao).toBe("Obrigado, Maria! Aqui está o seu perfil");
    expect(d.bigFive?.notas).toEqual([
      { rotulo: "Abertura", score: 56, faixa: "Moderado" },
      { rotulo: "Conscienciosidade", score: 63, faixa: "Moderado" },
      { rotulo: "Extroversão", score: 75, faixa: "Alto" },
      { rotulo: "Amabilidade", score: 69, faixa: "Alto" },
      { rotulo: "Estabilidade Emocional", score: 81, faixa: "Alto" },
    ]);
    expect(d.disc?.dimensoes.map((x) => x.score)).toEqual([67, 63, 42, 29]);
    expect(d.disc?.rotulo).toBe("D/I");
    expect(d.encerramento).toContain("não define você");
  });

  it("fala em segunda pessoa, sem flexionar gênero pelo nome", () => {
    const maria = montarDevolutiva("Maria Silva", ficha);
    const joao = montarDevolutiva("João Silva", ficha);

    expect(maria.bigFive?.texto.startsWith("Você tende a ser")).toBe(true);

    // O modelo do manual escreve "comunicativa" e "Realizadora" porque a
    // candidata do exemplo se chama Maria. Nome não diz gênero de ninguém: a
    // devolutiva é escrita em construção verbal, e a prova disso é que a mesma
    // prova produz o mesmo texto sob qualquer nome.
    expect(maria.bigFive?.texto).toBe(joao.bigFive?.texto);
    expect(maria.fortes).toEqual(joao.fortes);
    expect(maria.disc?.frase).toBe(joao.disc?.frase);
    expect(JSON.stringify(maria)).not.toMatch(/comunicativ[ao]|realizador[ao]/i);
  });

  it("mostra pontos fortes, e nunca pontos fracos", () => {
    const d = montarDevolutiva("Maria Silva", ficha);

    expect(d.fortes.length).toBeGreaterThan(0);
    expect(d.fortes).toContain("Energia social");
    // Os "pontos de atenção" do DISC (§3.6) ficam na ficha do analista.
    expect(JSON.stringify(d)).not.toContain("Pouca escuta");
  });

  it("NÃO contém SJT, aderência, alerta de qualidade nem Neuroticismo", () => {
    const texto = JSON.stringify(montarDevolutiva("Maria Silva", ficha)).toLowerCase();

    for (const proibido of [
      "sjt",
      "julgamento",
      "competência",
      "competencia",
      "gabarito",
      "aderência",
      "aderencia",
      "fit",
      "perfil-alvo",
      "vaga",
      "alerta",
      "qualidade",
      "neurotic",
    ])
      expect(texto).not.toContain(proibido);
  });

  it("perfil todo moderado ainda recebe frase e ponto forte", () => {
    const morno = montarFichaDeModulos({
      BIG_FIVE: {
        ...BIG_FIVE,
        fatores: { O: 50, C: 52, X: 48, A: 51, E: 49 },
      },
    });

    const d = montarDevolutiva("Alex", morno);

    expect(d.bigFive?.texto).toContain("flexibilidade");
    expect(d.fortes).toHaveLength(1);
  });

  it("bateria sem Big Five nem DISC devolve a ficha vazia, não quebra", () => {
    const d = montarDevolutiva("Alex", montarFichaDeModulos({ SJT }));

    expect(d.bigFive).toBeNull();
    expect(d.disc).toBeNull();
    expect(d.fortes).toEqual([]);
    expect(d.encerramento).toBeTruthy();
  });
});
