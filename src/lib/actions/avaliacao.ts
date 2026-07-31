"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { limitarPorIp } from "@/lib/rate-limit";
import { VERSAO_DO_INSTRUMENTO } from "@/lib/instrument/items";
import { montarForma } from "@/lib/instrument/form";
import { escorar } from "@/lib/instrument/scoring";
import type { PerfilAlvo, RespostaDeCenario, Respostas } from "@/lib/instrument/types";

/**
 * Ações do fluxo do candidato.
 *
 * Nenhuma delas exige sessão: o candidato não tem conta e não vai criar uma.
 * A autorização é o token não-adivinhável do convite, e cada ação confere o
 * estado da avaliação antes de escrever — token válido não é permissão para
 * responder duas vezes nem para reabrir prova concluída.
 */

const esquemaDeEntrada = z.object({
  nome: z.string().min(2, "Informe seu nome completo"),
  email: z.string().email("E-mail inválido"),
  consentimento: z.literal("on", {
    message: "É preciso concordar para continuar",
  }),
});

export type EstadoDaEntrada = {
  erro?: string;
  campos?: Record<string, string>;
};

async function hashDoIp() {
  const h = await headers();
  const bruto =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "";
  if (!bruto) return null;
  return createHash("sha256")
    .update(`${bruto}:${process.env.AUTH_SECRET ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

/** Entrada pelo link público da vaga. */
export async function entrarPeloLinkDaVaga(
  publicToken: string,
  _estado: EstadoDaEntrada,
  dados: FormData,
): Promise<EstadoDaEntrada> {
  const limite = await limitarPorIp("entrada-vaga", {
    max: 12,
    janelaSegundos: 3600,
  });
  if (!limite.permitido)
    return { erro: "Muitas tentativas deste dispositivo. Tente mais tarde." };

  const analise = esquemaDeEntrada.safeParse({
    nome: dados.get("nome"),
    email: dados.get("email"),
    consentimento: dados.get("consentimento"),
  });

  if (!analise.success) {
    const campos: Record<string, string> = {};
    for (const p of analise.error.issues) campos[String(p.path[0])] = p.message;
    return { campos };
  }

  const vaga = await prisma.job.findUnique({
    where: { publicToken },
    select: {
      id: true,
      organizationId: true,
      publicEnabled: true,
      status: true,
    },
  });

  if (!vaga || !vaga.publicEnabled || vaga.status !== "OPEN")
    return { erro: "Esta vaga não está mais recebendo respostas." };

  const email = analise.data.email.toLowerCase().trim();

  const candidato = await prisma.candidate.upsert({
    where: {
      organizationId_email: { organizationId: vaga.organizationId, email },
    },
    create: {
      organizationId: vaga.organizationId,
      name: analise.data.nome.trim(),
      email,
    },
    update: { name: analise.data.nome.trim() },
  });

  // Já respondeu esta vaga? Devolve o resultado em vez de duplicar.
  const existente = await prisma.assessment.findFirst({
    where: { jobId: vaga.id, candidateId: candidato.id },
    include: { invitation: true },
    orderBy: { createdAt: "desc" },
  });

  if (existente?.status === "COMPLETED")
    redirect(`/r/${existente.resultToken}`);

  if (existente?.invitation) redirect(`/t/${existente.invitation.token}`);

  const token = await criarAvaliacao({
    organizationId: vaga.organizationId,
    jobId: vaga.id,
    candidateId: candidato.id,
    canal: "LINK",
  });

  redirect(`/t/${token}`);
}

/**
 * Cria convite + avaliação com a forma já sorteada.
 *
 * A forma é sorteada AQUI, no início, e gravada: se fosse sorteada a cada
 * carregamento, retomar a prova mostraria itens diferentes e o escore misturaria
 * duas provas distintas.
 */
export async function criarAvaliacao(opcoes: {
  organizationId: string;
  jobId: string;
  candidateId: string;
  canal: "EMAIL" | "LINK" | "QRCODE";
  email?: string | null;
  criadoPor?: string | null;
  validadeEmDias?: number;
}) {
  // Itens que esta pessoa já respondeu antes, para não repetir (histórico).
  const anteriores = await prisma.assessment.findMany({
    where: { candidateId: opcoes.candidateId, status: "COMPLETED" },
    select: { itemOrder: true },
    orderBy: { completedAt: "desc" },
    take: 2,
  });
  const jaVistos = anteriores.flatMap((a) => (a.itemOrder as string[]) ?? []);

  const semente = `${opcoes.candidateId}:${opcoes.jobId}:${Date.now()}`;
  const forma = montarForma({
    semente,
    versao: VERSAO_DO_INSTRUMENTO,
    excluir: jaVistos,
  });

  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + (opcoes.validadeEmDias ?? 30));

  const convite = await prisma.invitation.create({
    data: {
      organizationId: opcoes.organizationId,
      jobId: opcoes.jobId,
      candidateId: opcoes.candidateId,
      email: opcoes.email ?? null,
      channel: opcoes.canal,
      status: opcoes.canal === "EMAIL" ? "PENDING" : "OPENED",
      expiresAt: expiraEm,
      createdById: opcoes.criadoPor ?? null,
      assessment: {
        create: {
          organizationId: opcoes.organizationId,
          jobId: opcoes.jobId,
          candidateId: opcoes.candidateId,
          status: "PENDING",
          instrumentVersion: VERSAO_DO_INSTRUMENTO,
          seed: semente,
          itemOrder: forma.itens as never,
          scenarioOrder: forma.cenarios as never,
          consentAt: new Date(),
          ipHash: await hashDoIp(),
        },
      },
    },
  });

  return convite.token;
}

/** Marca o início. Idempotente: recarregar a página não zera o cronômetro. */
export async function iniciarAvaliacao(token: string) {
  const convite = await prisma.invitation.findUnique({
    where: { token },
    include: { assessment: true },
  });
  if (!convite?.assessment) return;

  if (convite.assessment.status === "PENDING") {
    await prisma.$transaction([
      prisma.assessment.update({
        where: { id: convite.assessment.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: new Date(),
          lastSeenAt: new Date(),
        },
      }),
      prisma.invitation.update({
        where: { id: convite.id },
        data: { status: "STARTED", openedAt: convite.openedAt ?? new Date() },
      }),
    ]);
  }
}

const esquemaDeResposta = z.object({
  itemId: z.string().min(1),
  valor: z.number().int().min(1).max(5),
  tempoMs: z.number().int().min(0).max(600000).optional(),
});

/**
 * Salvamento automático de uma resposta.
 *
 * Chamada a cada clique. É upsert: a pessoa pode voltar e trocar a resposta
 * antes de concluir, e o registro não duplica.
 */
export async function salvarResposta(
  token: string,
  entrada: { itemId: string; valor: number; tempoMs?: number },
) {
  const analise = esquemaDeResposta.safeParse(entrada);
  if (!analise.success) return { ok: false, erro: "Resposta inválida" };

  const convite = await prisma.invitation.findUnique({
    where: { token },
    include: { assessment: { select: { id: true, status: true, itemOrder: true } } },
  });

  const avaliacao = convite?.assessment;
  if (!avaliacao) return { ok: false, erro: "Convite não encontrado" };
  if (avaliacao.status === "COMPLETED")
    return { ok: false, erro: "Esta avaliação já foi concluída" };

  // O item precisa pertencer À FORMA desta pessoa: sem isso, dá pra injetar
  // resposta de qualquer item do banco e mexer no escore.
  const daForma = (avaliacao.itemOrder as string[]) ?? [];
  if (!daForma.includes(analise.data.itemId))
    return { ok: false, erro: "Item fora desta avaliação" };

  await prisma.itemResponse.upsert({
    where: {
      assessmentId_itemId: {
        assessmentId: avaliacao.id,
        itemId: analise.data.itemId,
      },
    },
    create: {
      assessmentId: avaliacao.id,
      itemId: analise.data.itemId,
      value: analise.data.valor,
      elapsedMs: analise.data.tempoMs ?? null,
    },
    update: {
      value: analise.data.valor,
      elapsedMs: analise.data.tempoMs ?? null,
    },
  });

  await prisma.assessment.update({
    where: { id: avaliacao.id },
    data: { lastSeenAt: new Date() },
  });

  return { ok: true };
}

/** Salvamento automático de um bloco de cenário. */
export async function salvarCenario(
  token: string,
  entrada: {
    blocoId: string;
    primeiraId: string;
    ultimaId: string;
    tempoMs?: number;
  },
) {
  const convite = await prisma.invitation.findUnique({
    where: { token },
    include: { assessment: { select: { id: true, status: true, scenarioOrder: true } } },
  });

  const avaliacao = convite?.assessment;
  if (!avaliacao) return { ok: false, erro: "Convite não encontrado" };
  if (avaliacao.status === "COMPLETED")
    return { ok: false, erro: "Esta avaliação já foi concluída" };
  if (entrada.primeiraId === entrada.ultimaId)
    return { ok: false, erro: "As duas escolhas precisam ser diferentes" };

  const daForma = (avaliacao.scenarioOrder as string[]) ?? [];
  if (!daForma.includes(entrada.blocoId))
    return { ok: false, erro: "Cenário fora desta avaliação" };

  await prisma.scenarioResponse.upsert({
    where: {
      assessmentId_blockId: {
        assessmentId: avaliacao.id,
        blockId: entrada.blocoId,
      },
    },
    create: {
      assessmentId: avaliacao.id,
      blockId: entrada.blocoId,
      firstActionId: entrada.primeiraId,
      lastActionId: entrada.ultimaId,
      elapsedMs: entrada.tempoMs ?? null,
    },
    update: {
      firstActionId: entrada.primeiraId,
      lastActionId: entrada.ultimaId,
      elapsedMs: entrada.tempoMs ?? null,
    },
  });

  await prisma.assessment.update({
    where: { id: avaliacao.id },
    data: { lastSeenAt: new Date() },
  });

  return { ok: true };
}

/**
 * Encerramento: roda a escoragem e grava o resultado.
 *
 * O escore é calculado NO SERVIDOR, a partir das respostas gravadas — nunca do
 * que o navegador manda. É a única forma de o número significar alguma coisa.
 */
export async function concluirAvaliacao(token: string) {
  const convite = await prisma.invitation.findUnique({
    where: { token },
    include: {
      assessment: {
        include: {
          responses: true,
          scenarioResponses: true,
          job: { select: { targetProfile: true } },
        },
      },
    },
  });

  const avaliacao = convite?.assessment;
  if (!avaliacao) return { ok: false as const, erro: "Convite não encontrado" };

  if (avaliacao.status === "COMPLETED")
    return { ok: true as const, resultToken: avaliacao.resultToken };

  const itensDaForma = (avaliacao.itemOrder as string[]) ?? [];
  const respondidos = new Set(avaliacao.responses.map((r) => r.itemId));
  const faltando = itensDaForma.filter((id) => !respondidos.has(id));

  if (faltando.length > 0)
    return {
      ok: false as const,
      erro: `Ainda faltam ${faltando.length} ${faltando.length === 1 ? "afirmação" : "afirmações"}.`,
    };

  const respostas: Respostas = {};
  for (const r of avaliacao.responses) respostas[r.itemId] = r.value;

  const respostasDeCenario: RespostaDeCenario[] = avaliacao.scenarioResponses.map(
    (r) => ({
      blocoId: r.blockId,
      primeiraId: r.firstActionId,
      ultimaId: r.lastActionId,
    }),
  );

  const agora = new Date();
  const duracaoMs = avaliacao.startedAt
    ? agora.getTime() - avaliacao.startedAt.getTime()
    : avaliacao.responses.reduce((a, r) => a + (r.elapsedMs ?? 0), 0);

  const resultado = escorar({
    respostas,
    itensDaForma,
    perfilAlvo: avaliacao.job.targetProfile as unknown as PerfilAlvo,
    respostasDeCenario,
    duracaoMs,
  });

  await prisma.$transaction([
    prisma.assessment.update({
      where: { id: avaliacao.id },
      data: {
        status: "COMPLETED",
        completedAt: agora,
        durationMs: duracaoMs,
        scores: resultado.escores as never,
        facetNotes: resultado.facetas as never,
        fitScore: resultado.fit.score,
        fitDetail: {
          puxaramPraCima: resultado.fit.puxaramPraCima,
          puxaramPraBaixo: resultado.fit.puxaramPraBaixo,
          ignoradas: resultado.fit.ignoradas,
          contribuicoes: resultado.fit.contribuicoes,
        } as never,
        confidence: resultado.confianca as never,
        archetypeId: resultado.arquetipo.id,
        archetypeMixedWith: resultado.arquetipo.segundoId ?? null,
      },
    }),
    prisma.invitation.update({
      where: { id: convite.id },
      data: { status: "COMPLETED" },
    }),
  ]);

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: "avaliacao_concluida",
    organizationId: avaliacao.organizationId,
    entidade: "Assessment",
    entidadeId: avaliacao.id,
    metadados: { fit: resultado.fit.score, selo: resultado.confianca.selo },
  });

  return { ok: true as const, resultToken: avaliacao.resultToken };
}
