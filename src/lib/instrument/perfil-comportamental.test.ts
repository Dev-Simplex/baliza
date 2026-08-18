import { describe, expect, it } from "vitest";

import { CATALOGO_DE_TESTES } from "./baterias";
import { montarBlocoDisc } from "@/lib/analise/ficha";
import {
  BLOCOS_PERFIL_COMPORTAMENTAL,
  BLOCO_PERFIL_COMPORTAMENTAL_POR_ID,
  montarFormaPerfilComportamental,
  opcoesPerfilComportamentalParaCandidato,
  pontuarPerfilComportamental,
  TOTAL_DE_BLOCOS_PERFIL_COMPORTAMENTAL,
} from "./perfil-comportamental";

/** Responde escolhendo, em cada bloco, a opção da dimensão pedida. */
function responder(escolhas: readonly ("D" | "I" | "S" | "C")[]) {
  return escolhas.map((dimensao, i) => {
    const bloco = BLOCOS_PERFIL_COMPORTAMENTAL[i];
    const opcao = bloco.opcoes.find((o) => o.dimensao === dimensao)!;
    return { blocoId: bloco.id, alternativaId: opcao.id };
  });
}

/** 51 escolhas: `quantas` da primeira dimensão, o resto da segunda. */
function mistura(
  a: "D" | "I" | "S" | "C",
  quantas: number,
  b: "D" | "I" | "S" | "C",
) {
  return responder(
    Array.from({ length: TOTAL_DE_BLOCOS_PERFIL_COMPORTAMENTAL }, (_, i) =>
      i < quantas ? a : b,
    ),
  );
}

describe("banco", () => {
  it("são as 51 linhas da planilha, cada uma com as quatro colunas", () => {
    expect(TOTAL_DE_BLOCOS_PERFIL_COMPORTAMENTAL).toBe(51);

    for (const bloco of BLOCOS_PERFIL_COMPORTAMENTAL) {
      expect(bloco.opcoes.map((o) => o.dimensao)).toEqual(["D", "I", "S", "C"]);
      for (const opcao of bloco.opcoes) expect(opcao.texto.length).toBeGreaterThan(2);
    }
  });

  it("todo id é único — id repetido faria uma resposta sobrescrever a outra", () => {
    const ids = BLOCOS_PERFIL_COMPORTAMENTAL.flatMap((b) => [
      b.id,
      ...b.opcoes.map((o) => o.id),
    ]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("forma", () => {
  it("aplica o banco inteiro, e a mesma semente reconstrói a mesma prova", () => {
    const a = montarFormaPerfilComportamental("candidato-42");
    const b = montarFormaPerfilComportamental("candidato-42");

    expect(a.blocos).toHaveLength(TOTAL_DE_BLOCOS_PERFIL_COMPORTAMENTAL);
    expect(new Set(a.blocos).size).toBe(a.blocos.length);
    expect(a.blocos).toEqual(b.blocos);
  });

  it("sementes diferentes embaralham diferente", () => {
    expect(montarFormaPerfilComportamental("um").blocos).not.toEqual(
      montarFormaPerfilComportamental("dois").blocos,
    );
  });

  /**
   * A regra que impede entregar o gabarito junto com a pergunta: no banco as
   * quatro opções estão sempre em D · I · S · C, e coluna fixa na tela diria a
   * dimensão de cada uma sem ninguém precisar deduzir.
   */
  it("o candidato recebe só id e texto, e não na ordem do banco", () => {
    const opcoes = opcoesPerfilComportamentalParaCandidato("pc-b01", "s");

    expect(opcoes).toHaveLength(4);
    for (const opcao of opcoes)
      expect(Object.keys(opcao).sort()).toEqual(["id", "texto"]);
    expect(JSON.stringify(opcoes)).not.toContain("dimensao");

    const ordemDoBanco = BLOCO_PERFIL_COMPORTAMENTAL_POR_ID.get("pc-b01")!.opcoes.map(
      (o) => o.id,
    );
    const embaralhadas = BLOCOS_PERFIL_COMPORTAMENTAL.filter(
      (b) =>
        opcoesPerfilComportamentalParaCandidato(b.id, "s").map((o) => o.id).join() !==
        b.opcoes.map((o) => o.id).join(),
    );
    expect(opcoes).toHaveLength(4);
    expect(ordemDoBanco).toHaveLength(4);
    // Não é exigido que TODO bloco saia trocado (4 opções, 1/24 de chance de
    // sair igual), mas a esmagadora maioria tem que sair.
    expect(embaralhadas.length).toBeGreaterThan(40);
  });

  it("bloco desconhecido não devolve opção nenhuma", () => {
    expect(opcoesPerfilComportamentalParaCandidato("inventado", "s")).toEqual([]);
  });
});

describe("apuração", () => {
  it("é a contagem da planilha: uma escolha por linha, 51 no total", () => {
    const resultado = pontuarPerfilComportamental(mistura("D", 30, "S"));

    expect(resultado.liquidos).toEqual({ D: 30, I: 0, S: 21, C: 0 });
    expect(
      resultado.liquidos.D +
        resultado.liquidos.I +
        resultado.liquidos.S +
        resultado.liquidos.C,
    ).toBe(51);
    expect(resultado.dimensoes.D).toBe(59);
    expect(resultado.dimensoes.S).toBe(41);
    expect(resultado.dominante).toBe("D");
  });

  it("a secundária só aparece quando ela realmente tempera a dominante", () => {
    // 27 × 24 → 53 contra 47: seis pontos, dentro da régua.
    const junto = pontuarPerfilComportamental(mistura("D", 27, "I"));
    expect(junto.dominante).toBe("D");
    expect(junto.secundaria).toBe("I");
    expect(junto.rotulo).toBe("D/I");

    // 40 × 11 → 78 contra 22: perfil puro.
    const puro = pontuarPerfilComportamental(mistura("D", 40, "I"));
    expect(puro.secundaria).toBeNull();
    expect(puro.rotulo).toBe("D");
  });

  it("prova em branco não vira quatro zeros com um dominante inventado", () => {
    // Não deve acontecer (o encerramento barra prova incompleta), mas se
    // acontecer o número não pode parecer medido.
    const vazio = pontuarPerfilComportamental([]);
    expect(vazio.dimensoes).toEqual({ D: 0, I: 0, S: 0, C: 0 });
    expect(vazio.secundaria).toBeNull();
  });

  it("resposta com id inventado é ignorada, não somada", () => {
    const resultado = pontuarPerfilComportamental([
      { blocoId: "pc-b01", alternativaId: "pc-b01-d" },
      { blocoId: "pc-b01", alternativaId: "inventado" },
      { blocoId: "inventado", alternativaId: "pc-b01-i" },
    ]);
    expect(resultado.liquidos).toEqual({ D: 1, I: 0, S: 0, C: 0 });
  });
});

// ─── Ponte para `baterias.ts` e para a ficha ───────────────────────────────

describe("contrato", () => {
  it("o catálogo promete o tamanho que o banco tem", () => {
    expect(CATALOGO_DE_TESTES.PERFIL_COMPORTAMENTAL.telas).toBe(
      TOTAL_DE_BLOCOS_PERFIL_COMPORTAMENTAL,
    );
    expect(CATALOGO_DE_TESTES.PERFIL_COMPORTAMENTAL.temGabarito).toBe(false);
    // Mede estilo, não os cinco fatores — não alimenta a aderência.
    expect(CATALOGO_DE_TESTES.PERFIL_COMPORTAMENTAL.produzFatores).toBe(false);
  });

  /**
   * A razão de o resultado ter a forma do DISC: a ficha do analista desenha os
   * dois com o mesmo bloco. Se o formato divergir, o cartão quebra em produção
   * e não aqui.
   */
  it("o resultado alimenta o bloco de D/I/S/C da ficha", () => {
    const bloco = montarBlocoDisc(pontuarPerfilComportamental(mistura("D", 27, "I")));

    expect(bloco.rotulo).toBe("D/I");
    expect(bloco.dimensoes.map((d) => d.dimensao)).toEqual(["D", "I", "S", "C"]);
    expect(bloco.fortes.length).toBeGreaterThan(0);
    expect(bloco.atencao.length).toBeGreaterThan(0);
  });
});
