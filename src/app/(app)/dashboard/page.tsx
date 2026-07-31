import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Plus, Users } from "lucide-react";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { CartaoIndicador } from "@/components/app/cartao-indicador";
import { EstadoVazio } from "@/components/app/estado-vazio";
import {
  DistribuicaoDeArquetipos,
  RadarComportamental,
  VolumeNoTempo,
} from "@/components/app/graficos-lazy";
import { LinhaDeCandidato } from "@/components/app/linha-de-candidato";
import type { Confianca } from "@/components/app/selo-de-confianca";
import { BotaoLink } from "@/components/ui/botao-link";
import {
  NotaDeRodape,
  Painel,
  PainelCabecalho,
  PainelLista,
} from "@/components/ui/painel";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import {
  distribuicaoDeArquetipos,
  mediaPorFator,
  melhoresAderencias,
  resumoDoPainel,
  volumePorSemana,
} from "@/lib/dados/dashboard";
import { duracao, numero } from "@/lib/formato";
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

  const criarVaga = (
    <BotaoLink href="/vagas/nova" className="gap-1.5">
      <Plus className="size-4" />
      Criar vaga
    </BotaoLink>
  );

  return (
    <div className="mx-auto max-w-7xl">
      <CabecalhoDePagina etiqueta="Painel" titulo="Visão geral" acoes={criarVaga} />

      {resumo.concluidas === 0 ? (
        <EstadoVazio
          icone={Users}
          titulo="Nenhuma resposta ainda"
          descricao="Crie uma vaga, escolha o perfil-alvo e mande o link para os candidatos. O ranking aparece aqui conforme as respostas chegam."
          acao={criarVaga}
        />
      ) : (
        <div className="space-y-4">
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
                  ? `tempo médio: ${duracao(resumo.duracaoMedia)}`
                  : undefined
              }
            />
          </section>

          <div className="grid items-start gap-4 lg:grid-cols-3">
            <Painel padding="nenhum" className="lg:col-span-2">
              <PainelCabecalho
                comBorda
                titulo="Maiores aderências"
                descricao="Entre as vagas abertas. Ordena — não elimina."
                acao={
                  <Link
                    href="/candidatos"
                    className="etiqueta inline-flex items-center gap-1 rounded-md py-1 hover:text-foreground"
                  >
                    Ver todos
                    <ArrowRight className="size-3" />
                  </Link>
                }
              />

              <PainelLista>
                {melhores.map((avaliacao, indice) => (
                  <LinhaDeCandidato
                    key={avaliacao.id}
                    href={`/candidatos/${avaliacao.candidate.id}?avaliacao=${avaliacao.id}`}
                    posicao={indice + 1}
                    nome={avaliacao.candidate.name}
                    detalhe={[
                      avaliacao.job.title,
                      avaliacao.archetypeId
                        ? ARQUETIPO_POR_ID.get(avaliacao.archetypeId)?.nome
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    escore={avaliacao.fitScore}
                    confianca={avaliacao.confidence as unknown as Confianca}
                  />
                ))}
              </PainelLista>
            </Painel>

            <Painel>
              <PainelCabecalho
                titulo="Perfil médio da base"
                descricao={
                  medias
                    ? `Média de ${numero(medias.n)} ${medias.n === 1 ? "resposta" : "respostas"}.`
                    : "Sem respostas ainda."
                }
              />

              {medias && (
                <>
                  <div className="mt-3">
                    <RadarComportamental escores={medias.medias} altura={260} />
                  </div>
                  {medias.n < 200 && (
                    <p className="t-legenda mt-2 rounded-lg bg-secondary px-3 py-2.5 text-muted-foreground">
                      Percentis só entram a partir de 200 respostas. Até lá o
                      relatório mostra faixa qualitativa — que é o que a amostra
                      sustenta.
                    </p>
                  )}
                </>
              )}
            </Painel>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Painel>
              <PainelCabecalho
                titulo="Respostas por semana"
                descricao="Últimas 12 semanas."
              />
              <div className="mt-4">
                <VolumeNoTempo dados={volume} />
              </div>
            </Painel>

            <Painel>
              <PainelCabecalho
                titulo="Arquétipos na base"
                descricao="Camada de leitura. Nunca entra em ranking nem em filtro."
              />
              <div className="mt-4">
                <DistribuicaoDeArquetipos
                  dados={arquetipos.map((a) => ({
                    nome: ARQUETIPO_POR_ID.get(a.id)?.nome ?? a.id,
                    total: a.total,
                  }))}
                />
              </div>
            </Painel>
          </div>

          <NotaDeRodape>
            Este resultado é um insumo para a entrevista. Ele não substitui a
            conversa com a pessoa e não deve ser o único critério de decisão.
          </NotaDeRodape>
        </div>
      )}
    </div>
  );
}
