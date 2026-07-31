import { prisma } from "@/lib/prisma";
import { FATORES, type Fator } from "@/lib/instrument/types";

/**
 * Consultas do painel.
 *
 * Toda função aqui recebe `organizationId` como PRIMEIRO argumento, sempre
 * obrigatório. Não é estilo: é o que impede que uma consulta nova esqueça o
 * escopo e leia a base de outro cliente.
 */

export type ResumoDoPainel = Awaited<ReturnType<typeof resumoDoPainel>>;

export async function resumoDoPainel(organizationId: string) {
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 3600 * 1000);
  const sessentaDiasAtras = new Date(Date.now() - 60 * 24 * 3600 * 1000);

  const [
    candidatos,
    vagasAbertas,
    concluidas,
    pendentes,
    emAndamento,
    concluidasNoPeriodo,
    concluidasNoPeriodoAnterior,
    convitesPendentes,
  ] = await Promise.all([
    prisma.candidate.count({ where: { organizationId } }),
    prisma.job.count({ where: { organizationId, status: "OPEN" } }),
    prisma.assessment.count({ where: { organizationId, status: "COMPLETED" } }),
    prisma.assessment.count({ where: { organizationId, status: "PENDING" } }),
    prisma.assessment.count({ where: { organizationId, status: "IN_PROGRESS" } }),
    prisma.assessment.count({
      where: {
        organizationId,
        status: "COMPLETED",
        completedAt: { gte: trintaDiasAtras },
      },
    }),
    prisma.assessment.count({
      where: {
        organizationId,
        status: "COMPLETED",
        completedAt: { gte: sessentaDiasAtras, lt: trintaDiasAtras },
      },
    }),
    prisma.invitation.count({
      where: { organizationId, status: { in: ["PENDING", "SENT", "OPENED"] } },
    }),
  ]);

  const agregado = await prisma.assessment.aggregate({
    where: { organizationId, status: "COMPLETED" },
    _avg: { fitScore: true, durationMs: true },
  });

  return {
    candidatos,
    vagasAbertas,
    concluidas,
    pendentes: pendentes + convitesPendentes,
    emAndamento,
    concluidasNoPeriodo,
    concluidasNoPeriodoAnterior,
    aderenciaMedia: agregado._avg.fitScore ?? null,
    duracaoMedia: agregado._avg.durationMs ?? null,
  };
}

/** Média por fator da empresa — o "perfil médio" que o painel executivo mostra. */
export async function mediaPorFator(organizationId: string) {
  const avaliacoes = await prisma.assessment.findMany({
    where: { organizationId, status: "COMPLETED", scores: { not: undefined } },
    select: { scores: true },
  });

  if (avaliacoes.length === 0) return null;

  const soma = { C: 0, E: 0, X: 0, A: 0, O: 0 } as Record<Fator, number>;
  let n = 0;

  for (const { scores } of avaliacoes) {
    const e = scores as Record<string, number> | null;
    if (!e) continue;
    for (const f of FATORES) soma[f] += e[f] ?? 0;
    n++;
  }

  if (n === 0) return null;
  return {
    n,
    medias: Object.fromEntries(
      FATORES.map((f) => [f, Math.round((soma[f] / n) * 10) / 10]),
    ) as Record<Fator, number>,
  };
}

/** Melhores aderências entre todas as vagas abertas. */
export async function melhoresAderencias(organizationId: string, limite = 6) {
  return prisma.assessment.findMany({
    where: {
      organizationId,
      status: "COMPLETED",
      fitScore: { not: null },
      job: { status: { in: ["OPEN", "PAUSED"] } },
    },
    orderBy: { fitScore: "desc" },
    take: limite,
    select: {
      id: true,
      fitScore: true,
      confidence: true,
      archetypeId: true,
      completedAt: true,
      candidate: { select: { id: true, name: true } },
      job: { select: { id: true, title: true } },
    },
  });
}

/** Respostas concluídas por semana, nas últimas 12 semanas. */
export async function volumePorSemana(organizationId: string) {
  const desde = new Date(Date.now() - 84 * 24 * 3600 * 1000);

  const avaliacoes = await prisma.assessment.findMany({
    where: {
      organizationId,
      status: "COMPLETED",
      completedAt: { gte: desde },
    },
    select: { completedAt: true },
    orderBy: { completedAt: "asc" },
  });

  const baldes = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.now() - i * 7 * 24 * 3600 * 1000);
    baldes.set(chaveDaSemana(d), 0);
  }

  for (const { completedAt } of avaliacoes) {
    if (!completedAt) continue;
    const chave = chaveDaSemana(completedAt);
    if (baldes.has(chave)) baldes.set(chave, (baldes.get(chave) ?? 0) + 1);
  }

  return [...baldes.entries()].map(([semana, total]) => ({ semana, total }));
}

function chaveDaSemana(d: Date) {
  const copia = new Date(d);
  copia.setHours(0, 0, 0, 0);
  copia.setDate(copia.getDate() - copia.getDay());
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(copia);
}

/** Distribuição de arquétipos — camada de comunicação, nunca de ranking (§6). */
export async function distribuicaoDeArquetipos(organizationId: string) {
  const linhas = await prisma.assessment.groupBy({
    by: ["archetypeId"],
    where: { organizationId, status: "COMPLETED", archetypeId: { not: null } },
    _count: { _all: true },
  });

  return linhas
    .filter((l) => l.archetypeId)
    .map((l) => ({ id: l.archetypeId as string, total: l._count._all }))
    .sort((a, b) => b.total - a.total);
}

/** Uso do mês corrente, para o controle de limites do plano. */
export async function usoDoMes(organizationId: string) {
  const inicioDoMes = new Date();
  inicioDoMes.setDate(1);
  inicioDoMes.setHours(0, 0, 0, 0);

  const [avaliacoesNoMes, vagasAtivas, usuarios] = await Promise.all([
    prisma.assessment.count({
      where: { organizationId, createdAt: { gte: inicioDoMes } },
    }),
    prisma.job.count({
      where: { organizationId, status: { in: ["OPEN", "PAUSED"] } },
    }),
    prisma.user.count({ where: { organizationId, isActive: true } }),
  ]);

  return { avaliacoesNoMes, vagasAtivas, usuarios };
}

// ─── Relatórios agregados ──────────────────────────────────────────────────

/** Desempenho por vaga: convite → resposta, e aderência média. */
export async function desempenhoPorVaga(organizationId: string) {
  const vagas = await prisma.job.findMany({
    where: { organizationId, status: { in: ["OPEN", "PAUSED", "CLOSED"] } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      status: true,
      department: true,
      _count: { select: { invitations: true } },
      assessments: {
        select: { status: true, fitScore: true, durationMs: true },
      },
    },
  });

  return vagas.map((vaga) => {
    const concluidas = vaga.assessments.filter((a) => a.status === "COMPLETED");
    const soma = concluidas.reduce((a, b) => a + (b.fitScore ?? 0), 0);
    const tempo = concluidas.reduce((a, b) => a + (b.durationMs ?? 0), 0);

    return {
      id: vaga.id,
      titulo: vaga.title,
      status: vaga.status,
      departamento: vaga.department,
      convites: vaga._count.invitations,
      iniciadas: vaga.assessments.length,
      concluidas: concluidas.length,
      conversao:
        vaga.assessments.length > 0
          ? (concluidas.length / vaga.assessments.length) * 100
          : null,
      aderenciaMedia: concluidas.length > 0 ? soma / concluidas.length : null,
      duracaoMedia: concluidas.length > 0 ? tempo / concluidas.length : null,
    };
  });
}

/** Distribuição do selo de confiança — a saúde da própria base de respostas. */
export async function distribuicaoDeConfianca(organizationId: string) {
  const avaliacoes = await prisma.assessment.findMany({
    where: { organizationId, status: "COMPLETED" },
    select: { confidence: true },
  });

  const contagem = { alta: 0, media: 0, baixa: 0 };
  for (const { confidence } of avaliacoes) {
    const c = confidence as { selo?: keyof typeof contagem } | null;
    if (c?.selo && c.selo in contagem) contagem[c.selo]++;
  }
  return { ...contagem, total: avaliacoes.length };
}

/**
 * Funil da resposta.
 *
 * Conta AVALIAÇÕES, não convites: quem entra pelo link público da vaga gera
 * avaliação sem passar por convite. Contar convite fazia a mesma tela exibir
 * "13 respostas concluídas" ao lado de "1 de 2" — dois números verdadeiros que
 * juntos pareciam erro.
 */
export async function funilDeRespostas(organizationId: string) {
  const linhas = await prisma.assessment.groupBy({
    by: ["status"],
    where: { organizationId },
    _count: { _all: true },
  });

  const por = (chaves: string[]) =>
    linhas
      .filter((l) => chaves.includes(l.status))
      .reduce((a, b) => a + b._count._all, 0);

  return {
    convidados: linhas.reduce((a, b) => a + b._count._all, 0),
    iniciados: por(["IN_PROGRESS", "COMPLETED"]),
    concluidos: por(["COMPLETED"]),
  };
}
