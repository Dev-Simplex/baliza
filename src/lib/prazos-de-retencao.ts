/**
 * Os prazos de expurgo oferecidos na tela de Configurações, em meses.
 *
 * ─── Por que isto mora num arquivo só seu ──────────────────────────────────
 * Esta lista nasceu dentro de `lib/actions/empresa.ts`, ao lado da ação que a
 * valida — o lugar mais natural do mundo, e o errado. Aquele arquivo é
 * `"use server"`, e módulo `"use server"` só exporta função assíncrona: tudo
 * mais vira referência de servidor na fronteira. O `<select>` de retenção, que
 * é componente de cliente, recebia uma não-lista e morria no `.map` — não só o
 * campo, a página INTEIRA de Configurações devolvia 500 (`TypeError: k.map is
 * not a function`, digest `545976121` nos logs de produção).
 *
 * Também não mora em `lib/retencao.ts`, que seria o vizinho temático: aquele
 * arquivo importa o Prisma, e o componente de cliente que lê esta lista
 * arrastaria o cliente do banco para o navegador.
 *
 * Daí a regra que este arquivo existe para não deixar esquecer: **dado que o
 * navegador precisa ler não pode sair de um módulo `"use server"` nem de um que
 * toque o banco.** Módulo puro, sem importação, é o que atravessa as duas
 * fronteiras sem quebrar nenhuma.
 *
 * ─── Por que lista fechada, e não campo livre ──────────────────────────────
 * Retenção é promessa jurídica ao candidato, e campo aberto convida a digitar
 * 999. Os cinco valores cobrem o que se usa de verdade, do processo curto ao
 * banco de talentos.
 */
export const PRAZOS_DE_RETENCAO = [3, 6, 12, 24, 36] as const;

export type PrazoDeRetencao = (typeof PRAZOS_DE_RETENCAO)[number];

/** O prazo escolhido está na lista? Usado pela validação da ação. */
export function prazoValido(meses: number): meses is PrazoDeRetencao {
  return (PRAZOS_DE_RETENCAO as readonly number[]).includes(meses);
}
