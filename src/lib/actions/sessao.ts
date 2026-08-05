"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { registrarAuditoria } from "@/lib/audit";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Dispensa os primeiros passos do painel.
 *
 * Fica gravado no usuário, e não no navegador, porque a pergunta que a lista
 * responde ("como eu começo?") é da pessoa e não da máquina: quem já aprendeu
 * não deve reencontrar o tutorial ao abrir o painel no notebook de casa.
 */
export async function concluirPrimeirosPassos() {
  const sessao = await auth();
  const userId = sessao?.user?.id;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { onboardingDoneAt: new Date() },
  });

  revalidatePath("/dashboard");
}

export async function sair() {
  const sessao = await auth();

  await registrarAuditoria({
    categoria: "AUTH",
    acao: "logout",
    organizationId: sessao?.user?.organizationId,
    userId: sessao?.user?.id,
  });

  await signOut({ redirect: false });
  redirect("/entrar");
}
