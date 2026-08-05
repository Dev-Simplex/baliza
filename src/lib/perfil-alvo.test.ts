import { describe, expect, it } from "vitest";

import { calcularFit } from "@/lib/instrument/scoring";
import { FATORES, type Fator, type PerfilAlvo } from "@/lib/instrument/types";
import { LARGURA_MINIMA_DA_FAIXA, lerPerfilAlvo } from "@/lib/perfil-alvo";

/** Um formulário completo, com sobrescritas por fator. */
function formulario(
  ajustes: Partial<
    Record<Fator, { tipo?: string; peso?: number; min?: number; max?: number }>
  > = {},
) {
  const dados = new FormData();
  for (const fator of FATORES) {
    const a = ajustes[fator] ?? {};
    dados.set(`${fator}.tipo`, a.tipo ?? "maior_melhor");
    dados.set(`${fator}.peso`, String(a.peso ?? 3));
    dados.set(`${fator}.min`, String(a.min ?? 60));
    dados.set(`${fator}.max`, String(a.max ?? 100));
  }
  return dados;
}

describe("lerPerfilAlvo", () => {
  it("lê os cinco fatores com tipo, peso e faixa", () => {
    const leitura = lerPerfilAlvo(
      formulario({ A: { tipo: "faixa_otima", peso: 2, min: 30, max: 60 } }),
    );

    expect(leitura.ok).toBe(true);
    if (!leitura.ok) return;
    expect(Object.keys(leitura.perfil).sort()).toEqual([...FATORES].sort());
    expect(leitura.perfil.A).toEqual({
      tipo: "faixa_otima",
      peso: 2,
      faixa: [30, 60],
    });
  });

  it("peso 0 e 'não entra na conta' são a mesma decisão — normaliza os dois lados", () => {
    // Peso 0 com tipo que pesa: o tipo cede.
    const porPeso = lerPerfilAlvo(
      formulario({ X: { tipo: "maior_melhor", peso: 0, min: 20, max: 100 } }),
    );
    expect(porPeso.ok && porPeso.perfil.X.tipo).toBe("irrelevante");

    // Tipo irrelevante com peso alto: o peso cede.
    const porTipo = lerPerfilAlvo(
      formulario({ X: { tipo: "irrelevante", peso: 5, min: 20, max: 100 } }),
    );
    expect(porTipo.ok && porTipo.perfil.X.peso).toBe(0);
  });

  it("recusa faixa mais estreita que o erro de medida quando a dimensão pesa", () => {
    const leitura = lerPerfilAlvo(
      formulario({
        C: { peso: 4, min: 70, max: 70 + LARGURA_MINIMA_DA_FAIXA - 1 },
      }),
    );

    expect(leitura.ok).toBe(false);
    if (leitura.ok) return;
    expect(leitura.erro).toContain("Organização e Entrega");
  });

  it("aceita faixa estreita — e só ordena — quando a dimensão não pesa", () => {
    const leitura = lerPerfilAlvo(
      formulario({ O: { tipo: "irrelevante", peso: 0, min: 80, max: 50 } }),
    );

    expect(leitura.ok).toBe(true);
    if (!leitura.ok) return;
    expect(leitura.perfil.O.faixa).toEqual([50, 80]);
  });

  it("recusa faixa invertida numa dimensão que pesa", () => {
    const leitura = lerPerfilAlvo(formulario({ E: { min: 90, max: 40 } }));
    expect(leitura.ok).toBe(false);
  });

  it("recusa peso e faixa fora dos limites", () => {
    expect(lerPerfilAlvo(formulario({ C: { peso: 9 } })).ok).toBe(false);
    expect(lerPerfilAlvo(formulario({ C: { max: 140 } })).ok).toBe(false);
    expect(lerPerfilAlvo(formulario({ C: { tipo: "qualquer" } })).ok).toBe(false);
  });

  /**
   * A regressão que importa: perfil sem nenhuma dimensão com peso zera a
   * aderência de TODO MUNDO — `calcularFit` divide pelo peso total e devolve 0.
   * O ranking continua na tela, sem dizer nada, e ninguém desconfia do número.
   */
  it("recusa perfil em que nenhuma dimensão pesa, porque isso zeraria a aderência de todos", () => {
    const leitura = lerPerfilAlvo(
      formulario(
        Object.fromEntries(
          FATORES.map((f) => [f, { peso: 0, tipo: "irrelevante" }]),
        ),
      ),
    );

    expect(leitura.ok).toBe(false);
    if (leitura.ok) return;
    expect(leitura.erro).toContain("peso");

    // E a prova de que a recusa não é preciosismo: com esse perfil, dois
    // candidatos muito diferentes marcam o mesmo zero.
    const perfilZerado = Object.fromEntries(
      FATORES.map((f) => [f, { tipo: "irrelevante", peso: 0, faixa: [0, 100] }]),
    ) as unknown as PerfilAlvo;
    const alto = { C: 90, E: 90, X: 90, A: 90, O: 90 };
    const baixo = { C: 10, E: 10, X: 10, A: 10, O: 10 };
    expect(calcularFit(alto, perfilZerado).score).toBe(0);
    expect(calcularFit(baixo, perfilZerado).score).toBe(0);
  });

  it("o perfil salvo é aceito pelo motor de escoragem", () => {
    const leitura = lerPerfilAlvo(
      formulario({
        C: { tipo: "maior_melhor", peso: 5, min: 65, max: 100 },
        A: { tipo: "faixa_otima", peso: 3, min: 30, max: 60 },
        O: { tipo: "irrelevante", peso: 0, min: 0, max: 100 },
      }),
    );
    expect(leitura.ok).toBe(true);
    if (!leitura.ok) return;

    const fit = calcularFit({ C: 80, E: 70, X: 70, A: 45, O: 20 }, leitura.perfil);
    expect(fit.score).toBeGreaterThan(0);
    // Dimensão sem peso sai da conta e entra na lista de ignoradas — é o que a
    // tela usa para dizer "considerada e descartada", não "esquecida".
    expect(fit.ignoradas).toContain("O");
    expect(fit.contribuicoes.some((c) => c.fator === "O")).toBe(false);
  });
});
