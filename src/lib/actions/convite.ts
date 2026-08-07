"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { criarAvaliacao } from "@/lib/actions/avaliacao";
import { registrarAuditoria } from "@/lib/audit";
import { convitePorEmail, enviarEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";
import { gerarQr } from "@/lib/qr";
import { exigirPapel } from "@/lib/tenant";
import { urlBase } from "@/lib/url-publica";

export type EstadoDoConvite = {
  ok?: boolean;
  /** Mensagem de sucesso já pronta para a interface. */
  mensagem?: string;
  erro?: string;
  campos?: Record<string, string>;
  /** Nome de quem foi cadastrado, para a tela confirmar de quem se trata. */
  candidato?: string;
  /**
   * As três vias de acesso da pessoa. Vêm sempre, e não só quando o e-mail
   * falha: o cadastro é a hora em que o RH decide COMO vai entregar o acesso —
   * por e-mail, mandando o link no WhatsApp, mostrando o QR ou ditando o código.
   */
  acesso?: {
    link: string;
    codigo: string | null;
    /**
     * O QR do link pessoal, já desenhado. Vem daqui e não do navegador porque
     * gerar no cliente custava um "Gerando…" eterno quando falhava — ver
     * `src/lib/qr.ts`. `null` significa que o desenho não saiu; as outras duas
     * vias continuam valendo, e a tela diz isso.
     */
    qrDataUrl: string | null;
  };
  /** O e-mail saiu de fato? Muda o texto e o que a tela oferece. */
  enviado?: boolean;
};

const esquema = z.object({
  nome: z.string().min(2, "Informe o nome do candidato"),
  email: z.string().email("E-mail inválido"),
});

/**
 * Convida um candidato por e-mail para responder o mapeamento de uma vaga.
 *
 * O convite gera um link PESSOAL (`/t/<token>`), diferente do link público da
 * vaga: como já sabemos quem é, o candidato cai direto no questionário, sem
 * repetir nome e e-mail. O convite também é o que deixa a vaga saber que aquela
 * pessoa foi chamada e ainda não respondeu.
 *
 * Reaproveita `criarAvaliacao`, então a forma da prova é sorteada e gravada do
 * mesmo jeito que na entrada pelo link público — inclusive evitando repetir
 * itens que a pessoa já viu em processos anteriores.
 */
export async function convidarPorEmail(
  jobId: string,
  _estado: EstadoDoConvite,
  dados: FormData,
): Promise<EstadoDoConvite> {
  const contexto = await exigirPapel("RECRUITER");

  const analise = esquema.safeParse({
    nome: dados.get("nome"),
    email: dados.get("email"),
  });

  if (!analise.success) {
    const campos: Record<string, string> = {};
    for (const p of analise.error.issues) campos[String(p.path[0])] = p.message;
    return { campos };
  }

  // O escopo por empresa vai no WHERE: id de outra empresa simplesmente não acha.
  const vaga = await prisma.job.findFirst({
    where: { id: jobId, organizationId: contexto.organizationId },
    select: {
      id: true,
      title: true,
      status: true,
      organization: { select: { name: true } },
    },
  });

  if (!vaga) return { erro: "Vaga não encontrada." };
  if (vaga.status !== "OPEN")
    return { erro: "Esta vaga não está mais recebendo respostas." };

  const email = analise.data.email.toLowerCase().trim();
  const nome = analise.data.nome.trim();

  const candidato = await prisma.candidate.upsert({
    where: {
      organizationId_email: { organizationId: contexto.organizationId, email },
    },
    create: { organizationId: contexto.organizationId, name: nome, email },
    update: { name: nome },
  });

  // Já tem prova nesta vaga? Reaproveita em vez de criar uma segunda: duas
  // avaliações da mesma pessoa na mesma vaga bagunçam o ranking.
  const existente = await prisma.assessment.findFirst({
    where: { jobId: vaga.id, candidateId: candidato.id },
    include: { invitation: true },
    orderBy: { createdAt: "desc" },
  });

  if (existente?.status === "COMPLETED")
    return { erro: `${nome} já respondeu esta vaga.` };

  /**
   * Reaproveitar o convite antigo só vale enquanto ele AINDA ABRE.
   *
   * O convite vale 30 dias e `/t/<token>` barra o vencido; além disso a
   * manutenção devolve ao acervo o código de 4 dígitos de convite vencido.
   * Sem esta checagem, reconvidar no dia 31 entregava o MESMO token morto: o
   * painel dizia "Convite enviado" e as três vias do diálogo estavam mortas —
   * link vencido, QR do link vencido e código nulo. Silencioso e do lado
   * errado: o RH via sucesso, o candidato não entrava, e nenhum dos dois sabia
   * de quem era o problema.
   *
   * Vencido, cai no `criarAvaliacao`, que emite convite novo — prazo novo e
   * código novo — para a mesma pessoa na mesma vaga.
   */
  const conviteValido =
    existente?.invitation && existente.invitation.expiresAt > new Date()
      ? existente.invitation.token
      : null;

  const token =
    conviteValido ??
    (await criarAvaliacao({
      organizationId: contexto.organizationId,
      jobId: vaga.id,
      candidateId: candidato.id,
      canal: "EMAIL",
      email,
      criadoPor: contexto.userId,
    }));

  const link = `${await urlBase()}/t/${token}`;
  const [convite, qrDataUrl] = await Promise.all([
    prisma.invitation.findUnique({
      where: { token },
      select: { accessCode: true },
    }),
    gerarQr(link),
  ]);
  const acesso = { link, codigo: convite?.accessCode ?? null, qrDataUrl };
  const mensagem = convitePorEmail({
    nomeDoCandidato: nome,
    tituloDaVaga: vaga.title,
    nomeDaEmpresa: vaga.organization.name,
    link,
  });

  const envio = await enviarEmail({
    para: email,
    assunto: mensagem.assunto,
    texto: mensagem.texto,
    html: mensagem.html,
  });

  if (envio.enviado) {
    await prisma.invitation.update({
      where: { token },
      data: { sentAt: new Date(), status: "SENT" },
    });
  }

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: envio.enviado ? "convite_enviado" : "convite_criado_sem_envio",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Invitation",
    entidadeId: token,
    metadados: { vaga: vaga.title, email, motivo: envio.enviado ? null : envio.motivo },
  });

  // Sem `revalidatePath` aqui, de propósito: esta ação roda de dentro de um
  // diálogo aberto SOBRE a página da vaga. Revalidar o próprio caminho troca a
  // árvore por baixo do diálogo, e o resultado da ação nunca chega na tela — o
  // botão fica em "Enviando" para sempre, mesmo com tudo gravado no banco.
  // Quem atualiza a página é o cliente, no `router.refresh()` ao FECHAR o
  // diálogo (ver componente convidar-por-email.tsx).

  if (envio.enviado) {
    return {
      ok: true,
      enviado: true,
      candidato: nome,
      acesso,
      mensagem: `Convite enviado para ${email}.`,
    };
  }

  return {
    ok: true,
    enviado: false,
    candidato: nome,
    acesso,
    mensagem:
      envio.motivo === "sem-smtp"
        ? "Candidato cadastrado. Não há servidor de e-mail configurado — entregue o acesso por um dos caminhos abaixo."
        : "Candidato cadastrado, mas o e-mail não saiu. Entregue o acesso por um dos caminhos abaixo.",
  };
}

/**
 * Revoga o acesso de um convite.
 *
 * ─── O leitor existia; o escritor, não ────────────────────────────────────
 * `InvitationStatus` já tinha `REVOKED` e `/t/<token>` já tratava esse estado
 * com uma tela própria ("este acesso foi cancelado") — mas nenhuma linha do
 * sistema jamais escrevia esse status. Era um caminho pronto para receber
 * alguém e sem ninguém que soubesse mandar.
 *
 * Sem isto, cancelar um convite mandado por engano — pessoa errada, e-mail
 * digitado errado, vaga que fechou — não tinha caminho: o link seguia abrindo
 * por 30 dias e a única saída era pedir para a pessoa não usar.
 *
 * ─── O código de 4 dígitos volta ao acervo ────────────────────────────────
 * Revogar sem liberar o `accessCode` prenderia aquele código para sempre — são
 * 10.000 combinações e a unicidade é do sistema inteiro, não por vaga. A
 * devolução normal só acontece quando a prova TERMINA, e uma prova revogada
 * nunca termina. Sem esta linha, cada cancelamento consumiria um código
 * definitivamente.
 *
 * ─── O que NÃO se revoga ──────────────────────────────────────────────────
 * Convite de prova já concluída. O resultado existe, foi lido e pode ter
 * embasado uma decisão; marcar o acesso como cancelado depois não desfaz nada
 * e só faria a linha do tempo mentir. Para tirar o dado do ar, o caminho é o
 * expurgo, que é outra coisa e tem outra regra.
 *
 * A avaliação PENDING/IN_PROGRESS que estiver pendurada vira `ABANDONED` na
 * mesma transação: deixá-la aberta manteria a pessoa contada em "aguardando
 * resposta" para sempre — cobrando alguém que não pode mais responder.
 */
export async function revogarConvite(
  invitationId: string,
): Promise<{ ok?: boolean; erro?: string }> {
  const contexto = await exigirPapel("RECRUITER");

  const convite = await prisma.invitation.findFirst({
    where: { id: invitationId, organizationId: contexto.organizationId },
    select: {
      id: true,
      status: true,
      jobId: true,
      candidate: { select: { name: true } },
      job: { select: { title: true } },
      assessment: { select: { id: true, status: true } },
    },
  });

  if (!convite) return { erro: "Convite não encontrado." };
  if (convite.status === "REVOKED") return { ok: true };
  if (convite.assessment?.status === "COMPLETED")
    return { erro: "Esta pessoa já respondeu — não há acesso a cancelar." };

  await prisma.$transaction([
    prisma.invitation.update({
      where: { id: convite.id },
      data: { status: "REVOKED", accessCode: null },
    }),
    ...(convite.assessment
      ? [
          prisma.assessment.update({
            where: { id: convite.assessment.id },
            data: { status: "ABANDONED" },
          }),
        ]
      : []),
  ]);

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: "convite_revogado",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Invitation",
    entidadeId: convite.id,
    metadados: {
      vaga: convite.job.title,
      candidato: convite.candidate?.name ?? null,
      // Estava no meio da prova? É o caso em que alguém perdeu trabalho feito,
      // e é a pergunta que quem audita vai fazer.
      estavaRespondendo: convite.assessment?.status === "IN_PROGRESS",
    },
  });

  revalidatePath(`/vagas/${convite.jobId}`);
  revalidatePath("/dashboard");

  return { ok: true };
}
