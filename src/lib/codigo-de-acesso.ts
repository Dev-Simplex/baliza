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
 * Os 25 candidatos vão numa consulta só, e não numa por vez: cadastrar
 * candidato é caminho de tela, e 25 idas ao banco em série custam mais que a
 * gravação inteira. Com o acervo em 50% de ocupação a chance de os 25 saírem
 * todos ocupados é de 1 em 33 milhões — sortear mais não paga.
 *
 * A verificação não elimina a corrida com outro convite criado no mesmo
 * instante (e nunca eliminaria: entre ler e gravar cabe outra transação) — por
 * isso quem grava também trata o erro de unicidade do banco.
 *
 * Convite VENCIDO segura o código dele: a unicidade é sobre a tabela inteira,
 * não sobre os convites em aberto. Quem devolve esses ao acervo é o
 * `prisma/manutencao.ts`.
 */
export async function sortearCodigoLivre(): Promise<string | null> {
  const candidatos = new Set<string>();
  while (candidatos.size < TENTATIVAS) candidatos.add(sortear());

  const ocupados = await prisma.invitation.findMany({
    where: { accessCode: { in: [...candidatos] } },
    select: { accessCode: true },
  });

  const tomados = new Set(ocupados.map((o) => o.accessCode));
  for (const candidato of candidatos) {
    if (!tomados.has(candidato)) return candidato;
  }
  return null;
}

/** Normaliza o que a pessoa digitou: "12 34", "1-2-3-4" e " 1234 " valem. */
export function normalizarCodigo(bruto: string) {
  return bruto.replace(/\D/g, "").slice(0, 4);
}
