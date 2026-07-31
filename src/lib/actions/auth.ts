"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { z } from "zod";

import { registrarAuditoria } from "@/lib/audit";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { limitarPorIp } from "@/lib/rate-limit";

export type EstadoDoFormulario = {
  erro?: string;
  campos?: Record<string, string>;
};

const esquemaDeCadastro = z.object({
  empresa: z.string().min(2, "Informe o nome da empresa"),
  nome: z.string().min(2, "Informe seu nome"),
  email: z.string().email("E-mail inválido"),
  senha: z
    .string()
    .min(8, "A senha precisa de pelo menos 8 caracteres")
    .regex(/[a-zA-Z]/, "A senha precisa de pelo menos uma letra")
    .regex(/[0-9]/, "A senha precisa de pelo menos um número"),
});

function gerarSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export async function cadastrar(
  _estado: EstadoDoFormulario,
  dados: FormData,
): Promise<EstadoDoFormulario> {
  const limite = await limitarPorIp("cadastro", { max: 5, janelaSegundos: 600 });
  if (!limite.permitido)
    return { erro: "Muitas tentativas. Tente de novo em alguns minutos." };

  const analise = esquemaDeCadastro.safeParse({
    empresa: dados.get("empresa"),
    nome: dados.get("nome"),
    email: dados.get("email"),
    senha: dados.get("senha"),
  });

  if (!analise.success) {
    const campos: Record<string, string> = {};
    for (const problema of analise.error.issues) {
      campos[String(problema.path[0])] = problema.message;
    }
    return { campos };
  }

  const { empresa, nome, email, senha } = analise.data;
  const emailNormalizado = email.toLowerCase().trim();

  const jaExiste = await prisma.user.findUnique({
    where: { email: emailNormalizado },
    select: { id: true },
  });
  if (jaExiste) {
    return { campos: { email: "Já existe uma conta com este e-mail" } };
  }

  // Slug único: a empresa "Acme" da segunda pessoa vira acme-2.
  let slug = gerarSlug(empresa) || "empresa";
  let sufixo = 1;
  while (await prisma.organization.findUnique({ where: { slug }, select: { id: true } })) {
    sufixo += 1;
    slug = `${gerarSlug(empresa)}-${sufixo}`;
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  const fimDoTeste = new Date();
  fimDoTeste.setDate(fimDoTeste.getDate() + 14);

  const organizacao = await prisma.organization.create({
    data: {
      name: empresa.trim(),
      slug,
      subscription: {
        create: {
          planCode: "STARTER",
          status: "TRIALING",
          currentPeriodEnd: fimDoTeste,
        },
      },
      users: {
        create: {
          name: nome.trim(),
          email: emailNormalizado,
          passwordHash: senhaHash,
          role: "OWNER",
        },
      },
    },
    include: { users: true },
  });

  await registrarAuditoria({
    categoria: "AUTH",
    acao: "cadastro",
    organizationId: organizacao.id,
    userId: organizacao.users[0]?.id,
    entidade: "Organization",
    entidadeId: organizacao.id,
  });

  try {
    await signIn("credentials", {
      email: emailNormalizado,
      senha,
      redirect: false,
    });
  } catch (erro) {
    if (erro instanceof AuthError) {
      return { erro: "Conta criada, mas o login falhou. Tente entrar." };
    }
    throw erro;
  }

  redirect("/dashboard?bemvindo=1");
}

const esquemaDeLogin = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Informe a senha"),
});

export async function entrar(
  _estado: EstadoDoFormulario,
  dados: FormData,
): Promise<EstadoDoFormulario> {
  const limite = await limitarPorIp("login", { max: 10, janelaSegundos: 300 });
  if (!limite.permitido)
    return { erro: "Muitas tentativas. Tente de novo em alguns minutos." };

  const analise = esquemaDeLogin.safeParse({
    email: dados.get("email"),
    senha: dados.get("senha"),
  });

  if (!analise.success) {
    const campos: Record<string, string> = {};
    for (const problema of analise.error.issues) {
      campos[String(problema.path[0])] = problema.message;
    }
    return { campos };
  }

  const proximo = String(dados.get("proximo") ?? "/dashboard");

  try {
    await signIn("credentials", {
      email: analise.data.email,
      senha: analise.data.senha,
      redirect: false,
    });
  } catch (erro) {
    if (erro instanceof AuthError) {
      // Mensagem única de propósito: dizer "e-mail não existe" entrega quem
      // tem conta aqui pra quem estiver testando lista de e-mails.
      return { erro: "E-mail ou senha incorretos." };
    }
    throw erro;
  }

  redirect(proximo.startsWith("/") ? proximo : "/dashboard");
}
