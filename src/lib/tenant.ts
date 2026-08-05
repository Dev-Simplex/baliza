import { redirect } from "next/navigation";
import type { UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";

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

/** Exige usuário autenticado E vinculado a uma empresa. */
export async function exigirTenant(): Promise<Contexto> {
  const usuario = await exigirUsuario();

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

  return {
    userId: usuario.id,
    organizationId: usuario.organizationId,
    role: usuario.role,
    nome: usuario.name ?? "",
    email: usuario.email ?? "",
    isPlatformAdmin: usuario.isPlatformAdmin,
  };
}

/** Hierarquia de papéis: número maior manda mais. */
const PESO: Record<UserRole, number> = {
  VIEWER: 1,
  RECRUITER: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function podeAoMenos(papel: UserRole, minimo: UserRole) {
  return PESO[papel] >= PESO[minimo];
}

/** Exige um papel mínimo dentro da empresa. */
export async function exigirPapel(minimo: UserRole): Promise<Contexto> {
  const contexto = await exigirTenant();
  if (!podeAoMenos(contexto.role, minimo)) {
    redirect("/dashboard?erro=permissao");
  }
  return contexto;
}

/** Exige operador da plataforma (painel administrativo). */
export async function exigirAdminPlataforma() {
  const usuario = await exigirUsuario();
  if (!usuario.isPlatformAdmin) redirect("/dashboard");
  return usuario;
}

/**
 * Erro de autorização para uso em rotas de API e Server Actions, onde
 * `redirect()` não é a resposta certa.
 */
export class ErroDeAutorizacao extends Error {
  constructor(
    message = "Não autorizado",
    readonly status = 403,
  ) {
    super(message);
    this.name = "ErroDeAutorizacao";
  }
}

/** Versão para API: lança em vez de redirecionar. */
export async function tenantDaApi(): Promise<Contexto> {
  const sessao = await auth();
  if (!sessao?.user?.id) throw new ErroDeAutorizacao("Não autenticado", 401);
  if (!sessao.user.organizationId)
    throw new ErroDeAutorizacao("Usuário sem empresa vinculada", 403);

  return {
    userId: sessao.user.id,
    organizationId: sessao.user.organizationId,
    role: sessao.user.role,
    nome: sessao.user.name ?? "",
    email: sessao.user.email ?? "",
    isPlatformAdmin: sessao.user.isPlatformAdmin,
  };
}
