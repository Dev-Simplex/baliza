"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { registrarAuditoria } from "@/lib/audit";
import { normalizarCodigo, sortearCodigoLivre } from "@/lib/codigo-de-acesso";
import { ipAnonimoDaRequisicao } from "@/lib/ip";
import { pendenciasDaProva } from "@/lib/actions/pendencias-da-prova";
import { prisma } from "@/lib/prisma";
import { limitarPorIp } from "@/lib/rate-limit";
import { ITEM_POR_ID, VERSAO_DO_INSTRUMENTO } from "@/lib/instrument/items";
import { CENARIO_POR_ID } from "@/lib/instrument/scenarios";
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

/**
 * `ipHash` é a evidência de que o consentimento partiu de algum lugar — e
 * evidência forjável é pior que evidência nenhuma, porque convence.
 *
 * A resolução do endereço mora em `@/lib/ip`, num lugar só: ler
 * `x-forwarded-for` na mão pegava o PRIMEIRO item da cadeia, que é justamente
 * o que o cliente escreveu. Esta era a terceira cópia do mesmo engano no
 * código.
 */
async function hashDoIp() {
  return ipAnonimoDaRequisicao(32);
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
    return {
      // O limite é por IP, e IP de empresa, escola ou wi-fi de evento é
      // compartilhado por muita gente: sem o caminho alternativo, o candidato
      // legítimo lê "tente mais tarde" e some.
      erro: "Muitas tentativas vindas desta rede. Tente daqui a pouco ou peça à empresa um link pessoal ou um código de 4 dígitos.",
    };

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

  // Já concluiu: cai na tela de conclusão do próprio convite. Note que sem
  // convite não há para onde mandar — é o caso da avaliação criada por fora do
  // fluxo, e aí a mensagem honesta é a de que não há mais o que responder.
  if (existente?.status === "COMPLETED" && existente.invitation)
    redirect(`/t/${existente.invitation.token}`);

  if (existente?.status === "COMPLETED")
    return { erro: "Você já respondeu esta vaga. O acompanhamento é feito pela empresa." };

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

  // Terceira via de entrada (link, QR, código). Vem null quando o acervo de
  // 4 dígitos está cheio: o convite continua valendo por link e QR.
  const codigo = await sortearCodigoLivre();

  const convite = await prisma.invitation.create({
    data: {
      organizationId: opcoes.organizationId,
      jobId: opcoes.jobId,
      candidateId: opcoes.candidateId,
      email: opcoes.email ?? null,
      accessCode: codigo,
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
          // Consentimento é registro do que a PESSOA fez, não do que o RH fez.
          // Pelo link público ela marcou a caixa segundos atrás; por convite,
          // quem criou foi a empresa, e carimbar consentimento ali seria
          // inventar um aceite que nunca houve. Nesse caso o carimbo sai no
          // "Começar", que é onde o aviso é lido e o aceite acontece de fato.
          consentAt: opcoes.canal === "LINK" ? new Date() : null,
          ipHash: await hashDoIp(),
        },
      },
    },
  });

  return convite.token;
}

/**
 * Entrada pelo CÓDIGO de 4 dígitos — a terceira via, ao lado do link e do QR.
 *
 * O código é a mesma chave do link, não uma senha. Quem segura a varredura das
 * 10.000 combinações é o `limitarPorIp` — mas atenção ao que ele consegue
 * prometer: as "seis por hora" só valem quando o endereço é confiável
 * (`TRUSTED_PROXIES >= 1`). Sem proxy na frente, o cabeçalho é do cliente e
 * quem segura é o TETO GLOBAL por ação. A conta real está documentada em
 * `rate-limit.ts`; não repita número aqui, que foi assim que a promessa
 * antiga passou meses errada.
 */
export async function entrarPeloCodigo(
  _estado: EstadoDaEntrada,
  dados: FormData,
): Promise<EstadoDaEntrada> {
  const limite = await limitarPorIp("acesso-por-codigo", {
    max: 6,
    janelaSegundos: 3600,
  });
  if (!limite.permitido)
    return {
      erro: "Muitas tentativas deste dispositivo. Tente daqui a pouco ou use o link que você recebeu.",
    };

  // Os quatro campos da tela mandam o mesmo nome; juntos, na ordem do
  // documento, formam o código. `getAll` também aceita o campo único de quem
  // digitou tudo numa caixa só.
  const codigo = normalizarCodigo(dados.getAll("codigo").join(""));
  if (codigo.length !== 4) return { campos: { codigo: "Digite os 4 dígitos" } };

  const convite = await prisma.invitation.findUnique({
    where: { accessCode: codigo },
    include: { assessment: { select: { status: true } } },
  });

  // Mensagem única para código inexistente e para código expirado: dizer "esse
  // código existe, mas venceu" já entrega informação para quem está tentando na
  // sorte. A menção ao código que já foi usado entra pelo mesmo motivo pelo
  // qual ela é necessária — o código volta ao acervo quando a prova conclui,
  // então quem já respondeu cai exatamente nesta mensagem e precisa entender
  // que não errou a digitação.
  if (!convite || convite.expiresAt < new Date())
    return {
      erro: "Código não encontrado. Confira os dígitos com quem te enviou — e, se você já concluiu, o código deixa de valer: não é preciso responder de novo.",
    };

  if (convite.assessment?.status === "COMPLETED")
    redirect(`/t/${convite.token}`);

  redirect(`/t/${convite.token}`);
}

/**
 * Marca o início. Idempotente: recarregar a página não zera o cronômetro.
 *
 * Devolve `ok` porque a tela de abertura precisa saber quando não deu: antes,
 * uma falha aqui era silenciosa e o botão "Começar" simplesmente não fazia
 * nada, o que é indistinguível de um toque que não pegou.
 */
export async function iniciarAvaliacao(token: string) {
  const convite = await prisma.invitation.findUnique({
    where: { token },
    include: { assessment: true },
  });
  if (!convite?.assessment) return { ok: false as const, erro: "Convite não encontrado" };

  if (convite.assessment.status === "PENDING") {
    const agora = new Date();
    await prisma.$transaction([
      prisma.assessment.update({
        where: { id: convite.assessment.id },
        data: {
          status: "IN_PROGRESS",
          startedAt: agora,
          lastSeenAt: agora,
          // O aceite de quem foi convidado acontece aqui, ao começar depois de
          // ler o aviso — e não quando o RH criou o convite.
          consentAt: convite.assessment.consentAt ?? agora,
        },
      }),
      prisma.invitation.update({
        where: { id: convite.id },
        data: { status: "STARTED", openedAt: convite.openedAt ?? agora },
      }),
    ]);
  }

  return { ok: true as const };
}

const TEMPO_MAXIMO_POR_PERGUNTA_MS = 600_000;

const esquemaDeResposta = z.object({
  itemId: z.string().min(1),
  valor: z.number().int().min(1).max(5),
  tempoMs: z.number().int().min(0).max(TEMPO_MAXIMO_POR_PERGUNTA_MS).optional(),
});

/**
 * O cronômetro nunca pode derrubar a resposta.
 *
 * Quem deixa a aba aberta durante o almoço voltava com um `tempoMs` acima do
 * teto, e a gravação inteira era recusada como "resposta inválida" — a resposta
 * de quem pensou mais era exatamente a que se perdia. O tempo é sinal
 * acessório do selo de confiança, e o selo só olha para tempo CURTO demais:
 * aparar o longo não custa nada a ele.
 */
function tempoDentroDoTeto(tempoMs?: number) {
  if (tempoMs == null || !Number.isFinite(tempoMs)) return undefined;
  return Math.min(TEMPO_MAXIMO_POR_PERGUNTA_MS, Math.max(0, Math.round(tempoMs)));
}

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
  const analise = esquemaDeResposta.safeParse({
    ...entrada,
    tempoMs: tempoDentroDoTeto(entrada.tempoMs),
  });
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

  // As duas ações precisam ser opções DESTE bloco. A conferência espelha a que
  // o item já tinha: sem ela dá pra gravar um par de ids inventados, e o escore
  // ipsativo passa a ler ação que não existe em cenário nenhum.
  const bloco = CENARIO_POR_ID.get(entrada.blocoId);
  const opcoes = new Set(bloco?.opcoes.map((o) => o.id) ?? []);
  if (!opcoes.has(entrada.primeiraId) || !opcoes.has(entrada.ultimaId))
    return { ok: false, erro: "Escolha fora deste cenário" };

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
      elapsedMs: tempoDentroDoTeto(entrada.tempoMs) ?? null,
    },
    update: {
      firstActionId: entrada.primeiraId,
      lastActionId: entrada.ultimaId,
      elapsedMs: tempoDentroDoTeto(entrada.tempoMs) ?? null,
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

  // Reenvio de quem tocou duas vezes: já concluída é sucesso, não erro.
  if (avaliacao.status === "COMPLETED") return { ok: true as const };

  const itensDaForma = (avaliacao.itemOrder as string[]) ?? [];
  const cenariosDaForma = (avaliacao.scenarioOrder as string[]) ?? [];

  // Os cenários entram na mesma conferência que as afirmações. Eles não entram
  // no ranking (§5: escore ipsativo compara dimensões dentro da pessoa, não
  // pessoas entre si), mas alimentam a leitura qualitativa — e a prova que a
  // tela exige são as `TOTAL_DE_TELAS`, não só as afirmações. Concluir com um
  // bloco a menos entregaria um relatório mais pobre sem ninguém perceber.
  const pendencias = pendenciasDaProva({
    itensDaForma,
    cenariosDaForma,
    itensRespondidos: avaliacao.responses.map((r) => r.itemId),
    cenariosRespondidos: avaliacao.scenarioResponses.map((r) => r.blockId),
    itemVisivel: (id) => ITEM_POR_ID.has(id),
    cenarioVisivel: (id) => CENARIO_POR_ID.has(id),
  });

  const totalFaltando = pendencias.total;

  if (totalFaltando > 0)
    return {
      ok: false as const,
      // `incompleta` diz à tela para recarregar e cair na primeira em branco:
      // se o salvamento de alguma resposta falhou, o navegador acha que está
      // tudo respondido e o candidato ficaria preso sem saber qual é a que
      // falta.
      incompleta: true as const,
      erro:
        totalFaltando === 1
          ? "Falta 1 resposta. Vamos voltar até ela."
          : `Faltam ${totalFaltando} respostas. Vamos voltar até a primeira.`,
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
      // O código volta ao acervo: são só 10.000, e é a reciclagem que permite
      // que 4 dígitos bastem. Quem quiser rever o resultado usa o link de
      // resultado, que é para sempre.
      data: { status: "COMPLETED", accessCode: null },
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

  return { ok: true as const };
}
