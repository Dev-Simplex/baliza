import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquareQuote } from "lucide-react";

import { RadarComportamental } from "@/components/app/graficos";
import { SeloDeConfianca, type Confianca } from "@/components/app/selo-de-confianca";
import { Faixa, type DadosDaFaixa } from "@/components/faixa";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { montarRoteiro } from "@/lib/analise/roteiro";
import type { ContribuicaoDeFit } from "@/lib/instrument/scoring";
import { faixaQualitativa } from "@/lib/instrument/scoring";
import { FATORES, NOMES_DE_FATOR, type Fator } from "@/lib/instrument/types";
import { data, duracao, numero } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Candidato" };

type NotaDeFaceta = { fator: Fator; tendencia: string; texto: string };

export default async function PaginaDoCandidato({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ avaliacao?: string }>;
}) {
  const { id } = await params;
  const { avaliacao: avaliacaoId } = await searchParams;
  const { organizationId } = await exigirTenant();

  const candidato = await prisma.candidate.findFirst({
    where: { id, organizationId },
    include: {
      assessments: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        include: { job: { select: { id: true, title: true } } },
      },
    },
  });

  if (!candidato || candidato.assessments.length === 0) notFound();

  const avaliacao =
    candidato.assessments.find((a) => a.id === avaliacaoId) ??
    candidato.assessments[0];

  const escores = avaliacao.scores as Record<Fator, number>;
  const confianca = avaliacao.confidence as unknown as Confianca;
  const detalhe = avaliacao.fitDetail as {
    contribuicoes: ContribuicaoDeFit[];
    puxaramPraCima: ContribuicaoDeFit[];
    puxaramPraBaixo: ContribuicaoDeFit[];
    ignoradas: Fator[];
  };
  const facetas = (avaliacao.facetNotes as NotaDeFaceta[]) ?? [];
  const arquetipo = avaliacao.archetypeId
    ? ARQUETIPO_POR_ID.get(avaliacao.archetypeId)
    : null;

  const roteiro = montarRoteiro({
    contribuicoes: detalhe.contribuicoes ?? [],
    sinaisDeConfianca: confianca.sinais ?? [],
    arquetipoId: avaliacao.archetypeId,
    escores,
  });

  // Histórico: a mesma pessoa em mais de um processo desta empresa.
  const historico = candidato.assessments.filter((a) => a.id !== avaliacao.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href={`/vagas/${avaliacao.job.id}`}
          className="etiqueta inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          {avaliacao.job.title}
        </Link>

        <header className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="t-titulo">
              {candidato.name}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {candidato.email}
              {avaliacao.completedAt && ` · respondeu em ${data(avaliacao.completedAt)}`}
              {avaliacao.durationMs && ` · ${duracao(avaliacao.durationMs)}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <SeloDeConfianca confianca={confianca} />
            <div className="text-right">
              <p className="etiqueta">Aderência</p>
              <p className="leitura text-3xl leading-none font-semibold text-marca">
                {numero(avaliacao.fitScore ?? 0, 1)}
              </p>
            </div>
          </div>
        </header>
      </div>

      {/* O selo nunca aparece sozinho, e o número nunca aparece sem a conta. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">
              Por que a aderência é {numero(avaliacao.fitScore ?? 0, 1)}
            </h2>
            <p className="mt-1 mb-6 text-xs text-muted-foreground">
              {roteiro.resumoDoGap}
            </p>

            <div className="space-y-6">
              {(detalhe.contribuicoes ?? []).map((c, i) => {
                const dados: DadosDaFaixa = {
                  fator: c.fator,
                  nome: c.nome ?? NOMES_DE_FATOR[c.fator].ui,
                  escore: c.escore,
                  faixa: c.faixa,
                  ideal: c.ideal,
                  peso: c.peso,
                  tipo: c.tipo,
                  dentro: c.dentro,
                };
                return <Faixa key={c.fator} dados={dados} atraso={i * 0.06} />;
              })}

              {(detalhe.ignoradas ?? []).map((f) => (
                <Faixa
                  key={f}
                  dados={{
                    fator: f,
                    nome: NOMES_DE_FATOR[f].ui,
                    escore: escores[f],
                    faixa: [0, 100],
                    ideal: 50,
                    peso: 0,
                    tipo: "irrelevante",
                    dentro: true,
                  }}
                />
              ))}
            </div>

            <div className="mt-7 grid gap-4 border-t pt-5 sm:grid-cols-2">
              <div>
                <p className="etiqueta mb-2 text-dentro">Puxaram pra cima</p>
                <ul className="space-y-1 t-corpo-sm">
                  {detalhe.puxaramPraCima?.length ? (
                    detalhe.puxaramPraCima.map((c) => (
                      <li key={c.fator}>
                        {c.nome ?? NOMES_DE_FATOR[c.fator].ui}{" "}
                        <span className="leitura text-muted-foreground">
                          {Math.round(c.escore)}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">—</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="etiqueta mb-2 text-fora">Puxaram pra baixo</p>
                <ul className="space-y-1 t-corpo-sm">
                  {detalhe.puxaramPraBaixo?.length ? (
                    detalhe.puxaramPraBaixo.map((c) => (
                      <li key={c.fator}>
                        {c.nome ?? NOMES_DE_FATOR[c.fator].ui}{" "}
                        <span className="leitura text-muted-foreground">
                          {Math.round(c.escore)}
                        </span>
                      </li>
                    ))
                  ) : (
                    <li className="text-muted-foreground">—</li>
                  )}
                </ul>
              </div>
            </div>
          </section>

          {/* ─── O roteiro: o produto entrega decisão, não rótulo ──────── */}
          <section className="rounded-xl border border-marca/30 bg-marca-forte/[0.03] p-5">
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="size-4 text-marca" />
              <h2 className="text-sm font-semibold">Roteiro de entrevista</h2>
            </div>
            <p className="mt-1 mb-5 text-xs text-muted-foreground">
              Perguntas comportamentais — a pessoa conta um fato que aconteceu.
              Cada uma sonda um ponto específico deste perfil.
            </p>

            <ol className="space-y-4">
              {roteiro.perguntas.map((p, i) => (
                <li key={i} className="flex gap-3">
                  <span className="leitura mt-0.5 w-5 shrink-0 text-sm text-marca">
                    {i + 1}
                  </span>
                  <div>
                    <p className="t-corpo leading-snug">{p.pergunta}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {p.motivo}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* ─── Lateral ────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {arquetipo && (
            <section className="rounded-xl border bg-card p-5">
              <p className="etiqueta">
                {avaliacao.archetypeMixedWith ? "Perfil misto" : "Arquétipo"}
              </p>
              <h2 className="mt-1.5 text-lg font-semibold tracking-tight">
                {arquetipo.nome}
                {avaliacao.archetypeMixedWith &&
                  ` / ${ARQUETIPO_POR_ID.get(avaliacao.archetypeMixedWith)?.nome}`}
              </h2>
              <p className="mt-1 t-corpo-sm text-marca">{arquetipo.essencia}</p>

              <dl className="mt-4 space-y-3 t-corpo-sm leading-relaxed">
                <div>
                  <dt className="etiqueta mb-0.5">Brilha em</dt>
                  <dd className="text-muted-foreground">{arquetipo.brilhaEm}</dd>
                </div>
                <div>
                  <dt className="etiqueta mb-0.5">Trava em</dt>
                  <dd className="text-muted-foreground">{arquetipo.travaEm}</dd>
                </div>
                <div>
                  <dt className="etiqueta mb-0.5">Cuidado ao ler</dt>
                  <dd className="text-muted-foreground">{arquetipo.cuidadoAoLer}</dd>
                </div>
              </dl>

              <p className="mt-4 border-t pt-3 t-legenda leading-relaxed text-muted-foreground">
                Arquétipo é camada de leitura. Ele não entra no ranking, no fit
                nem em nenhum filtro.
              </p>
            </section>
          )}

          <section className="rounded-xl border bg-card p-5">
            <h2 className="text-sm font-semibold">Perfil comportamental</h2>
            <RadarComportamental escores={escores} altura={250} />

            <ul className="mt-3 space-y-2 border-t pt-4">
              {FATORES.map((f) => (
                <li key={f} className="flex items-baseline justify-between gap-3">
                  <span className="t-corpo-sm">{NOMES_DE_FATOR[f].ui}</span>
                  <span className="etiqueta shrink-0">
                    {faixaQualitativa(escores[f]).rotulo}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {facetas.length > 0 && (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold">Nuances</h2>
              <p className="mt-1 mb-3 text-xs text-muted-foreground">
                Leitura interna ao perfil. Faceta tem poucos itens e por isso
                nunca vira número nem entra em comparação.
              </p>
              <ul className="space-y-1.5 t-corpo-sm text-muted-foreground">
                {facetas.map((n, i) => (
                  <li key={i}>· {n.texto}</li>
                ))}
              </ul>
            </section>
          )}

          {historico.length > 0 && (
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold">Histórico nesta empresa</h2>
              <ul className="mt-3 space-y-2">
                {historico.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/candidatos/${candidato.id}?avaliacao=${a.id}`}
                      className="flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 t-corpo-sm transition-colors hover:bg-secondary"
                    >
                      <span className="truncate">{a.job.title}</span>
                      <span className="leitura shrink-0 text-muted-foreground">
                        {numero(a.fitScore ?? 0, 1)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 t-legenda leading-relaxed text-muted-foreground">
                Cada aplicação sorteia itens novos do banco, então reaplicar mede
                mudança — não memória.
              </p>
            </section>
          )}
        </div>
      </div>

      <p className="rounded-xl border border-dashed px-5 py-4 t-corpo-sm leading-relaxed text-muted-foreground">
        Este resultado é um insumo para a entrevista. Ele não substitui a conversa
        com a pessoa e não deve ser o único critério de decisão.
      </p>
    </div>
  );
}
