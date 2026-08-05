import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * De onde sai o endereço de quem fez a requisição.
 *
 * Isto é teste de SEGURANÇA, não de formatação: o limite de 6 tentativas por
 * hora é o que sustenta o código de acesso de 4 dígitos, e um limite ancorado
 * num endereço que o próprio cliente escolhe não limita coisa nenhuma. Cada
 * caso aqui é uma forma de o cliente tentar escolher o próprio balde.
 */

const cabecalhos = new Map<string, string>();
let proxies = 0;

vi.mock("next/headers", () => ({
  headers: async () => ({
    get: (nome: string) => cabecalhos.get(nome.toLowerCase()) ?? null,
  }),
}));

vi.mock("./env", () => ({
  get env() {
    return { AUTH_SECRET: "s".repeat(32), TRUSTED_PROXIES: proxies };
  },
}));

const { anonimizar, ipDaRequisicao, ipEhConfiavel } = await import("./ip");

beforeEach(() => {
  cabecalhos.clear();
  proxies = 0;
});

describe("ipDaRequisicao", () => {
  it("sem proxy declarado, lê o primeiro item — que é o que o Next escreve", () => {
    // Quando o cabeçalho não veio, o Next preenche com o endereço do socket.
    cabecalhos.set("x-forwarded-for", "203.0.113.7");
    return expect(ipDaRequisicao()).resolves.toBe("203.0.113.7");
  });

  it("com 1 proxy declarado, lê o ÚLTIMO item da cadeia", async () => {
    // O proxy ACRESCENTA ao fim o endereço que ele viu. Ler o primeiro item é
    // ler o que o cliente inventou antes de a requisição chegar ao proxy — foi
    // exatamente esse o bug: `split(",")[0]` devolvia "1.2.3.4" abaixo.
    proxies = 1;
    cabecalhos.set("x-forwarded-for", "1.2.3.4, 198.51.100.9");
    await expect(ipDaRequisicao()).resolves.toBe("198.51.100.9");
  });

  it("com 2 proxies declarados, pula os dois", async () => {
    proxies = 2;
    cabecalhos.set(
      "x-forwarded-for",
      "1.2.3.4, 198.51.100.9, 10.0.0.1",
    );
    await expect(ipDaRequisicao()).resolves.toBe("198.51.100.9");
  });

  it("não estoura quando a cadeia é mais curta que o número de proxies", async () => {
    proxies = 3;
    cabecalhos.set("x-forwarded-for", "198.51.100.9");
    await expect(ipDaRequisicao()).resolves.toBe("198.51.100.9");
  });

  it("ignora espaços e itens vazios da cadeia", async () => {
    proxies = 1;
    cabecalhos.set("x-forwarded-for", " 1.2.3.4 , , 198.51.100.9 ");
    await expect(ipDaRequisicao()).resolves.toBe("198.51.100.9");
  });

  it("cai em x-real-ip quando não há x-forwarded-for", async () => {
    cabecalhos.set("x-real-ip", "203.0.113.20");
    await expect(ipDaRequisicao()).resolves.toBe("203.0.113.20");
  });

  it("devolve null quando não há endereço nenhum", async () => {
    await expect(ipDaRequisicao()).resolves.toBeNull();
  });
});

describe("ipEhConfiavel", () => {
  it("é falso por padrão — exposto direto, o cabeçalho é do cliente", () => {
    expect(ipEhConfiavel()).toBe(false);
  });

  it("é verdadeiro quando há proxy nosso declarado", () => {
    proxies = 1;
    expect(ipEhConfiavel()).toBe(true);
  });
});

describe("anonimizar", () => {
  it("é estável para o mesmo endereço e diferente entre endereços", () => {
    expect(anonimizar("203.0.113.7")).toBe(anonimizar("203.0.113.7"));
    expect(anonimizar("203.0.113.7")).not.toBe(anonimizar("203.0.113.8"));
  });

  it("não devolve o endereço em lugar nenhum do hash", () => {
    expect(anonimizar("203.0.113.7")).not.toContain("203");
  });
});
