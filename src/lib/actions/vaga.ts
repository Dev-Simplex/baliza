"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { registrarAuditoria } from "@/lib/audit";
import { PERFIL_NEUTRO, PRESET_POR_ID } from "@/lib/instrument/presets";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/tenant";

export type EstadoDaVaga = {
  erro?: string;
  campos?: Record<string, string>;
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
  });

  if (!analise.success) {
    const campos: Record<string, string> = {};
    for (const p of analise.error.issues) campos[String(p.path[0])] = p.message;
    return { campos };
  }

  const preset = PRESET_POR_ID.get(analise.data.preset);

  // O preset é COPIADO para a vaga: a partir daqui ela tem vida própria e
  // editar o perfil de uma vaga não mexe em nenhuma outra.
  const perfil = preset ? preset.dimensoes : PERFIL_NEUTRO;

  const vaga = await prisma.job.create({
    data: {
      organizationId: contexto.organizationId,
      title: analise.data.titulo.trim(),
      description: analise.data.descricao?.trim() || null,
      requirements: analise.data.requisitos?.trim() || null,
      seniority: analise.data.senioridade,
      workModel: analise.data.modelo,
      department: analise.data.departamento?.trim() || null,
      location: analise.data.local?.trim() || null,
      status: "OPEN",
      presetId: preset?.id ?? null,
      targetProfile: perfil as never,
      createdById: contexto.userId,
    },
  });

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: "vaga_criada",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Job",
    entidadeId: vaga.id,
    metadados: { titulo: vaga.title, preset: preset?.id },
  });

  revalidatePath("/vagas");
  redirect(`/vagas/${vaga.id}`);
}
