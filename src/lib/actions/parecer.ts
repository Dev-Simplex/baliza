"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { exigirPermissao } from "@/lib/tenant";

export type EstadoDoParecer = {
  ok?: boolean;
  erro?: string;
};

/** O limite existe para a caixa ser um PARECER, e não o lugar do currículo. */
const MAXIMO_DA_NOTA = 2000;

const esquema = z.object({
  decisao: z.enum(["ADVANCE", "DOUBT", "REJECT"]),
  nota: z.string().max(MAXIMO_DA_NOTA, "A anotação ficou longa demais").optional(),
});

/**
 * Registra o parecer do analista sobre uma avaliação.
 *
 * ─── Por que isto passou a existir ─────────────────────────────────────────
 * O relatório em PDF já trazia uma caixa "Parecer do analista" com três
 * quadradinhos para preencher à CANETA, e não havia campo nenhum no sistema
 * para guardar o que fosse decidido. O produto existe para embasar uma decisão
 * e era exatamente a decisão que ele não registrava.
 *
 * ─── O que muda com o parecer gravado ──────────────────────────────────────
 * · a lista passa a responder "quem eu já avaliei e o que decidi";
 * · "sem parecer" vira uma pilha de trabalho visível, em vez de memória;
 * · fica registrado que houve PESSOA decidindo — que é o que o art. 20 da LGPD
 *   pede quando alguém questiona uma decisão tomada com apoio de sistema.
 *
 * ─── Decisões desta ação ───────────────────────────────────────────────────
 * `exigirPermissao("parecer:escrever")` e `organizationId` DENTRO do `where`: o
 * parecer é escrita sobre dado de candidato, e o escopo nunca é conferido
 * depois de buscar.
 *
 * A avaliação precisa estar CONCLUÍDA. Parecer sobre prova pela metade seria
 * decidir com meia informação — e o resultado que embasa a decisão só existe
 * quando ela termina.
 *
 * Reescrever é permitido de propósito: mudar de ideia depois da entrevista é o
 * caminho normal, e travar a decisão obrigaria o RH a manter a versão certa
 * fora daqui — que é a situação de onde estamos saindo. Cada mudança entra na
 * auditoria com o valor anterior, então o histórico não se perde.
 */
export async function registrarParecer(
  avaliacaoId: string,
  _estado: EstadoDoParecer,
  dados: FormData,
): Promise<EstadoDoParecer> {
  const contexto = await exigirPermissao("parecer:escrever");

  const analise = esquema.safeParse({
    decisao: dados.get("decisao"),
    nota: dados.get("nota") ?? undefined,
  });

  if (!analise.success)
    return { erro: analise.error.issues[0]?.message ?? "Parecer inválido." };

  const avaliacao = await prisma.assessment.findFirst({
    where: { id: avaliacaoId, organizationId: contexto.organizationId },
    select: {
      id: true,
      status: true,
      decision: true,
      candidateId: true,
      candidate: { select: { name: true } },
      job: { select: { title: true } },
    },
  });

  if (!avaliacao) return { erro: "Avaliação não encontrada." };
  if (avaliacao.status !== "COMPLETED")
    return { erro: "Esta pessoa ainda não terminou a prova." };

  const nota = analise.data.nota?.trim() || null;

  await prisma.assessment.update({
    where: { id: avaliacao.id },
    data: {
      decision: analise.data.decisao,
      decisionNote: nota,
      decidedAt: new Date(),
      decidedById: contexto.userId,
    },
  });

  await registrarAuditoria({
    categoria: "MUTATION",
    // A ação diz se é o primeiro parecer ou uma revisão. São eventos diferentes
    // para quem audita: registrar é o curso normal; mudar depois de registrado
    // é o que alguém vai querer entender.
    acao: avaliacao.decision ? "parecer_alterado" : "parecer_registrado",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Assessment",
    entidadeId: avaliacao.id,
    metadados: {
      vaga: avaliacao.job.title,
      de: avaliacao.decision,
      para: analise.data.decisao,
      // A anotação NÃO entra na auditoria: ela é texto livre sobre uma pessoa,
      // e copiá-la para uma segunda tabela multiplicaria o dado pessoal sem
      // necessidade. O que a auditoria precisa provar é quem decidiu o quê e
      // quando — e isso está aqui.
      temAnotacao: Boolean(nota),
    },
  });

  revalidatePath(`/candidatos/${avaliacao.candidateId}`);
  revalidatePath("/candidatos");
  revalidatePath("/dashboard");

  return { ok: true };
}

/**
 * Apaga o parecer, devolvendo a avaliação para a pilha de "sem parecer".
 *
 * Existe porque parecer em pessoa errada acontece — duas abas, homônimos — e
 * sem isto a única saída seria deixar registrado algo que não é verdade. A
 * remoção é auditada com o valor que havia, então nada some sem rastro.
 */
export async function limparParecer(
  avaliacaoId: string,
): Promise<EstadoDoParecer> {
  const contexto = await exigirPermissao("parecer:escrever");

  const avaliacao = await prisma.assessment.findFirst({
    where: { id: avaliacaoId, organizationId: contexto.organizationId },
    select: { id: true, decision: true, candidateId: true, job: { select: { title: true } } },
  });

  if (!avaliacao) return { erro: "Avaliação não encontrada." };
  if (!avaliacao.decision) return { ok: true };

  await prisma.assessment.update({
    where: { id: avaliacao.id },
    data: {
      decision: null,
      decisionNote: null,
      decidedAt: null,
      decidedById: null,
    },
  });

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: "parecer_removido",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Assessment",
    entidadeId: avaliacao.id,
    metadados: { vaga: avaliacao.job.title, de: avaliacao.decision },
  });

  revalidatePath(`/candidatos/${avaliacao.candidateId}`);
  revalidatePath("/candidatos");
  revalidatePath("/dashboard");

  return { ok: true };
}
