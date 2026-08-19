import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

/**
 * A regra da fronteira `"use server"`, escrita como teste.
 *
 * ─── O defeito que este teste existe para não deixar voltar ────────────────
 * `lib/actions/empresa.ts` é `"use server"` e exportava, ao lado das ações, a
 * lista de prazos de retenção. Parecia o lugar certo: a constante e a validação
 * que a usa, juntas. Só que módulo `"use server"` é uma fronteira — o bundler
 * transforma cada export numa referência de servidor, e o que não é função
 * async não atravessa como o que era.
 *
 * O `<select>` de retenção é componente de cliente e fazia `.map` naquela
 * lista. Em produção a tela de Configurações INTEIRA respondia 500, com
 * `TypeError: k.map is not a function` — nome minificado, arquivo de chunk,
 * nada apontando para a constante. Custa caro de achar e é trivial de escrever
 * por engano, que é exatamente o perfil de erro que merece um teste de fonte.
 *
 * O teste lê o código como texto de propósito: importar o módulo não reproduz
 * nada, porque a transformação só acontece no build.
 */

const RAIZ = path.resolve(__dirname, "..");

function arquivosDeCodigo(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entrada) => {
    const completo = path.join(dir, entrada.name);
    if (entrada.isDirectory()) {
      // `generated` é código do Prisma, não nosso.
      return entrada.name === "generated" ? [] : arquivosDeCodigo(completo);
    }
    return /\.tsx?$/.test(entrada.name) && !entrada.name.endsWith(".test.ts")
      ? [completo]
      : [];
  });
}

/** A diretiva vale só quando é a primeira coisa do arquivo. */
function ehUseServer(fonte: string): boolean {
  const primeira = fonte.split("\n").find((linha) => linha.trim() !== "") ?? "";
  return /^["']use server["'];?\s*$/.test(primeira.trim());
}

describe("módulos \"use server\"", () => {
  const modulos = arquivosDeCodigo(RAIZ)
    .map((caminho) => ({ caminho, fonte: readFileSync(caminho, "utf8") }))
    .filter(({ fonte }) => ehUseServer(fonte));

  it("existem — senão o teste passaria à toa", () => {
    expect(modulos.length).toBeGreaterThan(0);
  });

  it("só exportam função assíncrona", () => {
    const infratores: string[] = [];

    for (const { caminho, fonte } of modulos) {
      const relativo = path.relative(RAIZ, caminho).split(path.sep).join("/");

      fonte.split("\n").forEach((linha, i) => {
        // `export type` e `export interface` somem na compilação: não chegam
        // na fronteira e não têm como quebrar nada.
        if (/^export\s+(type|interface)\b/.test(linha)) return;

        const proibido =
          /^export\s+(const|let|var|class|enum)\b/.test(linha) ||
          /^export\s+function\b/.test(linha) ||
          /^export\s+default\s+(?!async\s+function)/.test(linha);

        if (proibido) infratores.push(`${relativo}:${i + 1} → ${linha.trim()}`);
      });
    }

    expect(infratores).toEqual([]);
  });
});
