import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { CartaoIndicador } from "@/components/app/cartao-indicador";
import {
  DistribuicaoDeArquetipos,
  RadarComportamental,
  VolumeNoTempo,
} from "@/components/app/graficos";
import { SeloDeConfianca, type Confianca } from "@/components/app/selo-de-confianca";
import { BotaoLink } from "@/components/ui/botao-link";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import {
  distribuicaoDeArquetipos,
  mediaPorFator,
  melhoresAderencias,
  resumoDoPainel,
  volumePorSemana,
} from "@/lib/dados/dashboard";
import { duracao, haQuantoTempo, numero } from "@/lib/formato";
import { exigirTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Visão geral" };

export default async function PaginaDoPainel() {
  const { organizationId } = await exigirTenant();

  const [resumo, medias, melhores, volume, arquetipos] = await Promise.all([
    resumoDoPainel(organizationId),
    mediaPorFator(organizationId),
    melhoresAderencias(organizationId),
    volumePorSemana(organizationId),
    distribuicaoDeArquetipos(organizationId),
  ]);

  const semDados = resumo.concluidas === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="etiqueta">Painel</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight">
            Visão geral
          </h1>
        </div>

        <BotaoLink href="/vagas/nova" className="gap-2">
          <Plus className="size-4" />
          Criar vaga
        </BotaoLink>
      </header>

      {semDados ? (
        <EstadoVazio />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CartaoIndicador
              rotulo="Candidatos"
              valor={numero(resumo.candidatos)}
              apoio={`${resumo.vagasAbertas} ${resumo.vagasAbertas === 1 ? "vaga aberta" : "vagas abertas"}`}
            />
            <CartaoIndicador
              rotulo="Respostas concluídas"
              valor={numero(resumo.concluidas)}
              variacao={{
                atual: resumo.concluidasNoPeriodo,
                anterior: resumo.concluidasNoPeriodoAnterior,
              }}
              apoio="vs. 30 dias anteriores"
            />
            <CartaoIndicador
              rotulo="Aguardando resposta"
              valor={numero(resumo.pendentes)}
              apoio={
                resumo.emAndamento > 0
                  ? `${resumo.emAndamento} em andamento`
                  : "convites em aberto"
              }
            />
            <CartaoIndicador
              destaque
              rotulo="Aderência média"
              valor={
                resumo.aderenciaMedia === null
                  ? "—"
                  : numero(resumo.aderenciaMedia, 1)
              }
              apoio={
                resumo.duracaoMedia
                  ? `tempo médio de resposta: ${duracao(resumo.duracaoMedia)}`
                  : undefined
              }
            />
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* ─── Ranking ─────────────────────────────────────────────── */}
            <section className="rounded-xl border bg-card lg:col-span-2">
              <header className="flex items-center justify-between border-b px-5 py-3.5">
                <div>
                  <h2 className="text-sm font-semibold">Maiores aderências</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Entre as vagas abertas. Ordena — não elimina.
                  </p>
                </div>
                <Link
                  href="/candidatos"
                  className="etiqueta flex items-center gap-1 hover:text-foreground"
                >
                  Ver todos
                  <ArrowRight className="size-3" />
                </Link>
              </header>

              <ul className="divide-y">
                {melhores.map((a, indice) => {
                  const arquetipo = a.archetypeId
                    ? ARQUETIPO_POR_ID.get(a.archetypeId)
                    : null;
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/candidatos/${a.candidate.id}?avaliacao=${a.id}`}
                        className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-secondary/50"
                      >
                        <span className="leitura w-5 shrink-0 text-sm text-muted-foreground">
                          {indice + 1}
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
            </section>

            {/* ─── Perfil médio ────────────────────────────────────────── */}
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold">Perfil médio da base</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {medias
                  ? `Média de ${numero(medias.n)} ${medias.n === 1 ? "resposta" : "respostas"}.`
                  : "Sem respostas ainda."}
              </p>

              {medias && (
                <>
                  <div className="mt-2">
                    <RadarComportamental escores={medias.medias} altura={260} />
                  </div>
                  {medias.n < 200 && (
                    <p className="mt-1 rounded-lg bg-secondary px-3 py-2 text-[11.5px] leading-relaxed text-muted-foreground">
                      Percentis só entram a partir de 200 respostas. Até lá o
                      relatório mostra faixa qualitativa — que é o que a amostra
                      sustenta.
                    </p>
                  )}
                </>
              )}
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold">Respostas por semana</h2>
              <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                Últimas 12 semanas.
              </p>
              <VolumeNoTempo dados={volume} />
            </section>

            <section className="rounded-xl border bg-card p-5">
              <h2 className="text-sm font-semibold">Arquétipos na base</h2>
              <p className="mt-0.5 mb-3 text-xs text-muted-foreground">
                Camada de leitura. Nunca entra em ranking nem em filtro.
              </p>
              <DistribuicaoDeArquetipos
                dados={arquetipos.map((a) => ({
                  nome: ARQUETIPO_POR_ID.get(a.id)?.nome ?? a.id,
                  total: a.total,
                }))}
              />
            </section>
          </div>

          <p className="rounded-xl border border-dashed px-5 py-4 text-[13px] leading-relaxed text-muted-foreground">
            Este resultado é um insumo para a entrevista. Ele não substitui a
            conversa com a pessoa e não deve ser o único critério de decisão.
          </p>
        </>
      )}
    </div>
  );
}

function EstadoVazio() {
  return (
    <div className="rounded-xl border border-dashed px-6 py-16 text-center">
      <h2 className="text-lg font-semibold">Nenhuma resposta ainda</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Crie uma vaga, escolha o perfil-alvo e mande o link para os candidatos.
        O ranking aparece aqui conforme as respostas chegam.
      </p>
      <BotaoLink href="/vagas/nova" className="mt-6 gap-2">
        <Plus className="size-4" />
        Criar a primeira vaga
      </BotaoLink>
    </div>
  );
}
