import { describe, expect, it } from "vitest";

// `retencao.ts` puxa o cliente Prisma e o `env.ts`, que derruba o boot quando
// falta variável obrigatória — de propósito, é o que evita `undefined` três
// camadas abaixo em produção. Aqui nada conecta em nada: o adaptador do Prisma
// só abre conexão na primeira consulta, e este arquivo só testa conta de data.
process.env.DATABASE_URL ??= "postgresql://teste:teste@localhost:5432/teste";
process.env.AUTH_SECRET ??= "t".repeat(32);

const { corteDeRetencao } = await import("./retencao");

/**
 * A data-limite do expurgo. Só isto é testável sem banco — o resto de
 * `retencao.ts` é `deleteMany`, e o repositório não tem base de teste. O que
 * dá para blindar aqui é a conta que decide o que morre: errar o corte para
 * mais apaga dado que ainda estava no prazo, e isso não tem volta.
 */
describe("corteDeRetencao", () => {
  it("recua o número de meses pedido", () => {
    const corte = corteDeRetencao(12, new Date("2026-08-05T12:00:00Z"));
    expect(corte.toISOString().slice(0, 10)).toBe("2025-08-05");
  });

  it("atravessa a virada do ano", () => {
    const corte = corteDeRetencao(3, new Date("2026-02-10T12:00:00Z"));
    expect(corte.toISOString().slice(0, 10)).toBe("2025-11-10");
  });

  it("com mês curto no destino, erra para o lado de GUARDAR mais", () => {
    // 31 de março menos 1 mês não existe: 31 de fevereiro transborda para
    // março. O corte fica alguns dias mais recente do que o pedido, então o
    // expurgo apaga de menos. Num job que apaga dado de pessoa, é o único lado
    // aceitável para errar.
    const corte = corteDeRetencao(1, new Date("2026-03-31T12:00:00Z"));
    expect(corte.getTime()).toBeGreaterThan(
      new Date("2026-02-28T12:00:00Z").getTime(),
    );
    expect(corte.getTime()).toBeLessThan(
      new Date("2026-03-31T12:00:00Z").getTime(),
    );
  });

  it("não muda a data recebida", () => {
    const agora = new Date("2026-08-05T12:00:00Z");
    corteDeRetencao(12, agora);
    expect(agora.toISOString()).toBe("2026-08-05T12:00:00.000Z");
  });
});
