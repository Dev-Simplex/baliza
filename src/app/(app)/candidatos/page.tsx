import type { Metadata } from "next";
import Link from "next/link";

import { SeloDeConfianca, type Confianca } from "@/components/app/selo-de-confianca";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { data, iniciais, numero } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Candidatos" };

export default async function PaginaDeCandidatos() {
  const { organizationId } = await exigirTenant();

  const avaliacoes = await prisma.assessment.findMany({
    where: { organizationId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 100,
    include: {
      candidate: { select: { id: true, name: true, email: true } },
      job: { select: { title: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="etiqueta">Base</p>
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
          Candidatos
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {avaliacoes.length === 0
            ? "Nenhuma resposta ainda."
            : `${numero(avaliacoes.length)} ${avaliacoes.length === 1 ? "resposta concluída" : "respostas concluídas"}, da mais recente para a mais antiga.`}
        </p>
      </header>

      {avaliacoes.length > 0 && (
        <div className="overflow-hidden rounded-xl border bg-card">
          <ul className="divide-y">
            {avaliacoes.map((a) => {
              const arquetipo = a.archetypeId
                ? ARQUETIPO_POR_ID.get(a.archetypeId)
                : null;
              return (
                <li key={a.id}>
                  <Link
                    href={`/candidatos/${a.candidate.id}?avaliacao=${a.id}`}
                    className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-secondary/40"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-[11px] font-semibold text-muted-foreground">
                      {iniciais(a.candidate.name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium">
                        {a.candidate.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.job.title}
                        {arquetipo && ` · ${arquetipo.nome}`}
                      </p>
                    </div>

                    <span className="etiqueta hidden shrink-0 md:block">
                      {data(a.completedAt)}
                    </span>

                    <div className="hidden shrink-0 sm:block">
                      <SeloDeConfianca
                        tamanho="sm"
                        confianca={a.confidence as unknown as Confianca}
                      />
                    </div>

                    <span className="leitura w-12 shrink-0 text-right text-[15px] font-semibold">
                      {numero(a.fitScore ?? 0, 1)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
