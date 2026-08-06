import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, Plus } from "lucide-react";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { EstadoVazio } from "@/components/app/estado-vazio";
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
import { exigirTenant, podeAoMenos } from "@/lib/tenant";

export const metadata: Metadata = { title: "Vagas" };

/**
 * Cor do status. `DRAFT` e `CLOSED` compartilham o cinza de propósito: nenhum
 * dos dois recebe resposta, e o que os diferencia está escrito no rótulo.
 */
const COR_DO_STATUS: Record<string, string> = {
  OPEN: "border-dentro/40 bg-dentro/10 text-dentro",
  DRAFT: "border-border bg-secondary text-muted-foreground",
  PAUSED: "border-marca/40 bg-marca-forte/10 text-marca",
  CLOSED: "border-border bg-secondary text-muted-foreground",
};

/**
 * A ordem em que as vagas aparecem.
 *
 * Ordenar por `status` no banco parece resolver e não resolve: o Postgres ordena
 * enum pela ordem de declaração, e ali `DRAFT` vem antes de `OPEN` — rascunho na
 * frente do que está recebendo gente. Quem abre esta tela quer ver primeiro o
 * que está em andamento, e encerrada por último.
 */
const ORDEM_DO_STATUS: Record<string, number> = {
  OPEN: 0,
  PAUSED: 1,
  DRAFT: 2,
  CLOSED: 3,
};

export default async function PaginaDeVagas() {
  const { organizationId, role } = await exigirTenant();
  // Criar vaga exige RECRUITER; para quem só lê o botão levava a um
  // redirecionamento com "erro=permissao" depois de preencher o formulário.
  const podeCriar = podeAoMenos(role, "RECRUITER");

  const encontradas = await prisma.job.findMany({
    where: { organizationId },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { assessments: true } },
      assessments: {
        where: { status: "COMPLETED" },
        select: { fitScore: true },
      },
    },
  });

  // Ordenação estável: mantém a mais recente na frente dentro de cada situação.
  const vagas = [...encontradas].sort(
    (a, b) =>
      (ORDEM_DO_STATUS[a.status] ?? 9) - (ORDEM_DO_STATUS[b.status] ?? 9),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <CabecalhoDePagina
        etiqueta="Processos"
        titulo="Vagas"
        descricao={
          vagas.length === 0
            ? undefined
            : `${numero(vagas.length)} ${vagas.length === 1 ? "vaga" : "vagas"} — abertas primeiro, encerradas no fim.`
        }
        acoes={
          podeCriar && (
            <BotaoLink href="/vagas/nova" className="gap-2">
              <Plus className="size-4" />
              Criar vaga
            </BotaoLink>
          )
        }
      />

      {vagas.length === 0 ? (
        <EstadoVazio
          icone={BriefcaseBusiness}
          titulo="Nenhuma vaga ainda"
          descricao="Uma vaga define o perfil-alvo: as faixas de cada dimensão que aquele trabalho pede. É contra ele que a aderência de cada candidato é calculada."
          acao={
            podeCriar && (
              <BotaoLink href="/vagas/nova" className="gap-2">
                <Plus className="size-4" />
                Criar a primeira vaga
              </BotaoLink>
            )
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {vagas.map((vaga) => {
            const concluidas = vaga.assessments.length;
            // A média é só de quem TEM aderência. Contar `?? 0` afundava a
            // média da vaga a cada resposta de bateria que não mede os cinco
            // fatores — e o número resultante não seria de ninguém.
            const comAderencia = vaga.assessments.filter(
              (a) => a.fitScore != null,
            );
            const media =
              comAderencia.length > 0
                ? comAderencia.reduce((a, b) => a + (b.fitScore ?? 0), 0) /
                  comAderencia.length
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

                  {/* Os mesmos três números, com os mesmos nomes, que a linha
                      desta vaga mostra em Relatórios. "Receberam" conta
                      AVALIAÇÕES, não convites: em vaga aberta o candidato entra
                      pelo link e nunca passa por convite — contar convite fazia
                      o cartão dizer "0 convites · 5 respostas". */}
                  <div className="mt-5 grid grid-cols-3 gap-3 border-t pt-4">
                    <Indicador
                      rotulo="Receberam"
                      valor={numero(vaga._count.assessments)}
                    />
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
