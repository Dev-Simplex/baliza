import { describe, expect, it } from "vitest";

import {
  criarFila,
  esperaDaTentativa,
  type EstadoDaFila,
} from "./fila-de-salvamento";

/** Deixa a fila girar: ela é assíncrona e não expõe promessa de propósito. */
const girar = () => new Promise((r) => setTimeout(r, 0));

/**
 * Bancada com relógio na mão: `agendar` fica sob controle do teste, então o
 * backoff é verificado sem esperar 15 segundos de verdade.
 */
function bancada() {
  const estados: EstadoDaFila[] = [];
  const agendados: Array<{ acao: () => void; ms: number }> = [];

  const fila = criarFila({
    aoMudar: (e) => estados.push(e),
    agendar: (acao, ms) => {
      const entrada = { acao, ms };
      agendados.push(entrada);
      return () => {
        const i = agendados.indexOf(entrada);
        if (i >= 0) agendados.splice(i, 1);
      };
    },
  });

  return {
    fila,
    estados,
    agendados,
    ultimo: () => estados[estados.length - 1],
    /** Dispara o backoff pendente, como o relógio faria. */
    async correrORelogio() {
      const proximo = agendados.shift();
      proximo?.acao();
      await girar();
    },
  };
}

describe("fila de salvamento", () => {
  it("salva e fica limpa", async () => {
    const b = bancada();
    b.fila.enfileirar("i1", async () => ({ ok: true }));
    await girar();

    expect(b.ultimo()).toEqual({ situacao: "salvo", pendentes: 0, erro: null });
  });

  it("guarda a resposta quando a rede cai e sobe sozinha quando ela volta", async () => {
    const b = bancada();
    let rede = false;
    const enviados: string[] = [];

    const envio = async () => {
      if (!rede) throw new Error("rede fora");
      enviados.push("i1");
      return { ok: true };
    };

    b.fila.enfileirar("i1", envio);
    await girar();

    // O ponto que mais importa: a resposta NÃO se perde, e a tela sabe disso.
    expect(b.ultimo()).toMatchObject({
      situacao: "aguardando-rede",
      pendentes: 1,
    });
    expect(enviados).toEqual([]);

    rede = true;
    await b.correrORelogio();

    expect(enviados).toEqual(["i1"]);
    expect(b.ultimo()).toMatchObject({ situacao: "salvo", pendentes: 0 });
  });

  it("mantém uma pendência só por pergunta e sobe a ÚLTIMA resposta", async () => {
    const b = bancada();
    let rede = false;
    const enviados: number[] = [];

    const envioCom = (valor: number) => async () => {
      if (!rede) throw new Error("rede fora");
      enviados.push(valor);
      return { ok: true };
    };

    b.fila.enfileirar("i1", envioCom(2));
    await girar();
    expect(b.ultimo()).toMatchObject({ situacao: "aguardando-rede" });

    // Trocar de ideia offline não empilha três gravações.
    b.fila.enfileirar("i1", envioCom(4));
    await girar();
    b.fila.enfileirar("i1", envioCom(5));
    await girar();
    expect(b.ultimo()?.pendentes).toBe(1);

    rede = true;
    await b.correrORelogio();

    expect(enviados).toEqual([5]);
  });

  it("não repete uma recusa do servidor, e mostra o motivo", async () => {
    const b = bancada();
    let chamadas = 0;

    b.fila.enfileirar("i1", async () => {
      chamadas += 1;
      return { ok: false, erro: "Item fora desta avaliação" };
    });
    await girar();

    expect(chamadas).toBe(1);
    expect(b.agendados).toHaveLength(0);
    expect(b.ultimo()).toEqual({
      situacao: "recusado",
      pendentes: 0,
      erro: "Item fora desta avaliação",
    });
  });

  it("uma recusa não trava as outras respostas da fila", async () => {
    const b = bancada();
    const enviados: string[] = [];

    b.fila.enfileirar("i1", async () => ({ ok: false, erro: "recusado" }));
    b.fila.enfileirar("i2", async () => {
      enviados.push("i2");
      return { ok: true };
    });
    await girar();

    expect(enviados).toEqual(["i2"]);
    expect(b.ultimo()).toMatchObject({ pendentes: 0, situacao: "recusado" });
  });

  it("envia uma de cada vez, para a resposta velha não cair por cima da nova", async () => {
    const b = bancada();
    let emVoo = 0;
    let simultaneas = 0;

    const envio = async () => {
      emVoo += 1;
      simultaneas = Math.max(simultaneas, emVoo);
      await girar();
      emVoo -= 1;
      return { ok: true };
    };

    b.fila.enfileirar("i1", envio);
    b.fila.enfileirar("i2", envio);
    b.fila.enfileirar("i3", envio);
    await girar();
    await girar();
    await girar();
    await girar();

    expect(simultaneas).toBe(1);
    expect(b.ultimo()).toMatchObject({ situacao: "salvo", pendentes: 0 });
  });

  it("espera mais a cada tentativa, com teto", () => {
    expect(esperaDaTentativa(1)).toBe(1000);
    expect(esperaDaTentativa(2)).toBe(2000);
    expect(esperaDaTentativa(3)).toBe(4000);
    expect(esperaDaTentativa(10)).toBe(15000);
  });
});
