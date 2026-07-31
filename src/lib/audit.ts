import { headers } from "next/headers";
import type { AuditCategory } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type Entrada = {
  categoria: AuditCategory;
  acao: string;
  organizationId?: string | null;
  userId?: string | null;
  entidade?: string;
  entidadeId?: string;
  metadados?: Record<string, unknown>;
};

/** IP e user-agent da requisição atual, quando houver contexto de requisição. */
async function contextoDaRequisicao() {
  try {
    const h = await headers();
    return {
      ip:
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        null,
      userAgent: h.get("user-agent"),
    };
  } catch {
    // Fora de um ciclo de requisição (job, seed, cron).
    return { ip: null, userAgent: null };
  }
}

/**
 * Trilha de auditoria. Nunca lança: log que quebra a operação que ele deveria
 * apenas observar é pior que log perdido.
 */
export async function registrarAuditoria(entrada: Entrada) {
  try {
    const { ip, userAgent } = await contextoDaRequisicao();
    await prisma.auditLog.create({
      data: {
        category: entrada.categoria,
        action: entrada.acao,
        organizationId: entrada.organizationId ?? null,
        userId: entrada.userId ?? null,
        entity: entrada.entidade,
        entityId: entrada.entidadeId,
        metadata: entrada.metadados as never,
        ip,
        userAgent,
      },
    });
  } catch (erro) {
    console.error("[auditoria] falhou ao registrar", entrada.acao, erro);
  }
}
