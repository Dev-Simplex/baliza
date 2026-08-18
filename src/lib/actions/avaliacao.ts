"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { registrarAuditoria } from "@/lib/audit";
import { normalizarCodigo, sortearCodigoLivre } from "@/lib/codigo-de-acesso";
import { ipAnonimoDaRequisicao } from "@/lib/ip";
import {
  lerProvaDaBateria,
  montarProvaDaBateria,
  opcoesDoBloco,
} from "@/lib/actions/forma-da-bateria";
import { pendenciasDaProva } from "@/lib/actions/pendencias-da-prova";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { limitarPorIp } from "@/lib/rate-limit";
import { ITEM_POR_ID, VERSAO_DO_INSTRUMENTO } from "@/lib/instrument/items";
import { CENARIO_POR_ID } from "@/lib/instrument/scenarios";
import {
  escoresParaFit,
  lerBateria,
  type ResultadosPorModulo,
} from "@/lib/instrument/baterias";
import {
  ITEM_BIG_FIVE_POR_ID,
  paraResultadoDeModuloBigFive,
  pontuarBigFive,
  type RespostasBigFive,
} from "@/lib/instrument/bigfive";
import {
  BLOCO_DISC_POR_ID,
  paraResultadoDeModuloDisc,
  pontuarDisc,
  type RespostaDisc,
} from "@/lib/instrument/disc";
import {
  BLOCO_DISC_PLANILHA_POR_ID,
  pontuarDiscPlanilha,
} from "@/lib/instrument/disc-planilha";
import {
  BLOCO_PERFIL_COMPORTAMENTAL_POR_ID,
  pontuarPerfilComportamental,
} from "@/lib/instrument/perfil-comportamental";
import {
  ITEM_ESTILO_EMOCIONAL_POR_ID,
  pontuarEstiloEmocional,
} from "@/lib/instrument/estilo-emocional";
import {
  CENARIO_SJT_POR_ID,
  paraResultadoDeModuloSjt,
  pontuarSjt,
  type RespostaSjt,
} from "@/lib/instrument/sjt";
import { qualidadeDosModulos, seloQueAcompanha } from "@/lib/analise/modulos";
import { calcularFit, escorar } from "@/lib/instrument/scoring";
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

  /**
   * A corrida existe: entre o `findFirst` acima e a criação abaixo não há
   * transação nenhuma. Dois envios do formulário público — recarregar
   * impaciente numa conexão lenta, dois aparelhos, duas abas — passavam os dois
   * pela leitura e criavam duas avaliações da mesma pessoa na mesma vaga.
   *
   * Agora o banco recusa a segunda (`@@unique([jobId, candidateId])`), e este
   * `catch` transforma a recusa no desfecho certo: quem perdeu a corrida vai
   * para a avaliação que ganhou, em vez de ver um erro por ter clicado duas
   * vezes. Só o conflito de unicidade é tratado assim — qualquer outra falha
   * continua subindo.
   */
  let token: string;
  try {
    token = await criarAvaliacao({
      organizationId: vaga.organizationId,
      jobId: vaga.id,
      candidateId: candidato.id,
      canal: "LINK",
    });
  } catch (erro) {
    const conflito =
      erro instanceof Prisma.PrismaClientKnownRequestError && erro.code === "P2002";
    if (!conflito) throw erro;

    const vencedora = await prisma.assessment.findFirst({
      where: { jobId: vaga.id, candidateId: candidato.id },
      include: { invitation: true },
      orderBy: { createdAt: "desc" },
    });
    if (vencedora?.invitation) redirect(`/t/${vencedora.invitation.token}`);
    return {
      erro: "Não conseguimos abrir sua prova agora. Tente de novo em instantes.",
    };
  }

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
  const [anteriores, vaga] = await Promise.all([
    prisma.assessment.findMany({
      where: { candidateId: opcoes.candidateId, status: "COMPLETED" },
      select: { itemOrder: true },
      orderBy: { completedAt: "desc" },
      take: 2,
    }),
    prisma.job.findUnique({
      where: { id: opcoes.jobId },
      select: { testBattery: true },
    }),
  ]);
  const jaVistos = anteriores.flatMap((a) => (a.itemOrder as string[]) ?? []);

  // A bateria da vaga é COPIADA para a avaliação aqui, e a partir daqui a prova
  // desta pessoa tem vida própria: mexer na vaga amanhã não muda o que ela já
  // começou a responder. Mesma razão de a forma ser sorteada e gravada agora.
  const bateria = lerBateria(vaga?.testBattery);

  const semente = `${opcoes.candidateId}:${opcoes.jobId}:${Date.now()}`;
  // A prova inteira da bateria é sorteada aqui, de uma vez: as afirmações do
  // Baliza e do Big Five em `itemOrder`, os blocos das situações, do DISC e do
  // SJT em `scenarioOrder`. A separação de volta é por banco, em
  // `forma-da-bateria.ts` — que é o único lugar que sabe montar e desmontar.
  const forma = montarProvaDaBateria({ semente, bateria, excluir: jaVistos });

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
          scenarioOrder: forma.blocos as never,
          testBattery: bateria,
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

  /**
   * Convite sem avaliação é beco sem saída, e o beco terminava no próprio
   * ponto de partida.
   *
   * `/t/<token>` faz `notFound()` quando não há avaliação, e a página de "não
   * encontrado" sugere: "recebeu um código de 4 dígitos? entre por /acesso" —
   * de onde a pessoa acabou de vir. Ela volta, digita o mesmo código válido, e
   * cai no mesmo lugar, gastando uma das 6 tentativas por hora a cada volta.
   *
   * Existem convites assim no banco: o `Candidate` foi apagado, o `Assessment`
   * caiu em cascata e o convite sobreviveu, porque `Invitation.candidate` é
   * `SetNull` e `Assessment.candidate` é `Cascade`. Hoje isso vem de fora do
   * app — mas a assimetria dispara sozinha no dia em que a exclusão de
   * candidato por LGPD (prometida na tela de conclusão) for implementada.
   *
   * Aqui a pessoa recebe a informação que resolve o problema dela: este convite
   * não vale mais, peça outro. E o código é devolvido ao acervo, senão ele fica
   * preso para sempre nas 10.000 combinações — a devolução normal só acontece
   * no encerramento da prova, que nunca vai acontecer.
   */
  if (!convite.assessment) {
    await prisma.invitation
      .update({ where: { id: convite.id }, data: { accessCode: null } })
      .catch(() => {
        // Devolver o código é higiene do acervo, não parte da resposta: se
        // falhar, a pessoa ainda precisa ler o motivo.
      });

    return {
      erro: "Este convite não vale mais. Peça um novo para quem te enviou — o código antigo não abre mais nada.",
    };
  }

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

/**
 * O convite, a avaliação e a prova desta pessoa — o preâmbulo idêntico das três
 * ações de salvamento.
 *
 * Ele existe para que as três façam a MESMA pergunta ao mesmo lugar. Enquanto a
 * prova era só a Baliza, cada ação conferia a sua coluna (`itemOrder` de um
 * lado, `scenarioOrder` do outro) e isso bastava. Com quatro testes, "esta
 * pergunta é desta pessoa?" depende da bateria congelada e do banco de cada
 * teste; deixar cada ação responder por conta própria seria o começo de três
 * respostas diferentes — e a divergência aparece do pior jeito, com a tela
 * desenhando uma pergunta que a gravação recusa.
 */
async function abrirProvaParaEscrita(token: string) {
  const convite = await prisma.invitation.findUnique({
    where: { token },
    include: {
      assessment: {
        select: {
          id: true,
          status: true,
          seed: true,
          testBattery: true,
          itemOrder: true,
          scenarioOrder: true,
        },
      },
    },
  });

  const avaliacao = convite?.assessment;
  if (!avaliacao) return { erro: "Convite não encontrado" as const };
  if (avaliacao.status === "COMPLETED")
    return { erro: "Esta avaliação já foi concluída" as const };

  const prova = lerProvaDaBateria({
    semente: avaliacao.seed,
    bateria: lerBateria(avaliacao.testBattery),
    itensGuardados: (avaliacao.itemOrder as string[]) ?? [],
    blocosGuardados: (avaliacao.scenarioOrder as string[]) ?? [],
  });

  return { avaliacaoId: avaliacao.id, prova };
}

/** Todo salvamento também é sinal de vida: é ele que alimenta "visto por último". */
async function marcarVisto(avaliacaoId: string) {
  await prisma.assessment.update({
    where: { id: avaliacaoId },
    data: { lastSeenAt: new Date() },
  });
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
 * Salvamento automático de uma afirmação de 1 a 5 — Baliza e Big Five.
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

  const aberta = await abrirProvaParaEscrita(token);
  if ("erro" in aberta) return { ok: false, erro: aberta.erro };

  // O item precisa pertencer À PROVA desta pessoa: sem isso, dá pra injetar
  // resposta de qualquer item do banco e mexer no escore. Vale igual para o
  // Big Five — item de um teste fora da bateria não entra.
  if (!aberta.prova.itens.includes(analise.data.itemId))
    return { ok: false, erro: "Item fora desta avaliação" };

  await prisma.itemResponse.upsert({
    where: {
      assessmentId_itemId: {
        assessmentId: aberta.avaliacaoId,
        itemId: analise.data.itemId,
      },
    },
    create: {
      assessmentId: aberta.avaliacaoId,
      itemId: analise.data.itemId,
      value: analise.data.valor,
      elapsedMs: analise.data.tempoMs ?? null,
    },
    update: {
      value: analise.data.valor,
      elapsedMs: analise.data.tempoMs ?? null,
    },
  });

  await marcarVisto(aberta.avaliacaoId);

  return { ok: true };
}

/**
 * Salvamento de um bloco de MAIS/MENOS — as situações da Baliza e o DISC.
 *
 * Os dois gravam aqui porque a resposta tem a mesma forma: uma escolha
 * "primeira/MAIS" e uma "última/MENOS", obrigatoriamente diferentes. A regra
 * das duas diferentes é do manual do DISC (§3.2, "As duas escolhas devem ser
 * diferentes") e é a mesma invariante que o escore ipsativo da Baliza sempre
 * exigiu — a tela impede, e esta linha é a que garante quando a tela não é a
 * única a chamar.
 */
export async function salvarCenario(
  token: string,
  entrada: {
    blocoId: string;
    primeiraId: string;
    ultimaId: string;
    tempoMs?: number;
  },
) {
  const aberta = await abrirProvaParaEscrita(token);
  if ("erro" in aberta) return { ok: false, erro: aberta.erro };

  if (entrada.primeiraId === entrada.ultimaId)
    return { ok: false, erro: "As duas escolhas precisam ser diferentes" };

  if (!aberta.prova.cenarios.includes(entrada.blocoId))
    return { ok: false, erro: "Cenário fora desta avaliação" };

  // As duas escolhas precisam ser opções DESTE bloco. A conferência espelha a
  // que o item já tinha: sem ela dá pra gravar um par de ids inventados, e a
  // escoragem passa a ler ação que não existe em bloco nenhum.
  const opcoes = opcoesDoBloco(entrada.blocoId);
  if (!opcoes.has(entrada.primeiraId) || !opcoes.has(entrada.ultimaId))
    return { ok: false, erro: "Escolha fora deste cenário" };

  await prisma.scenarioResponse.upsert({
    where: {
      assessmentId_blockId: {
        assessmentId: aberta.avaliacaoId,
        blockId: entrada.blocoId,
      },
    },
    create: {
      assessmentId: aberta.avaliacaoId,
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

  await marcarVisto(aberta.avaliacaoId);

  return { ok: true };
}

/**
 * Salvamento de uma escolha única entre alternativas — hoje, o SJT.
 *
 * Grava só o id da alternativa. A pontuação ({2,1,1,0}) e a competência ficam
 * no gabarito, no servidor: nunca vão ao front do candidato, nem depois de
 * terminar — expor queima o banco de cenários (manual §4.2).
 */
export async function salvarEscolha(
  token: string,
  entrada: { blocoId: string; escolhaId: string; tempoMs?: number },
) {
  const aberta = await abrirProvaParaEscrita(token);
  if ("erro" in aberta) return { ok: false, erro: aberta.erro };

  if (!aberta.prova.escolhas.includes(entrada.blocoId))
    return { ok: false, erro: "Situação fora desta avaliação" };

  const opcoes = opcoesDoBloco(entrada.blocoId);
  if (!opcoes.has(entrada.escolhaId))
    return { ok: false, erro: "Escolha fora desta situação" };

  await prisma.choiceResponse.upsert({
    where: {
      assessmentId_blockId: {
        assessmentId: aberta.avaliacaoId,
        blockId: entrada.blocoId,
      },
    },
    create: {
      assessmentId: aberta.avaliacaoId,
      blockId: entrada.blocoId,
      choiceId: entrada.escolhaId,
      elapsedMs: tempoDentroDoTeto(entrada.tempoMs) ?? null,
    },
    update: {
      choiceId: entrada.escolhaId,
      elapsedMs: tempoDentroDoTeto(entrada.tempoMs) ?? null,
    },
  });

  await marcarVisto(aberta.avaliacaoId);

  return { ok: true };
}

/**
 * Roda a equação de um módulo sem deixar a conclusão inteira cair com ela.
 *
 * O erro fica no log do servidor, onde é problema de quem mantém o banco — e
 * não na tela de quem acabou de responder 79 perguntas e não tem o que fazer a
 * respeito.
 */
function tentarPontuar<T>(teste: string, apurar: () => T): T | null {
  try {
    return apurar();
  } catch (erro) {
    console.error(`[prumo] módulo ${teste} não pôde ser pontuado:`, erro);
    return null;
  }
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
          choiceResponses: true,
          job: { select: { targetProfile: true } },
        },
      },
    },
  });

  const avaliacao = convite?.assessment;
  if (!avaliacao) return { ok: false as const, erro: "Convite não encontrado" };

  // Reenvio de quem tocou duas vezes: já concluída é sucesso, não erro.
  if (avaliacao.status === "COMPLETED") return { ok: true as const };

  const bateria = lerBateria(avaliacao.testBattery);
  const prova = lerProvaDaBateria({
    semente: avaliacao.seed,
    bateria,
    itensGuardados: (avaliacao.itemOrder as string[]) ?? [],
    blocosGuardados: (avaliacao.scenarioOrder as string[]) ?? [],
  });

  // A bateria conclui INTEIRA ou não conclui. Os blocos entram na mesma
  // conferência que as afirmações — as situações da Baliza não entram no ranking
  // (§5: escore ipsativo compara dimensões dentro da pessoa, não pessoas entre
  // si), mas alimentam a leitura qualitativa, e um teste inteiro em branco
  // viraria um relatório com um módulo faltando que ninguém pediria de volta.
  const pendencias = pendenciasDaProva({
    itensDaForma: prova.itens,
    cenariosDaForma: prova.cenarios,
    escolhasDaForma: prova.escolhas,
    itensRespondidos: avaliacao.responses.map((r) => r.itemId),
    cenariosRespondidos: avaliacao.scenarioResponses
      .filter((r) => r.firstActionId !== r.lastActionId)
      .map((r) => r.blockId),
    escolhasRespondidas: avaliacao.choiceResponses.map((r) => r.blockId),
    itemVisivel: (id) => ITEM_POR_ID.has(id) || ITEM_BIG_FIVE_POR_ID.has(id),
    cenarioVisivel: (id) => CENARIO_POR_ID.has(id) || BLOCO_DISC_POR_ID.has(id),
    escolhaVisivel: (id) =>
      CENARIO_SJT_POR_ID.has(id) ||
      BLOCO_DISC_PLANILHA_POR_ID.has(id) ||
      BLOCO_PERFIL_COMPORTAMENTAL_POR_ID.has(id) ||
      ITEM_ESTILO_EMOCIONAL_POR_ID.has(id),
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

  const valorPorItem = new Map(avaliacao.responses.map((r) => [r.itemId, r.value]));
  const parPorBloco = new Map(
    avaliacao.scenarioResponses.map((r) => [
      r.blockId,
      { primeira: r.firstActionId, ultima: r.lastActionId },
    ]),
  );
  const escolhaPorBloco = new Map(
    avaliacao.choiceResponses.map((r) => [r.blockId, r.choiceId]),
  );

  const agora = new Date();
  const duracaoMs = avaliacao.startedAt
    ? agora.getTime() - avaliacao.startedAt.getTime()
    : avaliacao.responses.reduce((a, r) => a + (r.elapsedMs ?? 0), 0);

  const perfilAlvo = avaliacao.job.targetProfile as unknown as PerfilAlvo;

  // ─── Escoragem por módulo ───────────────────────────────────────────────
  //
  // Cada teste é escorado com as respostas DELE, pelo módulo dele. As
  // afirmações da Baliza e do Big Five moram na mesma tabela, então separar
  // pelas listas da prova não é zelo: passar item de um para a equação do outro
  // produziria escore com denominador errado nos dois.
  //
  // As equações dos três testes do manual LANÇAM diante de prova incompleta, de
  // propósito — um número que parece válido é pior que nenhum. Aqui elas rodam
  // depois da conferência de pendências, então só chegam a lançar num caso: o
  // banco perdeu um item entre a resposta e o encerramento. Nesse caso a
  // conclusão não pode cair junto (a pessoa terminou tudo o que a tela mostrou);
  // o módulo fica ausente, e ausência é a coisa certa a mostrar depois.
  const modulos: ResultadosPorModulo = {};

  const respostasDoPrumo: Respostas = {};
  for (const id of prova.porTeste.PRUMO.itens) {
    const valor = valorPorItem.get(id);
    if (valor != null) respostasDoPrumo[id] = valor;
  }
  const cenariosDoPrumo: RespostaDeCenario[] = prova.porTeste.PRUMO.blocos
    .map((id) => ({ id, par: parPorBloco.get(id) }))
    .filter((b) => Boolean(b.par))
    .map((b) => ({
      blocoId: b.id,
      primeiraId: b.par!.primeira,
      ultimaId: b.par!.ultima,
    }));

  const prumo = bateria.includes("PRUMO")
    ? escorar({
        respostas: respostasDoPrumo,
        itensDaForma: prova.porTeste.PRUMO.itens,
        perfilAlvo,
        respostasDeCenario: cenariosDoPrumo,
        duracaoMs,
      })
    : null;

  if (prumo) modulos.PRUMO = { teste: "PRUMO", fatores: prumo.escores };

  if (bateria.includes("BIG_FIVE")) {
    const respostasBf: RespostasBigFive = {};
    for (const id of prova.porTeste.BIG_FIVE.itens) {
      const valor = valorPorItem.get(id);
      if (valor != null) respostasBf[id] = valor;
    }
    const apuracao = tentarPontuar("BIG_FIVE", () => pontuarBigFive(respostasBf));
    if (apuracao) modulos.BIG_FIVE = paraResultadoDeModuloBigFive(apuracao);
  }

  if (bateria.includes("DISC")) {
    const blocosNovos = prova.porTeste.DISC.blocos.filter((id) =>
      BLOCO_DISC_PLANILHA_POR_ID.has(id),
    );
    if (blocosNovos.length > 0) {
      const respostas = blocosNovos
        .map((id) => ({ blocoId: id, alternativaId: escolhaPorBloco.get(id) }))
        .filter((resposta) => Boolean(resposta.alternativaId))
        .map((resposta) => ({
          blocoId: resposta.blocoId,
          alternativaId: resposta.alternativaId!,
        }));
      modulos.DISC = pontuarDiscPlanilha(respostas);
    } else {
    // `firstActionId` é o MAIS e `lastActionId` é o MENOS — a mesma coluna que
    // guarda "faria primeiro / deixaria por último" nas situações da Baliza.
    const respostasDisc: RespostaDisc[] = prova.porTeste.DISC.blocos
      .map((id) => ({ id, par: parPorBloco.get(id) }))
      .filter((b) => Boolean(b.par))
      .map((b) => ({
        blocoId: b.id,
        maisId: b.par!.primeira,
        menosId: b.par!.ultima,
      }));
    const apuracao = tentarPontuar("DISC", () => pontuarDisc(respostasDisc));
      if (apuracao) modulos.DISC = paraResultadoDeModuloDisc(apuracao);
    }
  }

  if (bateria.includes("PERFIL_COMPORTAMENTAL")) {
    const respostas = prova.porTeste.PERFIL_COMPORTAMENTAL.blocos
      .map((id) => ({ blocoId: id, alternativaId: escolhaPorBloco.get(id) }))
      .filter((resposta) => Boolean(resposta.alternativaId))
      .map((resposta) => ({
        blocoId: resposta.blocoId,
        alternativaId: resposta.alternativaId!,
      }));
    modulos.PERFIL_COMPORTAMENTAL = pontuarPerfilComportamental(respostas);
  }

  if (bateria.includes("ESTILO_EMOCIONAL")) {
    const respostas = prova.porTeste.ESTILO_EMOCIONAL.blocos
      .map((id) => ({ itemId: id, alternativaId: escolhaPorBloco.get(id) }))
      .filter((resposta) => Boolean(resposta.alternativaId))
      .map((resposta) => ({
        itemId: resposta.itemId,
        alternativaId: resposta.alternativaId!,
      }));
    modulos.ESTILO_EMOCIONAL = pontuarEstiloEmocional(respostas);
  }

  if (bateria.includes("SJT")) {
    const respostasSjt: RespostaSjt[] = prova.porTeste.SJT.blocos
      .map((id) => ({ id, escolha: escolhaPorBloco.get(id) }))
      .filter((c) => Boolean(c.escolha))
      .map((c) => ({ cenarioId: c.id, alternativaId: c.escolha! }));
    const apuracao = tentarPontuar("SJT", () => pontuarSjt(respostasSjt));
    if (apuracao) modulos.SJT = paraResultadoDeModuloSjt(apuracao);
  }

  /*
   * Aderência só existe se a bateria produzir os cinco fatores.
   *
   * Este é o ponto onde escorar sem pensar produziria o pior tipo de número: um
   * plausível. `calcularEscores` de uma prova sem afirmações devolve 50 em todos
   * os fatores — o neutro de avaliação incompleta —, e 50 contra um perfil-alvo
   * dá um fit perfeitamente crível que não veio de resposta nenhuma. Uma vaga
   * que aplique só DISC e SJT tem que dizer que NÃO mede aderência.
   *
   * Por isso ausência, e não zero: zero na tela se lê como "candidato péssimo",
   * e é a leitura que decide quem vai para a entrevista.
   */
  const fonte = escoresParaFit(modulos);
  const fit = fonte ? calcularFit(fonte.escores, perfilAlvo) : null;

  /*
   * O selo que acompanha o número, gravado com a MESMA regra que a leitura usa.
   *
   * Gravava-se só `prumo?.confianca`, então bateria de Big Five terminava com
   * aderência calculada e selo nulo. A ficha do candidato disfarçava — ela
   * deriva na hora —, mas a lista de candidatos e o ranking da vaga leem a
   * coluna crua e exibiam o número SOZINHO, que é justamente o que o §4.4
   * proíbe. É o mesmo defeito que o comentário do `scores`, logo abaixo,
   * descreve para a outra coluna: passou batido três linhas adiante.
   */
  const qualidadeDaProva = qualidadeDosModulos(modulos, {
    itens: avaliacao.responses,
    blocos: avaliacao.scenarioResponses,
  });
  const selo = seloQueAcompanha(
    prumo?.confianca ?? null,
    fonte?.escores ?? null,
    qualidadeDaProva,
  );

  await prisma.$transaction([
    prisma.assessment.update({
      where: { id: avaliacao.id },
      data: {
        status: "COMPLETED",
        completedAt: agora,
        durationMs: duracaoMs,
        moduleResults: modulos as never,
        // A COLUNA `scores` guarda a MESMA fonte que decidiu o fit, não só a do
        // Baliza. Gravar só a Baliza aqui deixava a bateria de Big Five com fit
        // calculado e `scores` nulo — e `scores` é o que o resto do produto lê
        // (média por fator do painel, relatórios). O candidato apareceria no
        // ranking com nota e sumiria dos agregados, sem ninguém entender por quê.
        // `escoresParaFit` já prefere a Baliza quando ele existe, então para toda
        // vaga que existe hoje isto grava exatamente o que gravava antes.
        scores: (fonte?.escores ?? null) as never,
        facetNotes: (prumo?.facetas ?? null) as never,
        fitScore: fit?.score ?? null,
        fitDetail: fit
          ? ({
              puxaramPraCima: fit.puxaramPraCima,
              puxaramPraBaixo: fit.puxaramPraBaixo,
              ignoradas: fit.ignoradas,
              contribuicoes: fit.contribuicoes,
            } as never)
          : (null as never),
        confidence: (selo ?? null) as never,
        archetypeId: prumo?.arquetipo.id ?? null,
        archetypeMixedWith: prumo?.arquetipo.segundoId ?? null,
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
    metadados: {
      bateria,
      // `null` aqui é informação, não falta de dado: registra que a bateria
      // desta vaga não mede aderência.
      fit: fit?.score ?? null,
      selo: prumo?.confianca.selo ?? null,
    },
  });

  return { ok: true as const };
}
