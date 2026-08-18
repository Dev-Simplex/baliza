import { cache } from "react";
import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import {
  ErroDeAutorizacao,
  pode,
  podeAoMenos,
  respostaDeAutorizacao,
  type Permissao,
} from "@/lib/permissoes";
import { prisma } from "@/lib/prisma";

// Reexportados daqui porque este sempre foi o endereço deles para o resto
// do código. A mudança é de arrumação — `permissoes.ts` não importa sessão e
// por isso pode ser testado —, não de interface.
export { ErroDeAutorizacao, pode, podeAoMenos, respostaDeAutorizacao };
export type { Permissao };

/**
 * Ponto único de entrada do escopo multiempresa.
 *
 * Regra: nenhuma consulta a dado de empresa é escrita fora daqui sem
 * `organizationId` vindo de `exigirTenant()`. O id NUNCA vem de parâmetro de
 * rota, corpo de requisição ou query string — só da sessão assinada. É isso que
 * impede que trocar um id na URL leia a base de outro cliente.
 */

export type Contexto = {
  userId: string;
  organizationId: string;
  role: UserRole;
  nome: string;
  email: string;
  isPlatformAdmin: boolean;
  /** Atalho: `contexto.pode("dados:exportar")`. Mesma régua de `permissoes.ts`. */
  pode: (permissao: Permissao) => boolean;
};

export async function sessaoAtual() {
  return auth();
}

/** Exige usuário autenticado. Redireciona para o login caso contrário. */
export async function exigirUsuario() {
  const sessao = await auth();
  if (!sessao?.user?.id) redirect("/entrar");
  return sessao.user;
}

/**
 * O papel VEM DO BANCO, não do token — e essa é uma decisão com custo.
 *
 * A sessão é JWT de 8 horas com o papel assado dentro (`auth.config.ts`). Isso
 * significa que rebaixar alguém, ou desativar a conta, só teria efeito no
 * próximo login: até 8 horas de acesso depois de revogado. Enquanto papel só
 * separava quem cria vaga de quem não cria, dava para conviver. Agora ele
 * separa quem lê o relatório comportamental de quem não lê — e um sistema de
 * permissão em que revogar demora 8 horas não é um sistema de permissão.
 *
 * O custo é uma consulta por chave primária por requisição protegida. O
 * `cache()` do React a reduz a UMA por render, mesmo com as várias chamadas de
 * `exigirTenant()` que uma página faz — e ela custa muito menos que qualquer
 * uma das consultas de painel que vêm logo depois.
 *
 * `isActive` entra junto pelo mesmo motivo: desativar tem que derrubar agora.
 */
const usuarioAtual = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      organizationId: true,
      isPlatformAdmin: true,
      isActive: true,
      organization: { select: { isActive: true } },
    },
  });
});

function montarContexto(u: {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  isPlatformAdmin: boolean;
}): Contexto {
  return {
    userId: u.id,
    organizationId: u.organizationId,
    role: u.role,
    nome: u.name ?? "",
    email: u.email ?? "",
    isPlatformAdmin: u.isPlatformAdmin,
    pode: (permissao) => pode(u.role, permissao),
  };
}

/** Exige usuário autenticado E vinculado a uma empresa. */
export async function exigirTenant(): Promise<Contexto> {
  const sessao = await exigirUsuario();
  const usuario = await usuarioAtual(sessao.id);

  // Conta apagada, desativada, ou empresa desativada, com sessão ainda válida
  // no bolso. O login já barra os três (`auth.ts`); aqui é o mesmo barramento
  // aplicado a quem já estava dentro quando a mudança aconteceu.
  if (!usuario || !usuario.isActive) redirect("/entrar?erro=conta-inativa");
  if (usuario.organization && !usuario.organization.isActive)
    redirect("/entrar?erro=conta-inativa");

  if (!usuario.organizationId) {
    // Operador da plataforma não tem empresa: o lugar dele é o painel admin.
    if (usuario.isPlatformAdmin) redirect("/admin");
    // Sessão com usuário e sem empresa não tem o que abrir no painel — o
    // cadastro cria as duas coisas juntas, então chegar aqui é conta montada
    // por fora. Mandava para `/onboarding`, que nunca existiu: a pessoa caía
    // num 404 em vez de numa explicação. O `proxy.ts` já intercepta antes; isto
    // é a rede de baixo, para quem chamar `exigirTenant()` fora de rota privada.
    redirect("/entrar?erro=sem-empresa");
  }

  return montarContexto({ ...usuario, organizationId: usuario.organizationId });
}

/**
 * Exige uma permissão nomeada.
 *
 * Substituiu `exigirPapel(minimo)`. A diferença não é de sintaxe: perguntar
 * pelo papel obriga cada ponto de chamada a saber a hierarquia inteira, e é o
 * que faz uma mudança de preset virar uma caçada por comparações espalhadas.
 * Aqui o ponto de chamada declara o que precisa fazer, e `permissoes.ts` é o
 * único lugar que sabe quem pode fazê-lo.
 */
export async function exigirPermissao(permissao: Permissao): Promise<Contexto> {
  const contexto = await exigirTenant();
  if (!contexto.pode(permissao)) redirect("/dashboard?erro=permissao");
  return contexto;
}

/** Exige operador da plataforma (painel administrativo). */
export async function exigirAdminPlataforma() {
  const usuario = await exigirUsuario();
  if (!usuario.isPlatformAdmin) redirect("/dashboard");
  return usuario;
}

/** Versão para API: lança em vez de redirecionar. */
export async function tenantDaApi(): Promise<Contexto> {
  const sessao = await auth();
  if (!sessao?.user?.id) throw new ErroDeAutorizacao("Não autenticado", 401);

  const usuario = await usuarioAtual(sessao.user.id);
  if (!usuario || !usuario.isActive)
    throw new ErroDeAutorizacao("Conta inativa", 403);
  if (usuario.organization && !usuario.organization.isActive)
    throw new ErroDeAutorizacao("Conta inativa", 403);
  if (!usuario.organizationId)
    throw new ErroDeAutorizacao("Usuário sem empresa vinculada", 403);

  return montarContexto({ ...usuario, organizationId: usuario.organizationId });
}

/**
 * Permissão em rota de arquivo, onde `redirect()` é a resposta errada.
 *
 * A recusa sai por `respostaDeAutorizacao`, e o porquê está lá.
 */
export async function exigirPermissaoDaApi(
  permissao: Permissao,
  recado = "Seu perfil de acesso não permite esta ação.",
): Promise<Contexto> {
  const contexto = await tenantDaApi();
  if (!contexto.pode(permissao)) throw new ErroDeAutorizacao(recado, 403);
  return contexto;
}
