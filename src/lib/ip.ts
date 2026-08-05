import { headers } from "next/headers";
import { createHash } from "node:crypto";

import { env } from "./env";

/**
 * De onde vem o endereço de quem fez a requisição — e o quanto ele vale.
 *
 * ─── A armadilha ───────────────────────────────────────────────────────────
 * `x-forwarded-for` é um cabeçalho, e cabeçalho quem escreve é o cliente. O
 * Next preenche o dele apenas QUANDO NÃO VEIO NENHUM (`req.headers[...] ??=
 * socket.remoteAddress`, em base-server.js): quem manda o cabeçalho na mão
 * escolhe o próprio endereço. Sem proxy na frente, ler `x-forwarded-for` como
 * se fosse a origem é ler um campo que o atacante preencheu.
 *
 * Isso importa aqui porque o limite de 6 tentativas por hora é o que sustenta
 * o código de acesso de 4 dígitos (ver `codigo-de-acesso.ts`). Um limite
 * ancorado num endereço forjável não limita nada: basta trocar o cabeçalho a
 * cada tentativa para ganhar um balde novo, e a varredura das 10.000
 * combinações — que deveria levar quase dois anos — volta a levar minutos.
 *
 * E mesmo COM proxy: o proxy ACRESCENTA o endereço que ele viu ao fim da
 * lista. Ler o primeiro item continua lendo o que o cliente escreveu. O item
 * que vale é o n-ésimo a contar do fim, onde n é o número de proxies que a
 * gente controla.
 *
 * ─── A saída ───────────────────────────────────────────────────────────────
 * `PROXIES_CONFIAVEIS` (`TRUSTED_PROXIES` no ambiente) declara quantos proxies
 * existem entre o público e este processo:
 *
 *   0 (padrão) — exposto direto. O endereço serve como PISTA, nunca como
 *     garantia, e quem protege o código de 4 dígitos passa a ser o teto global
 *     de `rate-limit.ts`, que não depende de origem nenhuma.
 *   1 ou mais — atrás de proxy nosso. O endereço é confiável e o limite por IP
 *     vale de verdade.
 *
 * Errar para mais é pior que errar para menos: declarar 2 com um proxy só
 * devolve o controle do endereço ao cliente.
 */

/** Quantos proxies nossos existem entre o público e este processo. */
export function proxiesConfiaveis() {
  return env.TRUSTED_PROXIES;
}

/** O endereço é confiável o bastante para ancorar um limite sozinho? */
export function ipEhConfiavel() {
  return proxiesConfiaveis() > 0;
}

/**
 * O endereço de quem fez a requisição, ou null fora de um ciclo de requisição
 * (job, seed, script). Sempre bruto — quem precisa de anonimato chama
 * `anonimizar()`.
 */
export async function ipDaRequisicao(): Promise<string | null> {
  let cabecalhos: Headers;
  try {
    cabecalhos = await headers();
  } catch {
    return null;
  }

  const encaminhado = cabecalhos.get("x-forwarded-for");
  if (encaminhado) {
    const cadeia = encaminhado
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (cadeia.length > 0) {
      // Com n proxies nossos, o endereço que o primeiro deles viu está a n
      // posições do fim. Sem proxy nenhum a lista inteira é do cliente: fica o
      // primeiro item, que é o que o Next escreve quando o cabeçalho não veio.
      const indice = ipEhConfiavel()
        ? Math.max(0, cadeia.length - proxiesConfiaveis())
        : 0;
      return cadeia[indice] ?? cadeia[0];
    }
  }

  return cabecalhos.get("x-real-ip")?.trim() || null;
}

/**
 * Hash do endereço. O objetivo é CONTAR, não identificar (LGPD art. 6º, VII —
 * minimização): o contador precisa distinguir origens, não saber quem são.
 *
 * O `AUTH_SECRET` entra como sal para que o hash não seja reversível por
 * dicionário — o espaço de endereços IPv4 inteiro cabe numa tabela.
 */
export function anonimizar(bruto: string, tamanho = 24) {
  return createHash("sha256")
    .update(`${bruto}:${env.AUTH_SECRET}`)
    .digest("hex")
    .slice(0, tamanho);
}

/** Endereço anonimizado da requisição atual. */
export async function ipAnonimoDaRequisicao(tamanho = 24) {
  const bruto = await ipDaRequisicao();
  return anonimizar(bruto ?? "desconhecido", tamanho);
}
