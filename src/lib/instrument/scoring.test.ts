import { describe, expect, it } from "vitest";

import { criarAleatorio, montarForma } from "./form";
import { ITEM_POR_ID } from "./items";
import { PRESET_POR_ID, PRESETS } from "./presets";
import {
  DENTRO_DA_FAIXA,
  atribuirArquetipo,
  calcularConfianca,
  calcularEscores,
  calcularFit,
  escorar,
  faixaQualitativa,
  idealDaDimensao,
  spearman,
  valorDoItem,
  vetorIpsativo,
} from "./scoring";
import { FATORES, type Fator, type PerfilAlvo, type Respostas } from "./types";

const VERSAO = "2.0.0";

/**
 * Simulação portada de `docs/scorer_referencia.rb`.
 *
 * Gera respostas coerentes com um perfil "verdadeiro" para checar se o modelo
 * recupera o perfil e se o ranking sai sensato. O ruído por item é essencial:
 * sem ele, todo escore cai em múltiplo de 25 e a simulação mente.
 */
function simular(
  alvo: Record<Fator, number>,
  itensDaForma: string[],
  opcoes: { respostasD?: number[]; semente?: string } = {},
): Respostas {
  const aleatorio = criarAleatorio(opcoes.semente ?? "sim-42");
  const respostasD = [...(opcoes.respostasD ?? [2, 2, 2, 2])];
  const respostas: Respostas = {};

  for (const id of itensDaForma) {
    const item = ITEM_POR_ID.get(id)!;

    if (item.fator === "D") {
      respostas[id] = respostasD.shift() ?? 2;
      continue;
    }

    const desejado =
      1 + (alvo[item.fator as Fator] / 100) * 4 + (aleatorio() * 1.2 - 0.6);
    const bruto = Math.min(5, Math.max(1, Math.round(desejado)));
    // O banco guarda sempre o valor CRU: se o item é invertido, a pessoa que
    // "é" alta naquele fator marca baixo.
    respostas[id] = item.reverso ? 6 - bruto : bruto;
  }

  return respostas;
}

const PERSONAS: Record<
  string,
  { perfil: Record<Fator, number>; nota: string; respostasD?: number[] }
> = {
  Ana: {
    perfil: { C: 70, E: 80, X: 85, A: 40, O: 60 } as Record<Fator, number>,
    nota: "assertiva, resistente a não, pouco avessa a atrito",
  },
  Bruno: {
    perfil: { C: 65, E: 60, X: 80, A: 90, O: 55 } as Record<Fator, number>,
    nota: "super simpático — o que encanta na entrevista",
    respostasD: [5, 5, 5, 4],
  },
  Carla: {
    perfil: { C: 90, E: 70, X: 30, A: 60, O: 65 } as Record<Fator, number>,
    nota: "organizadíssima, introvertida",
  },
};

describe("escore por fator (§4.1)", () => {
  it("aplica a inversão no item invertido", () => {
    const direto = [...ITEM_POR_ID.values()].find((i) => !i.reverso)!;
    const invertido = [...ITEM_POR_ID.values()].find((i) => i.reverso)!;

    expect(valorDoItem(direto.id, 5)).toBe(5);
    expect(valorDoItem(invertido.id, 5)).toBe(1);
    expect(valorDoItem(invertido.id, 2)).toBe(4);
  });

  it("normaliza a média para 0-100", () => {
    const forma = montarForma({ semente: "norm", versao: VERSAO });

    // Todo mundo no extremo positivo → 100 em todos os fatores.
    const tudoNoMaximo: Respostas = {};
    for (const id of forma.itens) {
      const item = ITEM_POR_ID.get(id)!;
      tudoNoMaximo[id] = item.reverso ? 1 : 5;
    }
    const altos = calcularEscores(tudoNoMaximo, forma.itens);
    for (const f of FATORES) expect(altos[f]).toBe(100);

    // Tudo no meio → 50.
    const tudoNoMeio: Respostas = {};
    for (const id of forma.itens) tudoNoMeio[id] = 3;
    const medios = calcularEscores(tudoNoMeio, forma.itens);
    for (const f of FATORES) expect(medios[f]).toBe(50);
  });

  it("recupera o perfil verdadeiro da pessoa simulada", () => {
    const forma = montarForma({ semente: "recupera", versao: VERSAO });

    for (const [nome, dados] of Object.entries(PERSONAS)) {
      const respostas = simular(dados.perfil, forma.itens, {
        semente: `sim-${nome}`,
      });
      const escores = calcularEscores(respostas, forma.itens);

      for (const f of FATORES) {
        expect(
          Math.abs(escores[f] - dados.perfil[f]),
          `${nome}/${f}: escore ${escores[f]} vs alvo ${dados.perfil[f]}`,
        ).toBeLessThan(15);
      }
    }
  });
});

describe("faixa qualitativa (§4.3)", () => {
  it("classifica nos cortes certos", () => {
    expect(faixaQualitativa(20).nome).toBe("baixo");
    expect(faixaQualitativa(40).nome).toBe("medio_baixo");
    expect(faixaQualitativa(55).nome).toBe("medio");
    expect(faixaQualitativa(70).nome).toBe("medio_alto");
    expect(faixaQualitativa(90).nome).toBe("alto");
    expect(faixaQualitativa(100).nome).toBe("alto");
  });
});

describe("fit score (§4.4)", () => {
  const perfil = PRESET_POR_ID.get("vendas_cacador")!.dimensoes;

  it("deriva o ideal a partir do tipo da dimensão", () => {
    expect(idealDaDimensao({ tipo: "maior_melhor", peso: 3, faixa: [60, 100] })).toBe(100);
    expect(idealDaDimensao({ tipo: "menor_melhor", peso: 3, faixa: [20, 60] })).toBe(20);
    expect(idealDaDimensao({ tipo: "faixa_otima", peso: 3, faixa: [40, 80] })).toBe(60);
    expect(
      idealDaDimensao({ tipo: "faixa_otima", peso: 3, faixa: [40, 80], ideal: 55 }),
    ).toBe(55);
  });

  it("ignora dimensão de peso zero, mas a lista de propósito", () => {
    const tecnico = PRESET_POR_ID.get("tecnico_desenvolvimento")!.dimensoes;
    const escores = { C: 70, E: 70, X: 10, A: 60, O: 70 } as Record<Fator, number>;
    const fit = calcularFit(escores, tecnico);

    expect(fit.ignoradas).toContain("X");
    expect(fit.contribuicoes.map((c) => c.fator)).not.toContain("X");

    // Energia Social no chão não pode mexer no fit de uma vaga técnica.
    const comXAlto = calcularFit({ ...escores, X: 95 }, tecnico);
    expect(comXAlto.score).toBe(fit.score);
  });

  it("penaliza dos dois lados numa dimensão de faixa ótima", () => {
    const alvo: PerfilAlvo = {
      C: { tipo: "irrelevante", peso: 0, faixa: [0, 100] },
      E: { tipo: "irrelevante", peso: 0, faixa: [0, 100] },
      X: { tipo: "irrelevante", peso: 0, faixa: [0, 100] },
      A: { tipo: "faixa_otima", peso: 5, faixa: [40, 60] },
      O: { tipo: "irrelevante", peso: 0, faixa: [0, 100] },
    };

    const noMeio = calcularFit({ C: 50, E: 50, X: 50, A: 50, O: 50 }, alvo).score;
    const abaixo = calcularFit({ C: 50, E: 50, X: 50, A: 20, O: 50 }, alvo).score;
    const acima = calcularFit({ C: 50, E: 50, X: 50, A: 90, O: 50 }, alvo).score;

    expect(noMeio).toBe(100);
    expect(abaixo).toBeLessThan(noMeio);
    expect(acima).toBeLessThan(noMeio);
  });

  it("sempre devolve explicabilidade junto com o número (§4.4 / LGPD art. 20)", () => {
    // Este candidato está DENTRO da faixa em todas as dimensões do preset, e por
    // isso `puxaramPraBaixo` é legitimamente vazio. A asserção antiga exigia a
    // lista não-vazia aqui, e só passava porque o filtro de "pra baixo" também
    // pegava quem estava dentro — o mesmo defeito que fazia a MESMA dimensão
    // sair nas duas listas. O que precisa existir sempre é a EXPLICAÇÃO, que é
    // `contribuicoes`: toda dimensão, com nome e faixa.
    const fit = calcularFit({ C: 70, E: 80, X: 85, A: 40, O: 60 }, perfil);
    expect(fit.puxaramPraBaixo).toHaveLength(0);
    expect(fit.contribuicoes.length).toBeGreaterThan(0);
    for (const c of fit.contribuicoes) {
      expect(c.nome).toBeTruthy();
      expect(c.faixa).toHaveLength(2);
    }

    // E quem FICA FORA aparece, que é a outra metade da explicação.
    const foraDaFaixa = calcularFit({ C: 20, E: 30, X: 25, A: 95, O: 10 }, perfil);
    expect(foraDaFaixa.puxaramPraBaixo.length).toBeGreaterThan(0);
    for (const c of foraDaFaixa.puxaramPraBaixo) expect(c.dentro).toBe(false);
  });

  it("nunca sai da faixa 0-100", () => {
    const pessimo = calcularFit({ C: 0, E: 0, X: 0, A: 100, O: 0 }, perfil);
    expect(pessimo.score).toBeGreaterThanOrEqual(0);
    const otimo = calcularFit({ C: 100, E: 100, X: 100, A: 45, O: 62 }, perfil);
    expect(otimo.score).toBeLessThanOrEqual(100);
  });
});

describe("REGRESSÃO: a atenuação de 0,35 sustenta a resolução do ranking", () => {
  const perfil = PRESET_POR_ID.get("vendas_cacador")!.dimensoes;
  const forma = montarForma({ semente: "regressao-vendas", versao: VERSAO });

  const resultados = Object.entries(PERSONAS)
    .map(([nome, dados]) => {
      const respostas = simular(dados.perfil, forma.itens, {
        respostasD: dados.respostasD,
        semente: `sim-${nome}`,
      });
      const escores = calcularEscores(respostas, forma.itens);
      return { nome, escores, fit: calcularFit(escores, perfil) };
    })
    .sort((a, b) => b.fit.score - a.fit.score);

  it("o espalhamento entre 1º e 3º fica em torno de 25 pontos", () => {
    const espalhamento = resultados[0].fit.score - resultados[2].fit.score;

    // Este é O teste do modelo. Com penalidade zero dentro da faixa, os três
    // colavam em ~100/89,7/89,5 e o ranking perdia resolução no topo — que é o
    // único lugar onde o recrutador olha. Se cair abaixo de 10, o fit saturou.
    expect(
      espalhamento,
      `espalhamento ${espalhamento.toFixed(1)} — ranking saturado?\n` +
        resultados
          .map((r) => `  ${r.nome}: ${r.fit.score}`)
          .join("\n"),
    ).toBeGreaterThan(12);
    expect(espalhamento).toBeLessThan(45);
  });

  it("com penalidade zero, quem está dentro da faixa satura em 100 e empata", () => {
    // A falha que a constante evita é específica: candidatos DENTRO da faixa em
    // todas as dimensões. Com penalidade zero eles marcam 100 exato e ficam
    // indistinguíveis — o ranking morre justamente no topo, que é o único lugar
    // onde o recrutador olha. Fora da faixa a penalidade cheia já separava.
    const dentroDaFaixa: Array<Record<Fator, number>> = [
      { C: 95, E: 95, X: 95, A: 45, O: 62 }, // colado no ideal
      { C: 70, E: 80, X: 80, A: 35, O: 50 }, // no meio da faixa
      { C: 60, E: 70, X: 70, A: 58, O: 78 }, // encostado nas bordas
    ];

    const fitComAtenuacao = (escores: Record<Fator, number>, atenuacao: number) => {
      let perda = 0;
      let peso = 0;
      for (const f of FATORES) {
        const cfg = perfil[f];
        if (cfg.peso === 0) continue;
        const [lo, hi] = cfg.faixa;
        const ideal = idealDaDimensao(cfg);
        const dentro = escores[f] >= lo && escores[f] <= hi;
        const desvio =
          (Math.abs(escores[f] - ideal) / 100) * (dentro ? atenuacao : 1);
        perda += cfg.peso * desvio;
        peso += cfg.peso;
      }
      return 100 - (perda / peso) * 100;
    };

    // Confirma a premissa: os três estão dentro de todas as faixas que pesam.
    for (const escores of dentroDaFaixa) {
      for (const f of FATORES) {
        if (perfil[f].peso === 0) continue;
        const [lo, hi] = perfil[f].faixa;
        expect(escores[f], `${f} fora da faixa na premissa do teste`).toBeGreaterThanOrEqual(lo);
        expect(escores[f]).toBeLessThanOrEqual(hi);
      }
    }

    const semAtenuacao = dentroDaFaixa.map((e) => fitComAtenuacao(e, 0));
    const comAtenuacao = dentroDaFaixa.map((e) => fitComAtenuacao(e, DENTRO_DA_FAIXA));

    // Sem atenuação: os três marcam 100 exato. Empate triplo.
    expect(semAtenuacao).toEqual([100, 100, 100]);
    expect(new Set(semAtenuacao).size).toBe(1);

    // Com atenuação: separam, e na ordem certa (mais perto do ideal na frente).
    expect(new Set(comAtenuacao).size).toBe(3);
    expect(comAtenuacao[0]).toBeGreaterThan(comAtenuacao[1]);
    expect(comAtenuacao[1]).toBeGreaterThan(comAtenuacao[2]);
    expect(comAtenuacao[0] - comAtenuacao[2]).toBeGreaterThan(8);

    // E o motor de produção concorda com a reimplementação.
    for (const [i, escores] of dentroDaFaixa.entries()) {
      expect(calcularFit(escores, perfil).score).toBeCloseTo(comAtenuacao[i], 1);
    }
  });

  it("a constante continua sendo 0,35", () => {
    expect(DENTRO_DA_FAIXA).toBe(0.35);
  });

  it("ordena de forma sensata para a vaga de caçador", () => {
    // Bruno é o caso didático: Cooperação 90 é o que mais o derruba numa vaga
    // de prospecção, apesar de ele encantar em entrevista.
    const bruno = resultados.find((r) => r.nome === "Bruno")!;
    const queDerrubou = bruno.fit.puxaramPraBaixo.map((c) => c.fator);
    expect(queDerrubou).toContain("A");
  });
});

describe("índice de confiança (§5)", () => {
  const forma = montarForma({ semente: "confianca", versao: VERSAO });

  const base = () =>
    simular({ C: 60, E: 60, X: 60, A: 60, O: 60 }, forma.itens, {
      semente: "conf-base",
    });

  it("selo alto quando nenhum sinal dispara", () => {
    const respostas = base();
    const escores = calcularEscores(respostas, forma.itens);
    const c = calcularConfianca({
      respostas,
      itensDaForma: forma.itens,
      escores,
      segundosPorItem: 6,
    });
    expect(c.sinais).toEqual([]);
    expect(c.selo).toBe("alta");
  });

  it("dispara desejabilidade social quando a pessoa se pinta de santo", () => {
    const respostas = base();
    for (const id of forma.itens) {
      if (ITEM_POR_ID.get(id)!.fator === "D") respostas[id] = 5;
    }
    const escores = calcularEscores(respostas, forma.itens);
    const c = calcularConfianca({
      respostas,
      itensDaForma: forma.itens,
      escores,
      segundosPorItem: 6,
    });
    expect(c.sinais).toContain("desejabilidade");
    expect(c.detalhe.desejabilidade).toBe(4);
  });

  it("dispara linha reta e velocidade em quem respondeu no automático", () => {
    const respostas: Respostas = {};
    for (const id of forma.itens) respostas[id] = 4;
    const escores = calcularEscores(respostas, forma.itens);
    const c = calcularConfianca({
      respostas,
      itensDaForma: forma.itens,
      escores,
      segundosPorItem: 0.9,
    });
    expect(c.sinais).toContain("linha_reta");
    expect(c.sinais).toContain("velocidade");
    expect(c.selo).toBe("baixa");
  });

  it("dispara inconsistência quando o par diverge", () => {
    const respostas = base();
    const pares = new Map<string, string[]>();
    for (const id of forma.itens) {
      const item = ITEM_POR_ID.get(id)!;
      if (item.par) pares.set(item.par, [...(pares.get(item.par) ?? []), id]);
    }
    for (const [, ids] of pares) {
      if (ids.length === 2) {
        respostas[ids[0]] = 1;
        respostas[ids[1]] = 5;
      }
    }
    const escores = calcularEscores(respostas, forma.itens);
    const c = calcularConfianca({
      respostas,
      itensDaForma: forma.itens,
      escores,
      segundosPorItem: 6,
    });
    expect(c.sinais).toContain("inconsistencia");
  });

  it("o texto do selo baixo não acusa a pessoa de desonestidade", () => {
    const respostas: Respostas = {};
    for (const id of forma.itens) respostas[id] = 5;
    const escores = calcularEscores(respostas, forma.itens);
    const c = calcularConfianca({
      respostas,
      itensDaForma: forma.itens,
      escores,
      segundosPorItem: 0.5,
    });
    expect(c.selo).toBe("baixa");
    expect(c.texto).toContain("comum e compreensível");
    expect(c.texto.toLowerCase()).not.toContain("mentir");
    expect(c.texto.toLowerCase()).not.toContain("desonest");
  });
});

describe("convergência Parte A × Parte B (§5.5)", () => {
  it("spearman devolve 1 para vetores perfeitamente concordantes", () => {
    expect(spearman([1, 2, 3, 4, 5], [10, 20, 30, 40, 50])).toBeCloseTo(1, 5);
  });

  it("spearman devolve -1 para vetores opostos", () => {
    expect(spearman([1, 2, 3, 4, 5], [50, 40, 30, 20, 10])).toBeCloseTo(-1, 5);
  });

  it("spearman lida com empates sem estourar", () => {
    expect(spearman([1, 1, 1, 2, 3], [5, 5, 5, 4, 3])).not.toBeNull();
  });

  it("o vetor ipsativo soma zero — é por isso que ele não ranqueia", () => {
    const vetor = vetorIpsativo([
      { blocoId: "cen_1", primeiraId: "cen_1_c", ultimaId: "cen_1_a" },
      { blocoId: "cen_2", primeiraId: "cen_2_e", ultimaId: "cen_2_x" },
      { blocoId: "cen_3", primeiraId: "cen_3_c", ultimaId: "cen_3_o" },
    ]);
    const soma = FATORES.reduce((a, f) => a + vetor[f], 0);
    expect(soma).toBe(0);
  });
});

describe("arquétipo (§6)", () => {
  it("atribui pelo protótipo mais próximo", () => {
    // Protótipo exato do Executor.
    const r = atribuirArquetipo({ C: 85, E: 68, X: 68, A: 50, O: 50 });
    expect(r.id).toBe("executor");
  });

  it("marca perfil misto quando os dois primeiros estão perto", () => {
    // Ponto médio entre Executor e Guardião.
    const r = atribuirArquetipo({
      C: 83.5,
      E: 66.5,
      X: 55,
      A: 64,
      O: 41,
    });
    expect(r.misto).toBe(true);
    expect(r.nomeExibido).toContain("/");
  });
});

describe("escoragem completa", () => {
  it("devolve o resultado inteiro sem faceta virar número", () => {
    const forma = montarForma({ semente: "completo", versao: VERSAO });
    const respostas = simular({ C: 80, E: 70, X: 45, A: 65, O: 60 }, forma.itens, {
      semente: "completo",
    });

    const resultado = escorar({
      respostas,
      itensDaForma: forma.itens,
      perfilAlvo: PRESET_POR_ID.get("administrativo_financeiro")!.dimensoes,
      respostasDeCenario: [
        { blocoId: "cen_1", primeiraId: "cen_1_c", ultimaId: "cen_1_x" },
        { blocoId: "cen_2", primeiraId: "cen_2_c", ultimaId: "cen_2_x" },
        { blocoId: "cen_3", primeiraId: "cen_3_c", ultimaId: "cen_3_e" },
        { blocoId: "cen_4", primeiraId: "cen_4_c", ultimaId: "cen_4_x" },
      ],
      duracaoMs: 8 * 60 * 1000,
    });

    expect(Object.keys(resultado.escores)).toHaveLength(5);
    expect(resultado.fit.score).toBeGreaterThan(0);
    expect(resultado.arquetipo.nome).toBeTruthy();
    expect(resultado.confianca.selo).toBeTruthy();

    // §4.2 — faceta é TEXTO, nunca número.
    for (const nota of resultado.facetas) {
      expect(typeof nota.texto).toBe("string");
      expect(nota).not.toHaveProperty("escore");
      expect(nota).not.toHaveProperty("valor");
    }
  });

  it("aguenta avaliação incompleta sem quebrar", () => {
    const forma = montarForma({ semente: "incompleto", versao: VERSAO });
    const parciais: Respostas = {};
    for (const id of forma.itens.slice(0, 10)) parciais[id] = 4;

    const resultado = escorar({
      respostas: parciais,
      itensDaForma: forma.itens,
      perfilAlvo: PRESET_POR_ID.get("lideranca")!.dimensoes,
    });

    expect(Number.isFinite(resultado.fit.score)).toBe(true);
    for (const f of FATORES) expect(Number.isFinite(resultado.escores[f])).toBe(true);
  });
});

describe("a explicação da aderência não pode se contradizer", () => {
  /**
   * Regressão de um defeito que estava em 13 das 19 fichas da base: a mesma
   * dimensão saía em "puxaram pra cima" E em "puxaram pra baixo", às vezes logo
   * abaixo da frase "todas as dimensões ficaram dentro da faixa alvo".
   *
   * Este é o painel que sustenta a regra nº 3 do produto ("a aderência nunca
   * aparece sozinha") e o direito de revisão do art. 20 da LGPD. Explicação que
   * se contradiz não explica nada — e quem paga é o RH tentando justificar a
   * ordem do ranking para o gestor.
   */
  it("nenhuma dimensão aparece nas duas listas, em 400 perfis sorteados", () => {
    const aleatorio = criarAleatorio("disjuntas");
    const repetidas: string[] = [];

    for (let n = 0; n < 400; n += 1) {
      const escores = Object.fromEntries(
        FATORES.map((f) => [f, Math.round(aleatorio() * 100)]),
      ) as Record<Fator, number>;

      const alvo = PRESETS[n % PRESETS.length].dimensoes;
      const fit = calcularFit(escores, alvo);

      const cima = new Set(fit.puxaramPraCima.map((c) => c.fator));
      for (const c of fit.puxaramPraBaixo) {
        if (cima.has(c.fator)) repetidas.push(`${n}:${c.fator}`);
      }
    }

    expect(repetidas.slice(0, 5)).toEqual([]);
  });

  it("o que puxou pra baixo ficou de fato fora da faixa, e o que puxou pra cima ficou dentro", () => {
    const aleatorio = criarAleatorio("coerencia");
    for (let n = 0; n < 200; n += 1) {
      const escores = Object.fromEntries(
        FATORES.map((f) => [f, Math.round(aleatorio() * 100)]),
      ) as Record<Fator, number>;
      const fit = calcularFit(escores, PRESETS[n % PRESETS.length].dimensoes);

      for (const c of fit.puxaramPraBaixo) expect(c.dentro).toBe(false);
      for (const c of fit.puxaramPraCima) expect(c.dentro).toBe(true);
    }
  });
});
