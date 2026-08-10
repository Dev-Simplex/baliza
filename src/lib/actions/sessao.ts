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

/**
 * Fecha a apresentação de entrada, para sempre.
 *
 * Chamada tanto ao terminar quanto ao pular: as duas significam a mesma coisa
 * — "já vi isto" — e distinguir só serviria para mostrar de novo a quem já
 * disse que não queria. Quem quiser rever tem a página `/como-funciona`, que
 * é a versão completa e não some nunca.
 */
export async function concluirTutorialDeEntrada() {
  const sessao = await auth();
  const userId = sessao?.user?.id;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { welcomeTourAt: new Date() },
  });

  revalidatePath("/dashboard");
}

/**
 * Faz a apresentação de entrada abrir de novo no próximo carregamento.
 *
 * Existe porque ela é de uso único por decisão de projeto — e uso único sem
 * caminho de volta vira armadilha: quem clicou em "Pular" no primeiro minuto,
 * antes de saber o que estava pulando, não teria como rever. Ficar no menu do
 * usuário é o lugar certo: é onde se procura o que é "meu" e não da empresa.
 */
export async function reverTutorialDeEntrada() {
  const sessao = await auth();
  const userId = sessao?.user?.id;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: { welcomeTourAt: null },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
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
