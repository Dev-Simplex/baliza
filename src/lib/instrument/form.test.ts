import { describe, expect, it } from "vitest";

import { ITENS, PARES_DE_CONSISTENCIA } from "./items";
import {
  CENARIOS_POR_PROVA,
  ITENS_POR_FATOR,
  TOTAL_DE_ITENS,
  TOTAL_DE_TELAS,
  montarForma,
  ordenarSobRestricao,
  sortearItens,
  verificarForma,
} from "./form";
import { CENARIOS } from "./scenarios";
import { FATORES } from "./types";

const VERSAO = "2.0.0";

describe("banco de itens", () => {
  it("tem mais de 120 itens", () => {
    expect(ITENS.length).toBeGreaterThan(120);
  });

  it("não tem id repetido", () => {
    const ids = new Set(ITENS.map((i) => i.id));
    expect(ids.size).toBe(ITENS.length);
  });

  it("não tem texto de item repetido", () => {
    const textos = new Set(ITENS.map((i) => i.texto.toLowerCase().trim()));
    expect(textos.size).toBe(ITENS.length);
  });

  it("tem 8 itens em cada faceta, com 4 diretos e 4 invertidos", () => {
    const porFaceta = new Map<string, typeof ITENS>();
    for (const item of ITENS) {
      if (item.fator === "D") continue;
      const chave = `${item.fator}/${item.faceta}`;
      porFaceta.set(chave, [...(porFaceta.get(chave) ?? []), item]);
    }

    expect(porFaceta.size).toBe(15); // 5 fatores × 3 facetas

    for (const [chave, itens] of porFaceta) {
      expect(itens.length, `${chave} deveria ter 8 itens`).toBe(8);
      const invertidos = itens.filter((i) => i.reverso).length;
      expect(invertidos, `${chave} deveria ter 4 invertidos`).toBe(4);
    }
  });

  it("todo par de consistência tem exatamente dois itens, do mesmo fator", () => {
    expect(PARES_DE_CONSISTENCIA.length).toBeGreaterThanOrEqual(3);
    for (const par of PARES_DE_CONSISTENCIA) {
      expect(par.itens.length, `par ${par.id}`).toBe(2);
      const fatores = new Set(
        par.itens.map((id) => ITENS.find((i) => i.id === id)?.fator),
      );
      expect(fatores.size, `par ${par.id} atravessa fatores`).toBe(1);
    }
  });

  it("pares de consistência cobrem ao menos três fatores diferentes", () => {
    const fatores = new Set(
      PARES_DE_CONSISTENCIA.map(
        (p) => ITENS.find((i) => i.id === p.itens[0])?.fator,
      ),
    );
    expect(fatores.size).toBeGreaterThanOrEqual(3);
  });
});

describe("sorteio da forma", () => {
  const sementes = Array.from({ length: 200 }, (_, i) => `semente-${i}`);

  it("respeita todas as invariantes do instrumento, em 200 sorteios", () => {
    const falhas: string[] = [];

    for (const semente of sementes) {
      const forma = montarForma({ semente, versao: VERSAO });
      const violacoes = verificarForma(forma);
      if (violacoes.length > 0) {
        falhas.push(
          `${semente}: ${violacoes.map((v) => `${v.regra} (${v.detalhe})`).join("; ")}`,
        );
      }
    }

    expect(falhas.slice(0, 5)).toEqual([]);
  });

  it("entrega sempre a mesma quantidade de itens", () => {
    for (const semente of sementes.slice(0, 40)) {
      const forma = montarForma({ semente, versao: VERSAO });
      expect(forma.itens.length).toBe(TOTAL_DE_ITENS);
    }
  });

  it("é determinística: a mesma semente reconstrói a mesma prova", () => {
    const a = montarForma({ semente: "abc123", versao: VERSAO });
    const b = montarForma({ semente: "abc123", versao: VERSAO });
    expect(a.itens).toEqual(b.itens);
    expect(a.cenarios).toEqual(b.cenarios);
  });

  it("sementes diferentes geram provas diferentes", () => {
    const a = montarForma({ semente: "pessoa-a", versao: VERSAO });
    const b = montarForma({ semente: "pessoa-b", versao: VERSAO });
    expect(a.itens).not.toEqual(b.itens);
  });

  it("distribui o sorteio pelo banco em vez de cair sempre nos mesmos itens", () => {
    const contagem = new Map<string, number>();
    for (const semente of sementes) {
      for (const id of montarForma({ semente, versao: VERSAO }).itens) {
        contagem.set(id, (contagem.get(id) ?? 0) + 1);
      }
    }
    // Com 200 provas de 34 itens sobre um banco de 128, todo item deveria
    // aparecer pelo menos uma vez. Item que nunca sai é item morto — e a prova
    // encurtada dá menos oportunidade por rodada, que é justamente quando esta
    // verificação começa a valer alguma coisa.
    const nuncaSorteados = ITENS.filter((i) => !contagem.has(i.id));
    expect(nuncaSorteados.map((i) => i.id)).toEqual([]);
  });

  it("evita itens já respondidos por candidato recorrente", () => {
    const primeira = montarForma({ semente: "recorrente-1", versao: VERSAO });
    const segunda = montarForma({
      semente: "recorrente-2",
      versao: VERSAO,
      excluir: primeira.itens,
    });

    const repetidos = segunda.itens.filter((id) => primeira.itens.includes(id));

    // O banco tem 128 itens e a prova usa 34: a segunda aplicação deveria ser
    // quase toda nova. A repetição que sobra vem dos pares de consistência, que
    // são escolhidos antes da exclusão — o par vale mais inteiro e repetido que
    // pela metade e novo.
    expect(repetidos.length).toBeLessThan(12);
    expect(verificarForma(segunda)).toEqual([]);
  });
});

describe("ordenação sob restrição", () => {
  it("nunca coloca dois itens do mesmo fator em sequência", () => {
    for (let i = 0; i < 100; i++) {
      const forma = montarForma({ semente: `ordem-${i}`, versao: VERSAO });
      const fatores = forma.itens.map(
        (id) => ITENS.find((it) => it.id === id)!.fator,
      );
      for (let p = 1; p < fatores.length; p++) {
        expect(
          fatores[p] === fatores[p - 1],
          `semente ordem-${i}: posições ${p} e ${p + 1} são ${fatores[p]}`,
        ).toBe(false);
      }
    }
  });

  it("mantém os pares de consistência distantes", () => {
    const distancias: number[] = [];

    for (let i = 0; i < 100; i++) {
      const forma = montarForma({ semente: `dist-${i}`, versao: VERSAO });
      const posicaoDoPar = new Map<string, number[]>();

      forma.itens.forEach((id, pos) => {
        const item = ITENS.find((it) => it.id === id)!;
        if (!item.par) return;
        posicaoDoPar.set(item.par, [...(posicaoDoPar.get(item.par) ?? []), pos]);
      });

      for (const posicoes of posicaoDoPar.values()) {
        if (posicoes.length === 2)
          distancias.push(Math.abs(posicoes[0] - posicoes[1]));
      }
    }

    // O alvo é 15; o afrouxamento progressivo pode descer até 6 em casos raros.
    // O que não pode existir é par colado, que zera o sinal de consistência.
    expect(Math.min(...distancias)).toBeGreaterThanOrEqual(6);
    const media = distancias.reduce((a, b) => a + b, 0) / distancias.length;
    expect(media).toBeGreaterThan(12);
  });

  it("espalha os itens de desejabilidade social", () => {
    for (let i = 0; i < 50; i++) {
      const forma = montarForma({ semente: `d-${i}`, versao: VERSAO });
      const posicoes = forma.itens
        .map((id, pos) => ({ id, pos }))
        .filter(({ id }) => ITENS.find((it) => it.id === id)!.fator === "D")
        .map(({ pos }) => pos);

      for (let p = 1; p < posicoes.length; p++) {
        expect(posicoes[p] - posicoes[p - 1]).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("gera ordens diferentes para o mesmo conjunto de itens", () => {
    const itens = sortearItens({ semente: "conjunto-fixo" });
    const a = ordenarSobRestricao(itens, "ordem-a");
    const b = ordenarSobRestricao(itens, "ordem-b");
    expect(a).not.toEqual(b);
    expect([...a].sort()).toEqual([...b].sort()); // mesmo conjunto
  });
});

describe("cenários", () => {
  it("entrega os blocos da prova, sem repetir", () => {
    const forma = montarForma({ semente: "cen", versao: VERSAO });
    expect(forma.cenarios.length).toBe(CENARIOS_POR_PROVA);
    expect(new Set(forma.cenarios).size).toBe(CENARIOS_POR_PROVA);
  });

  it("mantém todo fator com presença suficiente para o vetor ipsativo", () => {
    // Um fator que cai em um bloco só produz ±1, que é ruído dentro do Índice
    // de Confiança. Este é o teste que segura o corte de 8 para 5 blocos.
    for (let i = 0; i < 200; i++) {
      const forma = montarForma({ semente: `cen-cob-${i}`, versao: VERSAO });
      const aparicoes = new Map(FATORES.map((f) => [f, 0]));

      for (const id of forma.cenarios) {
        const bloco = CENARIOS.find((c) => c.id === id)!;
        for (const o of bloco.opcoes)
          aparicoes.set(o.fator, (aparicoes.get(o.fator) ?? 0) + 1);
      }

      for (const [fator, n] of aparicoes)
        expect(n, `fator ${fator} na semente cen-cob-${i}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("sorteia conjuntos diferentes de blocos para pessoas diferentes", () => {
    const conjuntos = new Set(
      Array.from({ length: 40 }, (_, i) =>
        [...montarForma({ semente: `cen-var-${i}`, versao: VERSAO }).cenarios]
          .sort()
          .join(","),
      ),
    );
    // Se o guloso de cobertura fosse cego à semente, todo mundo receberia os
    // mesmos 5 blocos e a Parte B viraria gabarito compartilhável.
    expect(conjuntos.size).toBeGreaterThan(1);
  });

  it("ainda ultrapassa o mínimo que o sinal de convergência exige", () => {
    // `calcularConfianca` só calcula a convergência com 4+ blocos respondidos.
    expect(CENARIOS_POR_PROVA).toBeGreaterThan(4);
  });
});

describe("tamanho da prova", () => {
  it("cada fator recebe exatamente ITENS_POR_FATOR itens em toda prova", () => {
    for (let i = 0; i < 50; i++) {
      const forma = montarForma({ semente: `cob-${i}`, versao: VERSAO });
      for (const fator of FATORES) {
        const n = forma.itens.filter(
          (id) => ITENS.find((it) => it.id === id)!.fator === fator,
        ).length;
        expect(n, `fator ${fator} na semente cob-${i}`).toBe(ITENS_POR_FATOR);
      }
    }
  });

  it("são 39 telas de ponta a ponta", () => {
    // Número fixado de propósito: a promessa de tempo do site, da tela de
    // abertura e da régua de progresso é derivada daqui. Se alguém mexer nos
    // parâmetros da forma sem revisar a cópia, este teste avisa antes do
    // candidato descobrir sozinho que "8 minutos" virou outra coisa.
    const forma = montarForma({ semente: "telas", versao: VERSAO });
    expect(forma.itens.length + forma.cenarios.length).toBe(TOTAL_DE_TELAS);
    expect(TOTAL_DE_TELAS).toBe(39);
  });
});
