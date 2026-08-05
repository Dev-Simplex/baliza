"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { registrarAuditoria } from "@/lib/audit";
import { PERFIL_NEUTRO, PRESET_POR_ID } from "@/lib/instrument/presets";
import { prisma } from "@/lib/prisma";
import { exigirPapel } from "@/lib/tenant";
import { gerarTokenDeVaga } from "@/lib/token-de-vaga";

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
  // "aberta": qualquer pessoa com o link responde e se cadastra sozinha.
  // "fechada": só entra quem o RH cadastrou — o link público recusa.
  entrada: z.enum(["aberta", "fechada"]).default("aberta"),
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
    entrada: dados.get("entrada") ?? "aberta",
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

  const vaga = await criarComTokenLegivel({
    organizationId: contexto.organizationId,
    title: analise.data.titulo.trim(),
    description: analise.data.descricao?.trim() || null,
    requirements: analise.data.requisitos?.trim() || null,
    seniority: analise.data.senioridade,
    workModel: analise.data.modelo,
    department: analise.data.departamento?.trim() || null,
    location: analise.data.local?.trim() || null,
    status: "OPEN",
    // `publicEnabled` é o modo de entrada: com ele desligado a página pública
    // recusa e a vaga só recebe quem o RH cadastrou.
    publicEnabled: analise.data.entrada === "aberta",
    presetId: preset?.id ?? null,
    targetProfile: perfil as never,
    createdById: contexto.userId,
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

/**
 * Troca o modo de entrada de uma vaga que já existe.
 *
 * Fechar não apaga nada: convites já emitidos continuam valendo. O que muda é a
 * porta da rua — quem chegar pelo link público passa a ver "esta vaga é por
 * convite" em vez do formulário.
 */
export async function alternarModoDaVaga(jobId: string, aberta: boolean) {
  const contexto = await exigirPapel("RECRUITER");

  const vaga = await prisma.job.updateMany({
    where: { id: jobId, organizationId: contexto.organizationId },
    data: { publicEnabled: aberta },
  });

  if (vaga.count === 0) return { ok: false as const, erro: "Vaga não encontrada." };

  await registrarAuditoria({
    categoria: "MUTATION",
    acao: aberta ? "vaga_aberta_ao_publico" : "vaga_fechada_para_convite",
    organizationId: contexto.organizationId,
    userId: contexto.userId,
    entidade: "Job",
    entidadeId: jobId,
  });

  revalidatePath(`/vagas/${jobId}`);
  return { ok: true as const };
}

/**
 * Cria a vaga com o endereço público legível.
 *
 * O sufixo aleatório torna a colisão improvável, não impossível — duas vagas
 * com o mesmo título no mesmo segundo existem. `publicToken` é UNIQUE no banco,
 * então a colisão vira erro P2002 e a saída é tentar outro sufixo, nunca deixar
 * o cadastro falhar por causa de um sorteio.
 */
async function criarComTokenLegivel(
  dados: Parameters<typeof prisma.job.create>[0]["data"],
) {
  const titulo = typeof dados.title === "string" ? dados.title : "vaga";

  for (let tentativa = 0; tentativa < 5; tentativa += 1) {
    try {
      return await prisma.job.create({
        data: { ...dados, publicToken: gerarTokenDeVaga(titulo) },
      });
    } catch (erro) {
      const colidiu =
        typeof erro === "object" &&
        erro !== null &&
        "code" in erro &&
        (erro as { code?: string }).code === "P2002";
      if (!colidiu) throw erro;
    }
  }

  // Cinco sorteios seguidos batendo é sinal de outra coisa; deixa o banco
  // gerar o `cuid` do default em vez de recusar a vaga.
  return prisma.job.create({ data: dados });
}
