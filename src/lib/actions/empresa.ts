"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { exigirPermissao } from "@/lib/tenant";

export type EstadoDaEmpresa = {
  ok?: boolean;
  erro?: string;
};

/**
 * Os dados da empresa que o candidato vê, e o prazo em que ele é esquecido.
 *
 * ─── Por que isto passou a existir ─────────────────────────────────────────
 * As permissões `empresa:editar` e `retencao:configurar` existiam no catálogo e
 * não tinham porta: a tela de Configurações exibia os valores e admitia, numa
 * linha, que não dava para mudar nada. Permissão declarada sem lugar onde ser
 * exercida não é permissão — é uma promessa no papel.
 *
 * A de retenção era a mais grave das duas. O rodapé do relatório promete ao
 * candidato que as respostas dele são apagadas "no prazo informado pela
 * empresa", e a empresa não tinha como informar prazo nenhum: ficava nos 12
 * meses do default para sempre.
 */

const esquemaDaEmpresa = z.object({
  nome: z
    .string()
    .trim()
    .min(2, "O nome precisa de pelo menos 2 caracteres")
    .max(120, "O nome ficou longo demais"),
  // Vazio é resposta válida em todos os três: são campos que a empresa pode
  // legitimamente não ter. Só o nome é obrigatório, porque ele aparece para o
  // candidato no convite e no relatório — sem ele o documento sai anônimo.
  segmento: z.string().trim().max(80, "O segmento ficou longo demais").optional(),
  site: z
    .union([z.string().trim().url("Endereço inválido — inclua https://"), z.literal("")])
    .optional(),
  documento: z.string().trim().max(20, "Documento longo demais").optional(),
});

export async function atualizarEmpresa(
  _estado: EstadoDaEmpresa,
  dados: FormData,
): Promise<EstadoDaEmpresa> {
  const contexto = await exigirPermissao("empresa:editar");

  const analise = esquemaDaEmpresa.safeParse({
    nome: dados.get("nome"),
    segmento: dados.get("segmento"),
    site: dados.get("site"),
    documento: dados.get("documento"),
  });

  if (!analise.success)
    return { erro: analise.error.issues[0]?.message ?? "Dados inválidos." };

  const { nome, segmento, site, documento } = analise.data;

  const antes = await prisma.organization.findUniqueOrThrow({
    where: { id: contexto.organizationId },
    select: { name: true, segment: true, website: true, document: true },
  });

  await prisma.organization.update({
    where: { id: contexto.organizationId },
    data: {
      name: nome,
      // String vazia vira `null`: "" e "não informado" são a mesma coisa para
      // quem lê, e guardar os dois faria a tela ter que tratar dois vazios.
      segment: segmento || null,
      website: site || null,
      document: documento || null,
    },
  });

  await registrarAuditoria({
    categoria: "ADMIN",
    acao: "empresa.atualizada",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Organization",
    entidadeId: contexto.organizationId,
    metadados: { de: antes, para: { nome, segmento, site, documento } },
  });

  revalidatePath("/configuracoes");
  return { ok: true };
}

/**
 * Prazos oferecidos, em meses.
 *
 * Lista fechada e não campo livre: retenção é promessa jurídica ao candidato, e
 * um campo aberto convida a digitar 999. Os cinco valores cobrem o que se usa
 * de verdade, do processo curto ao banco de talentos.
 */
export const PRAZOS_DE_RETENCAO = [3, 6, 12, 24, 36] as const;

const esquemaDeRetencao = z.object({
  meses: z.coerce
    .number()
    .int()
    .refine((n) => (PRAZOS_DE_RETENCAO as readonly number[]).includes(n), {
      message: "Prazo fora da lista.",
    }),
});

/**
 * Muda o prazo de expurgo da resposta bruta.
 *
 * ─── Encurtar apaga mais, e apaga de verdade ───────────────────────────────
 * O expurgo (`prisma/manutencao.ts`) roda sobre o prazo VIGENTE, não sobre o que
 * valia quando a pessoa respondeu. Baixar de 24 para 3 meses faz a próxima
 * execução apagar tudo entre os dois — e resposta bruta apagada não volta.
 *
 * A escolha de não versionar o prazo por avaliação é deliberada: a promessa do
 * rodapé é "no prazo informado pela empresa", no singular, e um sistema em que
 * cada resposta tem o seu próprio prazo não consegue responder a pergunta que o
 * titular faz, que é "quando os MEUS dados somem".
 *
 * O que o expurgo apaga é a resposta item a item. O resultado consolidado fica,
 * e o link do candidato continua funcionando.
 */
export async function atualizarRetencao(
  _estado: EstadoDaEmpresa,
  dados: FormData,
): Promise<EstadoDaEmpresa> {
  const contexto = await exigirPermissao("retencao:configurar");

  const analise = esquemaDeRetencao.safeParse({ meses: dados.get("meses") });
  if (!analise.success) return { erro: "Prazo inválido." };

  const { meses } = analise.data;

  const antes = await prisma.organization.findUniqueOrThrow({
    where: { id: contexto.organizationId },
    select: { retentionMonths: true },
  });

  if (antes.retentionMonths === meses) return { ok: true };

  await prisma.organization.update({
    where: { id: contexto.organizationId },
    data: { retentionMonths: meses },
  });

  await registrarAuditoria({
    // PRIVACY, e não ADMIN: mudar o prazo de expurgo é decisão sobre dado
    // pessoal de terceiro, e é nessa categoria que alguém vai procurar quando
    // um titular perguntar por que a resposta dele sumiu antes do esperado.
    categoria: "PRIVACY",
    acao: "retencao.alterada",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Organization",
    entidadeId: contexto.organizationId,
    metadados: {
      de: antes.retentionMonths,
      para: meses,
      encurtou: meses < antes.retentionMonths,
    },
  });

  revalidatePath("/configuracoes");
  return { ok: true };
}
