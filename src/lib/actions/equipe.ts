"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { UserRole } from "@/generated/prisma/enums";
import { registrarAuditoria } from "@/lib/audit";
import { PAPEIS, podeAoMenos } from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";
import { exigirPermissao } from "@/lib/tenant";

export type EstadoDaEquipe = {
  ok?: boolean;
  erro?: string;
};

const esquemaDePapel = z.object({
  usuarioId: z.string().min(1),
  papel: z.enum(PAPEIS as unknown as [UserRole, ...UserRole[]]),
});

/**
 * Gestão de acesso do time de RH.
 *
 * ─── Por que isto passou a existir ─────────────────────────────────────────
 * O painel tinha quatro papéis no enum e nenhuma tela para atribuí-los: a
 * própria página de Configurações admitia que "novos acessos ainda são criados
 * fora do painel". Papel que ninguém consegue mudar não é controle de acesso —
 * é um campo decorativo. E como agora o papel decide quem lê o relatório
 * comportamental e quem baixa a base, ele precisava de um lugar.
 *
 * ─── As quatro travas, e por que cada uma ──────────────────────────────────
 * Todas valem no SERVIDOR. A tela desabilita as opções por gentileza; quem
 * manda é aqui.
 *
 *   1. Ninguém muda o próprio papel. Sem isso, o único OWNER se rebaixa por
 *      engano e a conta fica sem quem administre — um beco sem saída que só o
 *      suporte destranca.
 *   2. Ninguém concede papel acima do seu. Um ADMIN que promovesse alguém a
 *      OWNER teria acabado de contornar a única permissão que não tem: bastaria
 *      promover um cúmplice, ou a si mesmo pela mão dele.
 *   3. Ninguém mexe em quem está acima. Um ADMIN não rebaixa nem desativa o
 *      OWNER; senão a trava 2 se resolve pelo outro lado.
 *   4. A empresa nunca fica sem OWNER ativo. Rebaixar ou desativar o último é
 *      recusado — é o mesmo beco da trava 1, alcançado por outra porta.
 *
 * ─── Tudo entra na auditoria ───────────────────────────────────────────────
 * Com o papel anterior junto. "Quem podia ver o quê, e desde quando" é
 * exatamente a pergunta que aparece quando alguém questiona um acesso, e ela
 * não se responde com o estado de agora.
 */
export async function alterarPapel(
  _estado: EstadoDaEquipe,
  dados: FormData,
): Promise<EstadoDaEquipe> {
  const contexto = await exigirPermissao("equipe:gerenciar");

  const analise = esquemaDePapel.safeParse({
    usuarioId: dados.get("usuarioId"),
    papel: dados.get("papel"),
  });
  if (!analise.success) return { erro: "Escolha inválida." };

  const { usuarioId, papel } = analise.data;

  if (usuarioId === contexto.userId)
    return { erro: "Você não pode mudar o seu próprio papel." };

  if (!podeAoMenos(contexto.role, papel))
    return { erro: "Você não pode conceder um papel acima do seu." };

  // `organizationId` DENTRO do where: um id de outra empresa não pode virar
  // alvo, e conferir depois de buscar já seria tarde.
  const alvo = await prisma.user.findFirst({
    where: { id: usuarioId, organizationId: contexto.organizationId },
    select: { id: true, name: true, role: true, isActive: true },
  });
  if (!alvo) return { erro: "Pessoa não encontrada nesta empresa." };

  if (!podeAoMenos(contexto.role, alvo.role))
    return { erro: "Você não pode alterar alguém com papel acima do seu." };

  if (alvo.role === papel) return { ok: true };

  if (alvo.role === "OWNER" && (await ehUltimoDono(contexto.organizationId, alvo.id)))
    return {
      erro: "Esta é a única pessoa com papel de dono. Promova outra antes.",
    };

  await prisma.user.update({ where: { id: alvo.id }, data: { role: papel } });

  await registrarAuditoria({
    categoria: "ADMIN",
    acao: "equipe.papel_alterado",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "User",
    entidadeId: alvo.id,
    metadados: { de: alvo.role, para: papel, nome: alvo.name },
  });

  revalidatePath("/configuracoes");
  return { ok: true };
}

const esquemaDeAtivacao = z.object({
  usuarioId: z.string().min(1),
  ativo: z.enum(["sim", "nao"]),
});

/**
 * Liga e desliga o acesso de alguém sem apagar nada.
 *
 * Desativar, e não excluir, de propósito: o histórico aponta para quem criou a
 * vaga e quem assinou o parecer, e apagar a pessoa deixaria decisões órfãs —
 * justamente o que o art. 20 da LGPD pede que continue rastreável.
 *
 * O efeito é imediato, e não no próximo login: `exigirTenant()` relê o usuário
 * do banco a cada requisição protegida. Enquanto o papel vinha só do token JWT,
 * desligar alguém deixava até 8 horas de acesso válido no bolso dele.
 */
export async function alterarAtivacao(
  _estado: EstadoDaEquipe,
  dados: FormData,
): Promise<EstadoDaEquipe> {
  const contexto = await exigirPermissao("equipe:gerenciar");

  const analise = esquemaDeAtivacao.safeParse({
    usuarioId: dados.get("usuarioId"),
    ativo: dados.get("ativo"),
  });
  if (!analise.success) return { erro: "Escolha inválida." };

  const { usuarioId } = analise.data;
  const ativo = analise.data.ativo === "sim";

  if (usuarioId === contexto.userId)
    return { erro: "Você não pode desativar o seu próprio acesso." };

  const alvo = await prisma.user.findFirst({
    where: { id: usuarioId, organizationId: contexto.organizationId },
    select: { id: true, name: true, role: true, isActive: true },
  });
  if (!alvo) return { erro: "Pessoa não encontrada nesta empresa." };

  if (!podeAoMenos(contexto.role, alvo.role))
    return { erro: "Você não pode alterar alguém com papel acima do seu." };

  if (alvo.isActive === ativo) return { ok: true };

  if (
    !ativo &&
    alvo.role === "OWNER" &&
    (await ehUltimoDono(contexto.organizationId, alvo.id))
  )
    return {
      erro: "Esta é a única pessoa com papel de dono. Promova outra antes.",
    };

  await prisma.user.update({
    where: { id: alvo.id },
    data: { isActive: ativo },
  });

  await registrarAuditoria({
    categoria: "ADMIN",
    acao: ativo ? "equipe.acesso_reativado" : "equipe.acesso_desativado",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "User",
    entidadeId: alvo.id,
    metadados: { nome: alvo.name, papel: alvo.role },
  });

  revalidatePath("/configuracoes");
  return { ok: true };
}

/** Existe outro dono ATIVO nesta empresa além deste? */
async function ehUltimoDono(organizationId: string, exceto: string) {
  const outros = await prisma.user.count({
    where: {
      organizationId,
      role: "OWNER",
      isActive: true,
      id: { not: exceto },
    },
  });
  return outros === 0;
}
