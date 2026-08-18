import { describe, expect, it } from "vitest";

import { ehVersaoVelha } from "./versao-velha";

/**
 * Este teste existe por causa de um caso real, e vale registrar qual: uma
 * publicação saiu enquanto uma aba estava aberta, a pessoa tentou entrar, e o
 * envio do formulário morreu com `UnrecognizedActionError`. A fronteira de erro
 * não reconheceu, ofereceu "Tentar de novo" — que remonta a mesma árvore e
 * falha igual — e a pessoa ficou trancada para fora clicando num botão morto.
 */
describe("aba numa versão que não existe mais", () => {
  it("reconhece o arquivo que sumiu — aparece ao NAVEGAR", () => {
    expect(ehVersaoVelha({ name: "ChunkLoadError", message: "" })).toBe(true);
    expect(
      ehVersaoVelha({ name: "Error", message: "Loading chunk 42 failed." }),
    ).toBe(true);
    expect(
      ehVersaoVelha({
        name: "TypeError",
        message: "Failed to fetch dynamically imported module: /_next/x.js",
      }),
    ).toBe(true);
  });

  it("reconhece a Server Action antiga — aparece ao ENVIAR", () => {
    expect(
      ehVersaoVelha({ name: "UnrecognizedActionError", message: "" }),
    ).toBe(true);

    // A mensagem exata que o Next emite, colhida do console de quem travou.
    expect(
      ehVersaoVelha({
        name: "Error",
        message:
          'Server Action "60f4b1d386800511dbf5ee14d51a4a196de67dc6c0" was not found on the server.',
      }),
    ).toBe(true);
  });

  /**
   * O `name` some quando o erro atravessa a serialização entre servidor e
   * cliente — que é exatamente o trajeto deste erro. Se a regra dependesse só
   * dele, funcionaria no teste e falharia em produção.
   */
  it("reconhece pela mensagem mesmo quando o nome se perdeu", () => {
    expect(
      ehVersaoVelha({
        message: "Read more: https://nextjs.org/docs/messages/failed-to-find-server-action",
      }),
    ).toBe(true);
  });

  it("não confunde com falha de verdade — essas devem oferecer 'Tentar de novo'", () => {
    expect(ehVersaoVelha({ name: "Error", message: "connect ECONNREFUSED" })).toBe(false);
    expect(
      ehVersaoVelha({ name: "PrismaClientKnownRequestError", message: "P2002" }),
    ).toBe(false);
    expect(ehVersaoVelha({})).toBe(false);
    expect(ehVersaoVelha({ name: "", message: "" })).toBe(false);
  });
});
