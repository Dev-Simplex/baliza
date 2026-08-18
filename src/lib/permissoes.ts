import type { UserRole } from "@/generated/prisma/enums";

/**
 * O vocabulário de autorização, sem sessão dentro.
 *
 * ─── Por que separado de `tenant.ts` ───────────────────────────────────────
 * `tenant.ts` importa `auth()`, que arrasta o NextAuth e, com ele, `next/server`
 * — coisas que só existem dentro de uma requisição. A régua de papéis não
 * depende de nada disso: é aritmética sobre um enum. Enquanto as duas moravam
 * juntas, a régua não podia ser testada sem levantar meio framework, e por isso
 * nunca foi.
 *
 * Aqui ficam as decisões que dão para tomar sabendo só QUEM é a pessoa. Em
 * `tenant.ts` fica o que descobre quem ela é.
 */

/** Hierarquia de papéis: número maior manda mais. */
const PESO: Record<UserRole, number> = {
  VIEWER: 1,
  RECRUITER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function podeAoMenos(papel: UserRole, minimo: UserRole) {
  return PESO[papel] >= PESO[minimo];
}

/**
 * Erro de autorização para uso em rotas de API e Server Actions, onde
 * `redirect()` não é a resposta certa.
 */
export class ErroDeAutorizacao extends Error {
  constructor(
    message = "Não autorizado",
    readonly status = 403,
  ) {
    super(message);
    this.name = "ErroDeAutorizacao";
  }
}

/**
 * Recusa em rota que devolve arquivo.
 *
 * Redirecionar um `<a download>` não avisa ninguém: o navegador segue o 307,
 * recebe HTML no lugar do arquivo e o download morre em silêncio — ou, pior,
 * salva a página de erro com extensão .csv. Um 403 com corpo em texto é o que
 * a pessoa e o `fetch` conseguem distinguir de um arquivo vazio.
 */
export function respostaDeAutorizacao(erro: unknown): Response | null {
  if (!(erro instanceof ErroDeAutorizacao)) return null;
  return new Response(erro.message, {
    status: erro.status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
