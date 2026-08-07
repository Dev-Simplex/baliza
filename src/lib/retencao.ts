import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/**
 * Expurgo por retenção — a promessa que estava só na interface.
 *
 * O rodapé do relatório do candidato diz, com todas as letras: "suas respostas
 * ficam guardadas por até N meses e depois são apagadas". O prazo vinha de
 * `Organization.retentionMonths` e o campo `Assessment.purgedAt` existia no
 * banco, mas nada nunca apagava nada. Promessa de prazo sem rotina que a
 * cumpra é a pior das duas situações: sem a promessa você só tem dado velho;
 * com ela você tem dado velho e uma declaração falsa ao titular (LGPD art. 6º,
 * VI, e art. 16).
 *
 * ─── O que é apagado, e o que não é ────────────────────────────────────────
 * O que vence é a RESPOSTA BRUTA — o que a pessoa marcou, item por item, e a
 * ordem em que marcou. É o dado detalhado, o que permitiria reconstruir a
 * pessoa muito além do que o processo seletivo precisava, e o que perde
 * qualquer utilidade depois que o processo acaba.
 *
 * O resultado consolidado (escores, aderência, selo, arquétipo) FICA. É ele
 * que a empresa usa para conduzir e revisitar o processo seletivo, e é o que
 * ela precisa ter em mãos se o titular pedir acesso aos próprios dados (LGPD
 * art. 18) depois que a resposta bruta já venceu. Apagar o consolidado junto
 * deixaria a empresa sem como responder ao próprio pedido de acesso.
 *
 * Junto vão `ipHash` e `userAgent`: eram evidência de que o consentimento foi
 * dado ali, e sem a resposta bruta não sobrou o que evidenciar. `consentAt`
 * fica — é uma data, não identifica ninguém, e é a prova de que houve consentimento.
 *
 * ─── Por que não apaga a pessoa ────────────────────────────────────────────
 * Candidato e vaga continuam. A empresa tem base legal para lembrar quem
 * participou do processo dela, e apagar o candidato levaria junto, em cascata,
 * o resultado que é do titular. Exclusão a pedido (art. 18, VI) é outro
 * caminho, e é manual de propósito: ela precisa de decisão humana.
 */

/** Quantas avaliações por transação. Lote grande trava a tabela sem precisar. */
const TAMANHO_DO_LOTE = 200;

export type ResumoDoExpurgo = {
  simulado: boolean;
  organizacoes: number;
  avaliacoes: number;
  respostas: number;
  cenarios: number;
  porEmpresa: Array<{
    organizacao: string;
    retencaoEmMeses: number;
    corte: Date;
    avaliacoes: number;
  }>;
};

/** A data-limite: tudo anterior a ela venceu. */
export function corteDeRetencao(retencaoEmMeses: number, agora = new Date()) {
  const corte = new Date(agora);
  corte.setMonth(corte.getMonth() - retencaoEmMeses);
  return corte;
}

/**
 * Apaga a resposta bruta das avaliações vencidas e carimba `purgedAt`.
 *
 * `simular` responde "o que sairia daqui?" sem tirar nada — um job que apaga
 * dado de gente precisa poder ser conferido antes de rodar de verdade.
 */
export async function expurgarPorRetencao(opcoes?: {
  simular?: boolean;
  agora?: Date;
}): Promise<ResumoDoExpurgo> {
  const simular = opcoes?.simular ?? false;
  const agora = opcoes?.agora ?? new Date();

  const empresas = await prisma.organization.findMany({
    select: { id: true, name: true, retentionMonths: true },
  });

  const resumo: ResumoDoExpurgo = {
    simulado: simular,
    organizacoes: 0,
    avaliacoes: 0,
    respostas: 0,
    cenarios: 0,
    porEmpresa: [],
  };

  for (const empresa of empresas) {
    const corte = corteDeRetencao(empresa.retentionMonths, agora);

    const vencidas = await prisma.assessment.findMany({
      where: {
        organizationId: empresa.id,
        purgedAt: null,
        // Vale a conclusão; avaliação que nunca foi concluída conta pela
        // criação, senão ela nunca venceria — `completedAt` fica null pra
        // sempre e o dado bruto sobreviveria ao prazo justamente no caso em
        // que ele não serviu pra nada.
        OR: [
          { completedAt: { lt: corte } },
          { completedAt: null, createdAt: { lt: corte } },
        ],
      },
      select: { id: true },
    });

    if (vencidas.length === 0) continue;

    resumo.organizacoes += 1;
    resumo.avaliacoes += vencidas.length;
    resumo.porEmpresa.push({
      organizacao: empresa.name,
      retencaoEmMeses: empresa.retentionMonths,
      corte,
      avaliacoes: vencidas.length,
    });

    if (simular) {
      const ids = vencidas.map((a) => a.id);
      resumo.respostas += await prisma.itemResponse.count({
        where: { assessmentId: { in: ids } },
      });
      resumo.cenarios += await prisma.scenarioResponse.count({
        where: { assessmentId: { in: ids } },
      });
      continue;
    }

    for (let i = 0; i < vencidas.length; i += TAMANHO_DO_LOTE) {
      const ids = vencidas.slice(i, i + TAMANHO_DO_LOTE).map((a) => a.id);

      const [respostas, cenarios] = await prisma.$transaction([
        prisma.itemResponse.deleteMany({ where: { assessmentId: { in: ids } } }),
        prisma.scenarioResponse.deleteMany({
          where: { assessmentId: { in: ids } },
        }),
        prisma.assessment.updateMany({
          where: { id: { in: ids } },
          data: { purgedAt: agora, ipHash: null, userAgent: null },
        }),
      ]);

      resumo.respostas += respostas.count;
      resumo.cenarios += cenarios.count;
    }

    await registrarAuditoria({
      categoria: "PRIVACY",
      acao: "expurgo_por_retencao",
      organizationId: empresa.id,
      entidade: "Assessment",
      metadados: {
        avaliacoes: vencidas.length,
        retencaoEmMeses: empresa.retentionMonths,
        corte: corte.toISOString(),
      },
    });
  }

  return resumo;
}

/**
 * Devolve ao acervo o código de 4 dígitos de convite vencido.
 *
 * O código volta quando a prova conclui, e é essa reciclagem que permite que 4
 * dígitos bastem (ver `codigo-de-acesso.ts`). Convite que venceu sem resposta
 * não devolvia nada: o código ficava preso para sempre num convite que já não
 * abre porta nenhuma, e o acervo de 10.000 ia secando sozinho.
 *
 * Não é só higiene de espaço: acervo cheio faz `sortearCodigoLivre()` devolver
 * null, e aí candidato novo passa a ser cadastrado sem código nenhum.
 */
export async function devolverCodigosVencidos(agora = new Date()) {
  const { count } = await prisma.invitation.updateMany({
    where: {
      accessCode: { not: null },
      expiresAt: { lt: agora },
      status: { notIn: ["COMPLETED"] },
    },
    data: { accessCode: null },
  });
  return count;
}

/**
 * Quanto tempo a trilha de auditoria guarda o endereço de quem agiu.
 *
 * Dezoito meses porque a trilha serve para RECONSTRUIR um incidente, e incidente
 * que ninguém notou em um ano e meio não vai ser reconstruído por um IP. Quem
 * precisar de prazo diferente troca aqui — é decisão de política, não técnica.
 */
export const MESES_DE_AUDITORIA = 18;

/**
 * Apaga a trilha de auditoria vencida.
 *
 * ─── Por que isto faltava, e por que incomodava ────────────────────────────
 * O produto se orgulha de minimizar endereço: `ip.ts` guarda hash com sal, e o
 * expurgo por retenção zera `ipHash`/`userAgent` do consentimento. Só que o
 * `AuditLog` gravava o IP EM CLARO e nada, em lugar nenhum, o apagava — ele
 * acumulava indefinidamente o endereço real de candidatos e de usuários. É a
 * contradição exata da política que o resto do sistema cumpre (LGPD art. 6º VII
 * e art. 16), e numa auditoria de titular o IP perpétuo é o dado mais difícil
 * de justificar.
 *
 * Apaga a LINHA inteira, e não só o IP: registro de auditoria sem endereço e
 * sem agente não reconstrói nada — guardá-lo pela metade seria manter o custo
 * de armazenamento e perder a utilidade, que é o pior dos dois mundos.
 */
export async function expurgarAuditoriaVencida(opcoes?: {
  agora?: Date;
  meses?: number;
  /** Igual ao expurgo por retenção: nada é apagado sem pedir. */
  simular?: boolean;
}) {
  const agora = opcoes?.agora ?? new Date();
  const meses = opcoes?.meses ?? MESES_DE_AUDITORIA;
  const corte = new Date(agora);
  corte.setMonth(corte.getMonth() - meses);

  const onde = { createdAt: { lt: corte } };

  if (opcoes?.simular !== false) {
    return { corte, apagados: await prisma.auditLog.count({ where: onde }), simulado: true };
  }

  const { count } = await prisma.auditLog.deleteMany({ where: onde });
  return { corte, apagados: count, simulado: false };
}
