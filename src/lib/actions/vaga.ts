"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { registrarAuditoria } from "@/lib/audit";
import { lerBateria, validarBateria } from "@/lib/instrument/baterias";
import { PERFIL_NEUTRO, PRESET_POR_ID } from "@/lib/instrument/presets";
import { calcularFit } from "@/lib/instrument/scoring";
import type { Fator } from "@/lib/instrument/types";
import { lerPerfilAlvo } from "@/lib/perfil-alvo";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/tenant";
import { gerarTokenDeVaga } from "@/lib/token-de-vaga";

export type EstadoDaVaga = {
  erro?: string;
  campos?: Record<string, string>;
};

export type EstadoDoPerfil = {
  ok?: boolean;
  erro?: string;
  /** Quantas respostas já recebidas foram recalculadas contra as novas faixas. */
  recalculadas?: number;
};

export type EstadoDaBateria = {
  ok?: boolean;
  erro?: string;
};

const esquema = z.object({
  titulo: z.string().min(3, "Informe o título da vaga"),
  descricao: z.string().optional(),
  requisitos: z.string().optional(),
  senioridade: z.enum([
    "INTERN",
    "JUNIOR",
    "MID",
    "SENIOR",
    "LEAD",
    "MANAGER",
    "DIRECTOR",
  ]),
  modelo: z.enum(["ONSITE", "REMOTE", "HYBRID"]),
  departamento: z.string().optional(),
  local: z.string().optional(),
  preset: z.string().min(1, "Escolha um perfil-alvo"),
  // "aberta": qualquer pessoa com o link responde e se cadastra sozinha.
  // "fechada": só entra quem o RH cadastrou — o link público recusa.
  entrada: z.enum(["aberta", "fechada"]).default("aberta"),
});

export async function criarVaga(
  _estado: EstadoDaVaga,
  dados: FormData,
): Promise<EstadoDaVaga> {
  const contexto = await exigirPapel("RECRUITER");

  const analise = esquema.safeParse({
    titulo: dados.get("titulo"),
    descricao: dados.get("descricao"),
    requisitos: dados.get("requisitos"),
    senioridade: dados.get("senioridade"),
    modelo: dados.get("modelo"),
    departamento: dados.get("departamento"),
    local: dados.get("local"),
    preset: dados.get("preset"),
    entrada: dados.get("entrada") ?? "aberta",
  });

  // A bateria vem como vários campos de mesmo nome (uma caixa marcada = um
  // valor), então é `getAll`. A validação fica em `baterias.ts` e não num zod
  // aqui porque é a MESMA regra da edição — e regra de negócio duplicada em
  // dois lugares vira duas regras diferentes na primeira mudança.
  const bateria = validarBateria(dados.getAll("bateria"));

  // Os dois erros voltam JUNTOS. Devolver primeiro os do zod e só depois o da
  // bateria faria a pessoa corrigir o título, reenviar e descobrir aí que
  // faltava marcar um teste.
  if (!analise.success || !bateria.ok) {
    const campos: Record<string, string> = {};
    if (!analise.success)
      for (const p of analise.error.issues)
        campos[String(p.path[0])] = p.message;
    if (!bateria.ok) campos.bateria = bateria.erro;
    return { campos };
  }

  const preset = PRESET_POR_ID.get(analise.data.preset);

  // O preset é COPIADO para a vaga: a partir daqui ela tem vida própria e
  // editar o perfil de uma vaga não mexe em nenhuma outra.
  const perfil = preset ? preset.dimensoes : PERFIL_NEUTRO;

  const vaga = await criarComTokenLegivel({
    organizationId: contexto.organizationId,
    title: analise.data.titulo.trim(),
    description: analise.data.descricao?.trim() || null,
    requirements: analise.data.requisitos?.trim() || null,
    seniority: analise.data.senioridade,
    workModel: analise.data.modelo,
    department: analise.data.departamento?.trim() || null,
    location: analise.data.local?.trim() || null,
    status: "OPEN",
    // `publicEnabled` é o modo de entrada: com ele desligado a página pública
    // recusa e a vaga só recebe quem o RH cadastrou.
    publicEnabled: analise.data.entrada === "aberta",
    presetId: preset?.id ?? null,
    targetProfile: perfil as never,
    testBattery: bateria.bateria,
    createdById: contexto.userId,
  });

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: "vaga_criada",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Job",
    entidadeId: vaga.id,
    metadados: {
      titulo: vaga.title,
      preset: preset?.id,
      bateria: bateria.bateria,
    },
  });

  revalidatePath("/vagas");
  redirect(`/vagas/${vaga.id}`);
}

/**
 * Troca o modo de entrada de uma vaga que já existe.
 *
 * Fechar não apaga nada: convites já emitidos continuam valendo. O que muda é a
 * porta da rua — quem chegar pelo link público passa a ver "esta vaga é por
 * convite" em vez do formulário.
 */
export async function alternarModoDaVaga(jobId: string, aberta: boolean) {
  const contexto = await exigirPapel("RECRUITER");

  const vaga = await prisma.job.updateMany({
    where: { id: jobId, organizationId: contexto.organizationId },
    data: { publicEnabled: aberta },
  });

  if (vaga.count === 0) return { ok: false as const, erro: "Vaga não encontrada." };

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: aberta ? "vaga_aberta_ao_publico" : "vaga_fechada_para_convite",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Job",
    entidadeId: jobId,
  });

  revalidatePath(`/vagas/${jobId}`);
  return { ok: true as const };
}

/**
 * Troca os testes que a vaga aplica.
 *
 * O que esta ação NÃO faz, e é o ponto: ela não mexe em avaliação nenhuma. Cada
 * convite carrega sua própria cópia congelada da bateria (`Assessment.testBattery`),
 * tirada no momento em que foi criado. Acrescentar o DISC hoje vale para quem
 * for convidado a partir de agora; quem começou ontem termina a prova com que
 * começou. É a mesma promessa do `itemOrder`, um degrau acima — e é o contrário
 * do que a edição de perfil-alvo faz, porque lá a régua muda para todos (o fit
 * é recalculado) e aqui a PROVA mudaria, que é coisa que não se refaz.
 *
 * Consequência que a tela precisa dizer: tirar a Baliza e o Big Five de uma vaga
 * deixa as próximas respostas sem aderência — não com aderência zero.
 */
export async function atualizarBateriaDaVaga(
  jobId: string,
  escolhidos: readonly string[],
): Promise<EstadoDaBateria> {
  const contexto = await exigirPapel("RECRUITER");

  const bateria = validarBateria(escolhidos);
  if (!bateria.ok) return { erro: bateria.erro };

  // Escopo por empresa no WHERE: id de outra empresa simplesmente não acha.
  const vaga = await prisma.job.findFirst({
    where: { id: jobId, organizationId: contexto.organizationId },
    select: { id: true, title: true, testBattery: true },
  });
  if (!vaga) return { erro: "Vaga não encontrada." };

  const anterior = lerBateria(vaga.testBattery);
  await prisma.job.update({
    where: { id: vaga.id },
    data: { testBattery: bateria.bateria },
  });

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: "bateria_de_testes_editada",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Job",
    entidadeId: vaga.id,
    metadados: { vaga: vaga.title, de: anterior, para: bateria.bateria },
  });

  revalidatePath(`/vagas/${vaga.id}`);
  return { ok: true };
}

/**
 * Edita o perfil-alvo de uma vaga que já existe.
 *
 * O preset é copiado na criação justamente para isto: a vaga tem vida própria e
 * ajustar a faixa de uma não mexe em nenhuma outra. Até aqui, porém, a cópia
 * ficava congelada — a tela de criação prometia "depois você ajusta cada faixa"
 * e não havia por onde.
 *
 * A parte que não é óbvia: mudar o perfil muda a CONTA. `fitScore` e `fitDetail`
 * das respostas já recebidas foram calculados contra as faixas antigas, e deixar
 * os dois lados conviverem produziria um ranking que mistura duas réguas — o
 * pior tipo de erro, porque nada na tela denuncia. Por isso a edição recalcula
 * todas as respostas concluídas na mesma transação em que grava o perfil.
 *
 * Recalcular é seguro porque `calcularFit` é pura e depende só de `scores` (que
 * ficam gravados) e do perfil: nenhuma resposta bruta é lida ou reescrita, e o
 * mesmo perfil sempre devolve o mesmo número.
 */
export async function atualizarPerfilDaVaga(
  jobId: string,
  _estado: EstadoDoPerfil,
  dados: FormData,
): Promise<EstadoDoPerfil> {
  const contexto = await exigirPapel("RECRUITER");

  const leitura = lerPerfilAlvo(dados);
  if (!leitura.ok) return { erro: leitura.erro };

  // Escopo por empresa no WHERE: id de outra empresa simplesmente não acha.
  const vaga = await prisma.job.findFirst({
    where: { id: jobId, organizationId: contexto.organizationId },
    select: { id: true, title: true },
  });
  if (!vaga) return { erro: "Vaga não encontrada." };

  const concluidas = await prisma.assessment.findMany({
    where: { jobId: vaga.id, status: "COMPLETED" },
    select: { id: true, scores: true },
  });

  const recalculos = concluidas.flatMap((avaliacao) => {
    const escores = avaliacao.scores as Record<Fator, number> | null;
    // Concluída sem escores é dado de outra era (ou expurgado): sem eles não há
    // o que recalcular, e inventar um fit seria pior que manter o antigo.
    if (!escores) return [];

    const fit = calcularFit(escores, leitura.perfil);
    return [
      prisma.assessment.update({
        where: { id: avaliacao.id },
        data: {
          fitScore: fit.score,
          fitDetail: {
            puxaramPraCima: fit.puxaramPraCima,
            puxaramPraBaixo: fit.puxaramPraBaixo,
            ignoradas: fit.ignoradas,
            contribuicoes: fit.contribuicoes,
          } as never,
        },
      }),
    ];
  });

  await prisma.$transaction([
    prisma.job.update({
      where: { id: vaga.id },
      // `presetId` fica como está: ele é procedência ("saiu deste preset"), não
      // o conteúdo. Apagar a origem não deixaria a vaga mais editada do que já é.
      data: { targetProfile: leitura.perfil as never },
    }),
    ...recalculos,
  ]);

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: "perfil_alvo_editado",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Job",
    entidadeId: vaga.id,
    metadados: {
      vaga: vaga.title,
      recalculadas: recalculos.length,
      perfil: leitura.perfil as never,
    },
  });

  // A aderência aparece em quatro telas; todas mudam de valor agora.
  revalidatePath(`/vagas/${vaga.id}`);
  revalidatePath("/vagas");
  revalidatePath("/candidatos");
  revalidatePath("/dashboard");
  revalidatePath("/relatorios");

  return { ok: true, recalculadas: recalculos.length };
}

/**
 * Cria a vaga com o endereço público legível.
 *
 * O sufixo aleatório torna a colisão improvável, não impossível — duas vagas
 * com o mesmo título no mesmo segundo existem. `publicToken` é UNIQUE no banco,
 * então a colisão vira erro P2002 e a saída é tentar outro sufixo, nunca deixar
 * o cadastro falhar por causa de um sorteio.
 */
async function criarComTokenLegivel(
  dados: Parameters<typeof prisma.job.create>[0]["data"],
) {
  const titulo = typeof dados.title === "string" ? dados.title : "vaga";

  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    try {
      return await prisma.job.create({
        data: { ...dados, publicToken: gerarTokenDeVaga(titulo) },
      });
    } catch (erro) {
      const colidiu =
        typeof erro === "object" &&
        erro !== null &&
        "code" in erro &&
        (erro as { code?: string }).code === "P2002";
      if (!colidiu) throw erro;
    }
  }

  // Cinco sorteios seguidos batendo é sinal de outra coisa; deixa o banco
  // gerar o `cuid` do default em vez de recusar a vaga.
  return prisma.job.create({ data: dados });
}

/**
 * Encerra, pausa ou reabre uma vaga.
 *
 * ─── Por que isto faltava ──────────────────────────────────────────────────
 * `Job.status` só era escrito uma vez, no `"OPEN"` da criação: `PAUSED` e
 * `CLOSED` eram estados inalcançáveis. Processo seletivo acaba, e a ferramenta
 * não sabia disso — o link público seguia recebendo candidato depois da vaga
 * preenchida, o painel contava a vaga como aberta para sempre, e a lista só
 * crescia.
 *
 * Havia mais código morto pendurado nisso do que parece: `/vagas` ordena por
 * status e promete "abertas primeiro, encerradas no fim" (ordenação que nunca
 * ordenava nada), três das quatro cores de status nunca eram usadas, e o guarda
 * de `convidarPorEmail` que recusa vaga não-aberta nunca disparava.
 *
 * ─── O que encerrar faz com quem já foi convidado ──────────────────────────
 * Nada. Quem já tem o link termina a prova, e é de propósito: a pessoa
 * respondeu metade, a empresa fechou a vaga, e derrubar a prova dela no meio
 * seria descartar trabalho de alguém para arrumar uma lista. O que fecha é a
 * porta da frente — o link público —, e é isso que `publicEnabled` já faz.
 * Encerrar desliga os dois de uma vez.
 */
export async function mudarStatusDaVaga(
  jobId: string,
  status: "OPEN" | "PAUSED" | "CLOSED",
) {
  const contexto = await exigirPapel("RECRUITER");

  const vaga = await prisma.job.updateMany({
    where: { id: jobId, organizationId: contexto.organizationId },
    data: {
      status,
      // Encerrada não recebe mais ninguém pelo link público. Reabrir NÃO
      // reabre o link sozinho: quem fechou pode ter fechado por vazamento do
      // anúncio, e reabrir a porta sem pedir seria decidir por quem fechou.
      ...(status === "CLOSED" ? { publicEnabled: false, closedAt: new Date() } : {}),
      ...(status === "OPEN" ? { closedAt: null } : {}),
    },
  });

  if (vaga.count === 0) return { ok: false as const, erro: "Vaga não encontrada." };

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: `vaga_${status.toLowerCase()}`,
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Job",
    entidadeId: jobId,
  });

  revalidatePath(`/vagas/${jobId}`);
  revalidatePath("/vagas");
  return { ok: true as const };
}
