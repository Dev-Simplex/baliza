import { headers } from "next/headers";
import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

/**
 * Limitação de taxa por janela fixa, com contador em banco.
 *
 * Banco e não memória: o processo Next reinicia a cada deploy e, com mais de
 * uma instância, contador em memória não limita nada — só dá a impressão de
 * limitar, que é pior que não ter.
 *
 * A janela é fixa (não deslizante): mais barata e suficiente pro que ela
 * protege aqui, que é força bruta de login e enxurrada de convite.
 */

export type Resultado = {
  permitido: boolean;
  restantes: number;
  reiniciaEm: Date;
};

export async function limitar(
  chave: string,
  opcoes: { max: number; janelaSegundos: number },
): Promise<Resultado> {
  const agora = new Date();
  const inicioDaJanela = new Date(
    Math.floor(agora.getTime() / (opcoes.janelaSegundos * 1000)) *
      opcoes.janelaSegundos *
      1000,
  );
  const id = `${chave}:${inicioDaJanela.getTime()}`;
  const reiniciaEm = new Date(
    inicioDaJanela.getTime() + opcoes.janelaSegundos * 1000,
  );

  try {
    const contador = await prisma.rateLimitCounter.upsert({
      where: { key: id },
      create: { key: id, count: 1, windowStart: inicioDaJanela },
      update: { count: { increment: 1 } },
    });

    return {
      permitido: contador.count <= opcoes.max,
      restantes: Math.max(0, opcoes.max - contador.count),
      reiniciaEm,
    };
  } catch (erro) {
    // Banco indisponível não pode virar porta trancada para todo mundo.
    console.error("[rate-limit] falhou, liberando", erro);
    return { permitido: true, restantes: opcoes.max, reiniciaEm };
  }
}

/** Hash do IP: o objetivo é contar, não identificar (LGPD, minimização). */
export async function ipAnonimo() {
  const h = await headers();
  const bruto =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "desconhecido";
  return createHash("sha256")
    .update(`${bruto}:${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex")
    .slice(0, 24);
}

export async function limitarPorIp(
  acao: string,
  opcoes: { max: number; janelaSegundos: number },
) {
  return limitar(`${acao}:${await ipAnonimo()}`, opcoes);
}

/** Faxina dos contadores vencidos. Chamada pela rota de manutenção. */
export async function limparContadoresAntigos() {
  const limite = new Date(Date.now() - 24 * 3600 * 1000);
  const { count } = await prisma.rateLimitCounter.deleteMany({
    where: { windowStart: { lt: limite } },
  });
  return count;
}
