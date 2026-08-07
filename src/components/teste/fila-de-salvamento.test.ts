import { describe, expect, it } from "vitest";

import {
  criarFila,
  esperaDaTentativa,
  FALHAS_PARA_MUDAR_O_TOM,
  type EstadoDaFila,
  type Envio,
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
    // A fila passou a guardar DADO em vez de closure, para caber no disco. Aqui
    // o "dado" é a própria função de envio: assim os casos abaixo continuam
    // exercitando o motor da fila sem virarem um teste de serialização.
    reconstruir: (d) => d as Envio,
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

    expect(b.ultimo()).toMatchObject({ situacao: "salvo", pendentes: 0, erro: null });
  });

  it("guarda a resposta quando a rede cai e sobe sozinha quando ela volta", async () => {
    const b = bancada();
    let rede = false;
    const enviados: string[] = [];

    const envio = async () => {
      // `TypeError` e o que o fetch lanca quando nao conseguiu falar com o
      // servidor. E a assinatura que a fila usa para separar "sem internet"
      // de "servidor quebrado" — trocar por Error generico cai no outro ramo.
      if (!rede) throw new TypeError("Failed to fetch");
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
      // `TypeError` e o que o fetch lanca quando nao conseguiu falar com o
      // servidor. E a assinatura que a fila usa para separar "sem internet"
      // de "servidor quebrado" — trocar por Error generico cai no outro ramo.
      if (!rede) throw new TypeError("Failed to fetch");
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
    expect(b.ultimo()).toMatchObject({
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

/**
 * Um `localStorage` de mentira, porque o ambiente do vitest é `node` e não tem
 * um. É o mínimo que a fila usa: `getItem`, `setItem` e `removeItem`.
 */
function discoFalso() {
  const dados = new Map<string, string>();
  return {
    store: {
      getItem: (k: string) => dados.get(k) ?? null,
      setItem: (k: string, v: string) => void dados.set(k, v),
      removeItem: (k: string) => void dados.delete(k),
    } as unknown as Storage,
    dados,
  };
}

describe("a fila sobrevive ao fechamento da aba", () => {
  const CHAVE = "prumo:fila:tok";

  it("guarda no disco o que ainda não subiu e reenvia na abertura seguinte", async () => {
    const disco = discoFalso();
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: disco.store,
      configurable: true,
    });

    try {
      // 1ª sessão: o servidor está fora e a resposta fica pendurada.
      const enviosDaPrimeira: unknown[] = [];
      const primeira = criarFila({
        aoMudar: () => {},
        chaveDeArmazenamento: CHAVE,
        reconstruir: (d) => async () => {
          enviosDaPrimeira.push(d);
          throw new TypeError("Failed to fetch");
        },
        agendar: () => () => {},
      });
      primeira.enfileirar("item:a", { tipo: "item", itemId: "a", valor: 4 });
      await girar();
      primeira.encerrar();

      expect(enviosDaPrimeira).toHaveLength(1);
      expect(disco.dados.get(CHAVE)).toContain('"itemId":"a"');

      // 2ª sessão: aba nova, memória zerada — é aqui que a prova se perdia.
      const enviosDaSegunda: unknown[] = [];
      criarFila({
        aoMudar: () => {},
        chaveDeArmazenamento: CHAVE,
        reconstruir: (d) => async () => {
          enviosDaSegunda.push(d);
          return { ok: true };
        },
      });
      await girar();

      expect(enviosDaSegunda).toEqual([{ tipo: "item", itemId: "a", valor: 4 }]);
      // Subiu: o disco fica limpo, senão a próxima abertura reenviaria de novo.
      expect(disco.dados.get(CHAVE)).toBeUndefined();
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        value: original,
        configurable: true,
      });
    }
  });

  it("guardado corrompido não impede a prova de abrir", async () => {
    const disco = discoFalso();
    disco.dados.set(CHAVE, "{isso não é json");
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: disco.store,
      configurable: true,
    });
    try {
      expect(() =>
        criarFila({
          aoMudar: () => {},
          chaveDeArmazenamento: CHAVE,
          reconstruir: () => async () => ({ ok: true }),
        }),
      ).not.toThrow();
      expect(disco.dados.get(CHAVE)).toBeUndefined();
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        value: original,
        configurable: true,
      });
    }
  });
});

describe("servidor quebrado não é 'sem conexão'", () => {
  it("500 do servidor vira servidor-instavel, e não aguardando-rede", async () => {
    const b = bancada();
    b.fila.enfileirar("i1", async () => {
      throw new Error("500 Internal Server Error");
    });
    await girar();

    expect(b.ultimo()).toMatchObject({
      situacao: "servidor-instavel",
      pendentes: 1,
    });
  });

  it("conta as falhas seguidas, para a tela parar de prometer que já volta", async () => {
    const b = bancada();
    b.fila.enfileirar("i1", async () => {
      throw new TypeError("Failed to fetch");
    });
    await girar();

    for (let i = 1; i < FALHAS_PARA_MUDAR_O_TOM; i++) await b.correrORelogio();

    expect(b.ultimo().tentativasFalhas).toBeGreaterThanOrEqual(
      FALHAS_PARA_MUDAR_O_TOM,
    );
    expect(b.ultimo().situacao).toBe("aguardando-rede");
  });
});
