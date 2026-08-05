import { describe, expect, it } from "vitest";

import { gerarQr } from "@/lib/qr";

describe("gerarQr", () => {
  it("devolve o PNG do link em data URL", async () => {
    const qr = await gerarQr("http://192.168.0.10:3300/t/abc123");
    expect(qr).toMatch(/^data:image\/png;base64,/);
  });

  /**
   * A regressão que importa: enquanto o QR era gerado no navegador, uma falha
   * zerava o estado e a tela ficava dizendo "Gerando…" para sempre. Aqui a falha
   * tem valor de retorno — `null` — e a tela tem como dizer o que aconteceu.
   * Texto acima da capacidade do formato é a falha mais fácil de provocar.
   */
  it("devolve null em vez de estourar quando o desenho não é possível", async () => {
    expect(await gerarQr("x".repeat(10_000))).toBeNull();
  });
});
