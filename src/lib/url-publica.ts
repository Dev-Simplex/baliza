import { headers } from "next/headers";

import { env } from "./env";

const semBarraFinal = (u: string) => u.replace(/\/+$/, "");

/** Endereço que só abre na máquina de quem gerou o link. */
function ehLocal(url: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url);
}

/**
 * Base pública do app — a que vai DENTRO do link que o candidato recebe.
 *
 * O link é o produto ("cole um link na sua vaga"), então ele não pode depender
 * de onde o servidor acha que está. Com `NEXT_PUBLIC_APP_URL` no valor padrão
 * (`http://localhost:3300`), todo convite saía apontando para a máquina de quem
 * copiou: o candidato abria e não ia a lugar nenhum.
 *
 * Precedência, e o porquê de cada uma:
 *
 * 1. `NEXT_PUBLIC_APP_URL`, quando aponta para um endereço NÃO-local. É o caso
 *    de produção atrás de domínio/proxy, onde o host interno não é o endereço
 *    que o candidato usa — e onde confiar no cabeçalho `Host` abriria espaço
 *    para alguém forjar o domínio de um link que vai por e-mail.
 * 2. O host da requisição (`x-forwarded-host` na frente de `host`). É o que
 *    acerta sozinho em desenvolvimento e em rede local: quem abriu o painel por
 *    `http://192.168.0.10:3300` recebe um link com esse mesmo endereço.
 * 3. O valor de `NEXT_PUBLIC_APP_URL` como está, para quando não há requisição
 *    (job, script, seed).
 */
export async function urlBase(): Promise<string> {
  const configurada = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configurada && !ehLocal(configurada)) return semBarraFinal(configurada);

  try {
    const cabecalhos = await headers();
    const host = cabecalhos.get("x-forwarded-host") ?? cabecalhos.get("host");
    if (host) {
      const protocolo =
        cabecalhos.get("x-forwarded-proto") ??
        (host.startsWith("localhost") || host.startsWith("127.0.0.1")
          ? "http"
          : cabecalhos.get("referer")?.startsWith("https") // atrás de proxy sem x-forwarded-proto
            ? "https"
            : "http");
      return semBarraFinal(`${protocolo}://${host}`);
    }
  } catch {
    // Sem contexto de requisição (job, script): cai no configurado.
  }

  return semBarraFinal(env.NEXT_PUBLIC_APP_URL);
}

/** O link público da vaga — o que o candidato recebe. */
export async function urlDaVaga(publicToken: string): Promise<string> {
  return `${await urlBase()}/vaga/${publicToken}`;
}

/** O link do resultado do candidato (§7.3: ele sempre recebe o próprio). */
export async function urlDoResultado(resultToken: string): Promise<string> {
  return `${await urlBase()}/r/${resultToken}`;
}
