import { describe, expect, it } from "vitest";

import { apelidar, gerarTokenDeVaga, sufixoAleatorio } from "./token-de-vaga";

describe("apelidar", () => {
  it("tira acento e cedilha", () => {
    expect(apelidar("Prospecção")).toBe("prospeccao");
    expect(apelidar("Analista Júnior")).toBe("analista-junior");
  });

  it("colapsa pontuação e espaços em um hífen só", () => {
    expect(apelidar("Executivo de Vendas — Prospecção")).toBe(
      "executivo-de-vendas-prospeccao",
    );
    expect(apelidar("Dev  /  Full   Stack")).toBe("dev-full-stack");
  });

  it("não deixa hífen sobrando nas pontas", () => {
    expect(apelidar("  ...Vendas!!!  ")).toBe("vendas");
  });

  // O corte por tamanho não pode deixar o endereço terminando em hífen.
  it("corta título longo sem terminar em hífen", () => {
    const apelido = apelidar(
      "Coordenador de Operações Logísticas para a Região Centro Oeste do Brasil",
    );
    expect(apelido.length).toBeLessThanOrEqual(48);
    expect(apelido.endsWith("-")).toBe(false);
  });

  // Título só de símbolos ou em alfabeto não-latino: o sufixo carrega sozinho.
  it("cai em 'vaga' quando não sobra letra nenhuma", () => {
    expect(apelidar("!!!")).toBe("vaga");
    expect(apelidar("エンジニア")).toBe("vaga");
  });
});

describe("sufixoAleatorio", () => {
  it("evita os caracteres que se confundem ao ler (l, o, 0, 1)", () => {
    const amostra = Array.from({ length: 200 }, () => sufixoAleatorio()).join("");
    expect(amostra).not.toMatch(/[lo01]/);
  });

  it("não repete na prática", () => {
    const sorteios = new Set(Array.from({ length: 500 }, () => sufixoAleatorio()));
    expect(sorteios.size).toBe(500);
  });
});

describe("gerarTokenDeVaga", () => {
  it("junta o apelido e o sufixo", () => {
    const token = gerarTokenDeVaga("Executivo de Vendas");
    expect(token).toMatch(/^executivo-de-vendas-[a-z2-9]{6}$/);
  });

  // Sem o sufixo, duas vagas de mesmo título colidiriam — e o endereço seria
  // adivinhável a partir do anúncio.
  it("dá endereços diferentes para o mesmo título", () => {
    const a = gerarTokenDeVaga("Analista Financeiro");
    const b = gerarTokenDeVaga("Analista Financeiro");
    expect(a).not.toBe(b);
  });

  it("continua servindo como URL mesmo com título hostil", () => {
    const token = gerarTokenDeVaga("Vaga #1 — 50% remoto (CLT/PJ)");
    expect(token).toMatch(/^[a-z0-9-]+$/);
    expect(encodeURIComponent(token)).toBe(token);
  });
});
