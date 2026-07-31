import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { BotaoLink } from "@/components/ui/botao-link";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import {
  ROTULO_DE_MODELO,
  ROTULO_DE_SENIORIDADE,
  ROTULO_DE_STATUS_DE_VAGA,
  haQuantoTempo,
  numero,
} from "@/lib/formato";
import { exigirTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Vagas" };

const COR_DO_STATUS: Record<string, string> = {
  OPEN: "border-dentro/40 bg-dentro/10 text-dentro",
  DRAFT: "border-border bg-secondary text-muted-foreground",
  PAUSED: "border-marca/40 bg-marca-forte/10 text-marca",
  CLOSED: "border-border bg-secondary text-muted-foreground",
};

export default async function PaginaDeVagas() {
  const { organizationId } = await exigirTenant();

  const vagas = await prisma.job.findMany({
    where: { organizationId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: {
      _count: { select: { assessments: true, invitations: true } },
      assessments: {
        where: { status: "COMPLETED" },
        select: { fitScore: true },
      },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etiqueta">Processos</p>
          <h1 className="mt-1.5 t-titulo">Vagas</h1>
        </div>
        <BotaoLink href="/vagas/nova" className="gap-2">
          <Plus className="size-4" />
          Criar vaga
        </BotaoLink>
      </header>

      {vagas.length === 0 ? (
        <div className="rounded-xl border border-dashed px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">Nenhuma vaga ainda</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Uma vaga define o perfil-alvo: as faixas de cada dimensão que aquele
            trabalho pede. É contra ele que a aderência de cada candidato é
            calculada.
          </p>
          <BotaoLink href="/vagas/nova" className="mt-6 gap-2">
            <Plus className="size-4" />
            Criar a primeira vaga
          </BotaoLink>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {vagas.map((vaga) => {
            const concluidas = vaga.assessments.length;
            const media =
              concluidas > 0
                ? vaga.assessments.reduce((a, b) => a + (b.fitScore ?? 0), 0) /
                  concluidas
                : null;

            return (
              <li key={vaga.id}>
                <Link
                  href={`/vagas/${vaga.id}`}
                  className="flex h-full flex-col rounded-xl border bg-card p-5 transition-colors hover:border-marca/40 hover:bg-secondary/30"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="t-corpo leading-snug font-semibold">
                      {vaga.title}
                    </h2>
                    <Badge
                      className={`shrink-0 border ${COR_DO_STATUS[vaga.status]}`}
                    >
                      {ROTULO_DE_STATUS_DE_VAGA[vaga.status]}
                    </Badge>
                  </div>

                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {[
                      vaga.department,
                      ROTULO_DE_SENIORIDADE[vaga.seniority],
                      ROTULO_DE_MODELO[vaga.workModel],
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4">
                    <Indicador rotulo="Convites" valor={numero(vaga._count.invitations)} />
                    <Indicador rotulo="Respostas" valor={numero(concluidas)} />
                    <Indicador
                      rotulo="Aderência"
                      valor={media === null ? "—" : numero(media, 1)}
                      destaque
                    />
                  </div>

                  <p className="etiqueta mt-4">
                    criada {haQuantoTempo(vaga.createdAt)}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Indicador({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <p className="etiqueta">{rotulo}</p>
      <p
        className={`leitura mt-1 t-corpo font-semibold ${destaque ? "text-marca" : ""}`}
      >
        {valor}
      </p>
    </div>
  );
}
