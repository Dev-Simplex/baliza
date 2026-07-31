import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft } from "lucide-react";

import { CompartilharVaga } from "@/components/app/compartilhar-vaga";
import { SeloDeConfianca, type Confianca } from "@/components/app/selo-de-confianca";
import { Faixa, FaixaMinima, type DadosDaFaixa } from "@/components/faixa";
import { Badge } from "@/components/ui/badge";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { idealDaDimensao } from "@/lib/instrument/scoring";
import {
  FATORES,
  NOMES_DE_FATOR,
  type Fator,
  type PerfilAlvo,
} from "@/lib/instrument/types";
import {
  ROTULO_DE_MODELO,
  ROTULO_DE_SENIORIDADE,
  ROTULO_DE_STATUS_DE_VAGA,
  duracao,
  haQuantoTempo,
  numero,
} from "@/lib/formato";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Vaga" };

export default async function PaginaDaVaga({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId } = await exigirTenant();

  // O escopo por empresa vai no WHERE, não numa checagem depois da leitura:
  // trocar o id na URL simplesmente não encontra nada.
  const vaga = await prisma.job.findFirst({
    where: { id, organizationId },
    include: {
      assessments: {
        where: { status: "COMPLETED" },
        orderBy: { fitScore: "desc" },
        include: { candidate: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { invitations: true } },
    },
  });

  if (!vaga) notFound();

  const perfil = vaga.targetProfile as unknown as PerfilAlvo;
  const url = `${env.NEXT_PUBLIC_APP_URL}/vaga/${vaga.publicToken}`;
  const qr = await QRCode.toDataURL(url, {
    width: 440,
    margin: 1,
    color: { dark: "#0b0e14", light: "#ffffff" },
  });

  const pendentes = await prisma.assessment.count({
    where: { jobId: vaga.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/vagas"
          className="etiqueta inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Vagas
        </Link>

        <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{vaga.title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {[
                vaga.department,
                ROTULO_DE_SENIORIDADE[vaga.seniority],
                ROTULO_DE_MODELO[vaga.workModel],
                vaga.location,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <Badge className="border">{ROTULO_DE_STATUS_DE_VAGA[vaga.status]}</Badge>
        </header>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        {/* ─── Ranking ────────────────────────────────────────────────── */}
        <section className="rounded-xl border bg-card">
          <header className="border-b px-5 py-4">
            <h2 className="text-sm font-semibold">
              Ranking por aderência
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {vaga.assessments.length}{" "}
                {vaga.assessments.length === 1 ? "resposta" : "respostas"}
                {pendentes > 0 && ` · ${pendentes} aguardando`}
              </span>
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              A ordem é sugestão de prioridade de conversa. Nenhum candidato é
              descartado automaticamente.
            </p>
          </header>

          {vaga.assessments.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhuma resposta ainda. Compartilhe o link ao lado.
              </p>
            </div>
          ) : (
            <ul className="divide-y">
              {vaga.assessments.map((avaliacao, indice) => {
                const escores = avaliacao.scores as Record<Fator, number>;
                const arquetipo = avaliacao.archetypeId
                  ? ARQUETIPO_POR_ID.get(avaliacao.archetypeId)
                  : null;
                const detalhe = avaliacao.fitDetail as {
                  puxaramPraBaixo?: Array<{ fator: Fator; dentro: boolean }>;
                } | null;
                const derrubou = detalhe?.puxaramPraBaixo?.[0];

                return (
                  <li key={avaliacao.id}>
                    <Link
                      href={`/candidatos/${avaliacao.candidate.id}?avaliacao=${avaliacao.id}`}
                      className="block px-5 py-4 transition-colors hover:bg-secondary/40"
                    >
                      <div className="flex items-center gap-4">
                        <span className="leitura w-5 shrink-0 text-sm text-muted-foreground">
                          {indice + 1}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14.5px] font-medium">
                            {avaliacao.candidate.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {arquetipo?.nome ?? "—"}
                            {avaliacao.durationMs &&
                              ` · respondeu em ${duracao(avaliacao.durationMs)}`}
                            {avaliacao.completedAt &&
                              ` · ${haQuantoTempo(avaliacao.completedAt)}`}
                          </p>
                        </div>

                        <SeloDeConfianca
                          tamanho="sm"
                          confianca={avaliacao.confidence as unknown as Confianca}
                        />

                        <span className="leitura w-14 shrink-0 text-right text-base font-semibold">
                          {numero(avaliacao.fitScore ?? 0, 1)}
                        </span>
                      </div>

                      {/* Mini-medidores: a leitura da linha inteira num relance. */}
                      <div className="mt-3 grid grid-cols-5 gap-2 pl-9">
                        {FATORES.map((f) => {
                          const cfg = perfil[f];
                          if (!cfg || cfg.peso === 0)
                            return (
                              <div key={f} className="opacity-25">
                                <p className="etiqueta mb-1">{f}</p>
                                <div className="h-1.5 rounded-full bg-muted" />
                              </div>
                            );
                          const dentro =
                            escores[f] >= cfg.faixa[0] && escores[f] <= cfg.faixa[1];
                          return (
                            <div key={f}>
                              <p className="etiqueta mb-1">{f}</p>
                              <FaixaMinima
                                escore={escores[f]}
                                faixa={cfg.faixa}
                                dentro={dentro}
                              />
                            </div>
                          );
                        })}
                      </div>

                      {derrubou && !derrubou.dentro && (
                        <p className="mt-2.5 pl-9 text-xs text-n-clay">
                          Puxa pra baixo: {NOMES_DE_FATOR[derrubou.fator].ui}
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* ─── Lateral ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Link do questionário</h2>
            <p className="mt-1 mb-4 text-xs text-muted-foreground">
              Quem abrir informa nome e e-mail e já começa a responder.
            </p>
            <CompartilharVaga url={url} qrDataUrl={qr} titulo={vaga.title} />
          </section>

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Perfil-alvo</h2>
            <p className="mt-1 mb-5 text-xs text-muted-foreground">
              As faixas que esta vaga pede. É contra elas que a aderência é
              calculada.
            </p>

            <div className="space-y-5">
              {FATORES.map((f, i) => {
                const cfg = perfil[f];
                if (!cfg) return null;
                const dados: DadosDaFaixa = {
                  fator: f,
                  nome: NOMES_DE_FATOR[f].ui,
                  // No perfil-alvo o marcador mostra o IDEAL, não um candidato.
                  escore: idealDaDimensao(cfg),
                  faixa: cfg.faixa,
                  ideal: idealDaDimensao(cfg),
                  peso: cfg.peso,
                  tipo: cfg.tipo,
                  dentro: true,
                };
                return <Faixa key={f} dados={dados} atraso={i * 0.05} />;
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
