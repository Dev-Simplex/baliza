import { randomInt } from "node:crypto";

import { prisma } from "./prisma";

/**
 * Código de acesso do candidato: 4 dígitos.
 *
 * É a terceira via de entrada, ao lado do link e do QR — a que dá para ditar no
 * telefone. **Não é senha**: quem tem o código entra, exatamente como quem tem
 * o link. Tratar isso como segredo forte seria mentir sobre o que ele é.
 *
 * O que sustenta 4 dígitos:
 *
 * 1. **Reciclagem.** O código volta ao acervo quando a prova termina, então o
 *    espaço de 10.000 governa só os convites EM ABERTO, nunca o histórico.
 * 2. **Limite de tentativas.** A tela `/acesso` é limitada por IP; varrer
 *    10.000 combinações a esse ritmo leva mais tempo do que qualquer processo
 *    seletivo dura.
 *
 * Se o acervo encher (mais de ~9.000 convites em aberto ao mesmo tempo), o
 * convite fica SEM código e continua valendo por link e QR — degrada, não quebra.
 */

const TENTATIVAS = 25;

/** 4 dígitos, incluindo os que começam com zero (0042 é código válido). */
function sortear() {
  return String(randomInt(0, 10_000)).padStart(4, "0");
}

/**
 * Um código livre, ou null se o acervo estiver cheio.
 *
 * A verificação prévia não elimina a corrida com outro convite criado no mesmo
 * instante — por isso quem grava também trata o erro de unicidade do banco.
 */
export async function sortearCodigoLivre(): Promise<string | null> {
  for (let i = 0; i < TENTATIVAS; i += 1) {
    const candidato = sortear();
    const ocupado = await prisma.invitation.findUnique({
      where: { accessCode: candidato },
      select: { id: true },
    });
    if (!ocupado) return candidato;
  }
  return null;
}

/** Normaliza o que a pessoa digitou: "12 34", "1-2-3-4" e " 1234 " valem. */
export function normalizarCodigo(bruto: string) {
  return bruto.replace(/\D/g, "").slice(0, 4);
}
