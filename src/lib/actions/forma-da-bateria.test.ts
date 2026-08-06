import { describe, expect, it } from "vitest";

import { perguntaRespondida } from "@/components/teste/tipos-da-prova";
import { CATALOGO_DE_TESTES, TESTES, type Teste } from "@/lib/instrument/baterias";
import { INSTRUCAO_BIG_FIVE, ITEM_BIG_FIVE_POR_ID } from "@/lib/instrument/bigfive";
import { BLOCO_DISC_POR_ID, INSTRUCAO_DISC } from "@/lib/instrument/disc";
import { ITEM_POR_ID } from "@/lib/instrument/items";
import { CENARIO_POR_ID } from "@/lib/instrument/scenarios";
import { CENARIO_SJT_POR_ID, INSTRUCAO_SJT } from "@/lib/instrument/sjt";

import {
  lerProvaDaBateria,
  montarEtapas,
  montarProvaDaBateria,
  opcoesDoBloco,
  testeDoBloco,
  testeDoItem,
} from "./forma-da-bateria";

/** O caminho inteiro: sorteia, guarda, lê de volta e monta as telas. */
function provaCompleta(bateria: Teste[], semente = "prova") {
  const guardada = montarProvaDaBateria({ semente, bateria });
  const prova = lerProvaDaBateria({
    semente,
    bateria,
    itensGuardados: guardada.itens,
    blocosGuardados: guardada.blocos,
  });
  return { guardada, prova, etapas: montarEtapas({ semente, prova }) };
}

describe("de quem é o id", () => {
  it("responde pelo banco, não pelo prefixo", () => {
    expect(testeDoItem([...ITEM_POR_ID.keys()][0])).toBe("PRUMO");
    expect(testeDoItem("bf07")).toBe("BIG_FIVE");
    expect(testeDoItem("bf99")).toBeNull();

    expect(testeDoBloco("cen_1")).toBe("PRUMO");
    expect(testeDoBloco("disc-b03")).toBe("DISC");
    expect(testeDoBloco("sjt-c05")).toBe("SJT");
    expect(testeDoBloco("inventado")).toBeNull();
  });

  it("bloco desconhecido não tem opção válida nenhuma", () => {
    // Conjunto vazio reprova qualquer id — é a recusa por omissão, e é a certa:
    // um bloco que a aplicação não conhece não pode aceitar resposta.
    expect(opcoesDoBloco("inventado").size).toBe(0);
    expect(opcoesDoBloco("disc-b01").size).toBe(4);
    expect(opcoesDoBloco("sjt-c01").size).toBe(4);
  });
});

describe("montagem da prova", () => {
  it("cada teste da bateria entrega o tamanho que o catálogo promete", () => {
    for (const teste of TESTES) {
      const { etapas } = provaCompleta([teste]);
      expect(etapas).toHaveLength(1);
      expect(etapas[0].perguntas.length, teste).toBe(
        CATALOGO_DE_TESTES[teste].telas,
      );
    }
  });

  it("as etapas saem na ordem canônica, não na ordem em que foram pedidas", () => {
    const { etapas } = provaCompleta(["SJT", "DISC", "PRUMO", "BIG_FIVE"]);
    expect(etapas.map((e) => e.teste)).toEqual([
      "PRUMO",
      "BIG_FIVE",
      "DISC",
      "SJT",
    ]);
  });

  it("a mesma semente reconstrói exatamente a mesma prova", () => {
    // É o que sustenta retomar: quem volta amanhã tem que ver a mesma prova, na
    // mesma ordem, com as mesmas opções dentro de cada bloco.
    const a = provaCompleta([...TESTES], "igual");
    const b = provaCompleta([...TESTES], "igual");
    expect(JSON.stringify(a.etapas)).toBe(JSON.stringify(b.etapas));
  });

  it("sementes diferentes embaralham de formas diferentes", () => {
    const a = provaCompleta(["DISC"], "um");
    const b = provaCompleta(["DISC"], "dois");
    expect(a.prova.porTeste.DISC.blocos).not.toEqual(b.prova.porTeste.DISC.blocos);
  });
});

describe("leitura do que está guardado", () => {
  it("separa as duas colunas do banco em quatro provas", () => {
    const { guardada, prova } = provaCompleta([...TESTES]);

    // Uma coluna só para as afirmações, outra só para os blocos — a mesma
    // divisão das tabelas de resposta.
    expect(guardada.itens.every((id) => testeDoItem(id) !== null)).toBe(true);
    expect(guardada.blocos.every((id) => testeDoBloco(id) !== null)).toBe(true);

    expect(prova.porTeste.BIG_FIVE.itens.every((id) => ITEM_BIG_FIVE_POR_ID.has(id))).toBe(true);
    expect(prova.porTeste.DISC.blocos.every((id) => BLOCO_DISC_POR_ID.has(id))).toBe(true);
    expect(prova.porTeste.SJT.blocos.every((id) => CENARIO_SJT_POR_ID.has(id))).toBe(true);
    expect(prova.porTeste.PRUMO.blocos.every((id) => CENARIO_POR_ID.has(id))).toBe(true);

    // E as três listas de destino não se misturam: o SJT grava noutra tabela.
    expect(prova.cenarios.some((id) => CENARIO_SJT_POR_ID.has(id))).toBe(false);
    expect(prova.escolhas.every((id) => CENARIO_SJT_POR_ID.has(id))).toBe(true);
  });

  it("id de teste fora da bateria congelada é ignorado", () => {
    // A bateria da avaliação manda. Um id de DISC guardado numa prova que não
    // aplica DISC não pode virar pergunta — nem pendência que trava a conclusão.
    const prova = lerProvaDaBateria({
      semente: "s",
      bateria: ["BIG_FIVE"],
      itensGuardados: ["bf01", "bf02"],
      blocosGuardados: ["disc-b01", "sjt-c01"],
    });
    expect(prova.cenarios).toEqual([]);
    expect(prova.escolhas).toEqual([]);
    expect(prova.itens).toEqual(["bf01", "bf02"]);
  });

  it("id repetido na coluna não vira pergunta repetida", () => {
    const prova = lerProvaDaBateria({
      semente: "s",
      bateria: ["BIG_FIVE"],
      itensGuardados: ["bf01", "bf01", "bf02"],
      blocosGuardados: [],
    });
    expect(prova.itens).toEqual(["bf01", "bf02"]);
  });

  it("teste sem nada guardado é reconstruído da semente", () => {
    // O caso real: a bateria virou selecionável ANTES de a prova saber aplicá-la,
    // então existe avaliação com bateria `[BIG_FIVE]` e coluna vazia. Sem esta
    // reconstrução, aquela pessoa abriria uma prova de zero telas.
    const prova = lerProvaDaBateria({
      semente: "orfa",
      bateria: ["BIG_FIVE", "SJT"],
      itensGuardados: [],
      blocosGuardados: [],
    });

    expect(prova.itens).toHaveLength(CATALOGO_DE_TESTES.BIG_FIVE.telas);
    expect(prova.escolhas).toHaveLength(CATALOGO_DE_TESTES.SJT.telas);

    // E é determinística: reabrir não pode mostrar outra prova.
    const denovo = lerProvaDaBateria({
      semente: "orfa",
      bateria: ["BIG_FIVE", "SJT"],
      itensGuardados: [],
      blocosGuardados: [],
    });
    expect(denovo.itens).toEqual(prova.itens);
    expect(denovo.escolhas).toEqual(prova.escolhas);
  });

  it("item aposentado do banco some da prova em vez de travá-la", () => {
    const prova = lerProvaDaBateria({
      semente: "s",
      bateria: ["BIG_FIVE"],
      itensGuardados: ["bf01", "bf_que_nao_existe_mais", "bf02"],
      blocosGuardados: [],
    });
    expect(prova.itens).toEqual(["bf01", "bf02"]);
  });
});

describe("o que chega à tela do candidato", () => {
  it("cada teste leva a sua instrução, e ela é a do manual", () => {
    const { etapas } = provaCompleta([...TESTES]);
    const porTeste = Object.fromEntries(etapas.map((e) => [e.teste, e]));

    expect(porTeste.BIG_FIVE.instrucao).toBe(INSTRUCAO_BIG_FIVE);
    expect(porTeste.DISC.instrucao).toBe(INSTRUCAO_DISC);
    expect(porTeste.SJT.instrucao).toBe(INSTRUCAO_SJT);
    expect(porTeste.PRUMO.instrucao).toBeTruthy();

    // Instrução repetida entre dois testes significaria que alguém copiou a do
    // vizinho — e a do vizinho pede outra coisa de quem responde.
    const instrucoes = new Set(etapas.map((e) => e.instrucao));
    expect(instrucoes.size).toBe(etapas.length);
  });

  it("cada teste pergunta do jeito dele", () => {
    const { etapas } = provaCompleta([...TESTES]);
    const tipos = (t: Teste) =>
      new Set(
        etapas.find((e) => e.teste === t)!.perguntas.map((p) => p.tipo),
      );

    expect(tipos("PRUMO")).toEqual(new Set(["likert", "ordenar"]));
    expect(tipos("BIG_FIVE")).toEqual(new Set(["likert"]));
    expect(tipos("DISC")).toEqual(new Set(["mais-menos"]));
    expect(tipos("SJT")).toEqual(new Set(["escolha"]));
  });

  it("nada de uso interno atravessa para o navegador", () => {
    // Fator e inversão (§2.3), a letra D/I/S/C de cada adjetivo (§3.3), a
    // pontuação, a competência e o título do cenário do SJT (§4.2). Expor o
    // gabarito queima o banco de cenários para sempre.
    const { etapas } = provaCompleta([...TESTES]);
    const bruto = JSON.stringify(etapas);

    expect(bruto).not.toContain("dimensao");
    expect(bruto).not.toContain("competencia");
    expect(bruto).not.toContain("pontos");
    expect(bruto).not.toContain("reverso");

    const sjt = etapas.find((e) => e.teste === "SJT")!;
    for (const pergunta of sjt.perguntas) {
      const cenario = CENARIO_SJT_POR_ID.get(pergunta.id)!;
      expect(JSON.stringify(pergunta)).not.toContain(cenario.titulo);
      expect(JSON.stringify(pergunta)).not.toContain(cenario.competencia);
    }
  });

  it("as alternativas do SJT não saem na ordem do gabarito", () => {
    // No banco a de 2 pontos vem primeiro. Ordem fixa faria "marcar sempre a
    // primeira" valer 100.
    const { etapas } = provaCompleta([...TESTES], "ordem-sjt");
    const sjt = etapas.find((e) => e.teste === "SJT")!;

    const iguais = sjt.perguntas.filter((pergunta) => {
      if (pergunta.tipo !== "escolha") return false;
      const banco = CENARIO_SJT_POR_ID.get(pergunta.id)!;
      return (
        JSON.stringify(pergunta.opcoes.map((o) => o.id)) ===
        JSON.stringify(banco.alternativas.map((a) => a.id))
      );
    });

    expect(iguais.length).toBeLessThan(sjt.perguntas.length);
  });
});

describe("quando uma pergunta conta como respondida", () => {
  const vazio = { itens: {}, blocos: {}, escolhas: {} };

  it("meia resposta de MAIS/MENOS não é resposta", () => {
    const pergunta = {
      tipo: "mais-menos" as const,
      id: "disc-b01",
      opcoes: [],
    };

    expect(perguntaRespondida(pergunta, vazio)).toBe(false);

    // O mesmo adjetivo dos dois lados: o líquido daria +1 e −1 na mesma
    // dimensão, o bloco se perderia e nada no resultado denunciaria.
    expect(
      perguntaRespondida(pergunta, {
        ...vazio,
        blocos: { "disc-b01": { primeiraId: "a", ultimaId: "a" } },
      }),
    ).toBe(false);

    expect(
      perguntaRespondida(pergunta, {
        ...vazio,
        blocos: { "disc-b01": { primeiraId: "a", ultimaId: "b" } },
      }),
    ).toBe(true);
  });

  it("a escolha única conta assim que existe", () => {
    const pergunta = {
      tipo: "escolha" as const,
      id: "sjt-c01",
      situacao: "",
      opcoes: [],
    };
    expect(perguntaRespondida(pergunta, vazio)).toBe(false);
    expect(
      perguntaRespondida(pergunta, { ...vazio, escolhas: { "sjt-c01": "x" } }),
    ).toBe(true);
  });
});
