"use server";

import { redirect } from "next/navigation";

import { registrarAuditoria } from "@/lib/audit";
import { auth, signOut } from "@/lib/auth";

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
