import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Hourglass, MessageSquareQuote } from "lucide-react";

import { CodigoDeAcesso } from "@/components/app/codigo-de-acesso";
import { BotaoCopiar } from "@/components/app/copiar";
import { DiagnosticoDoCandidato } from "@/components/app/diagnostico-do-candidato";
import { EstadoVazio } from "@/components/app/estado-vazio";
import { FichaDosModulos } from "@/components/app/ficha-de-modulos";
import { ParecerDoAnalista } from "@/components/app/parecer-do-analista";
import { RadarComportamental } from "@/components/app/graficos";
import {
  BotaoSalvarPdf,
  CabecalhoDeImpressao,
  RodapeDeImpressao,
} from "@/components/app/impressao";
import { SeloDeConfianca, type Confianca } from "@/components/app/selo-de-confianca";
import { Faixa, type DadosDaFaixa } from "@/components/faixa";
import { BotaoLink } from "@/components/ui/botao-link";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { CATALOGO_DE_TESTES, type Teste } from "@/lib/instrument/baterias";
import { montarDiagnostico } from "@/lib/analise/diagnostico";
import { lerAvaliacao, type LeituraDaAvaliacao } from "@/lib/analise/modulos";
import { montarRoteiro } from "@/lib/analise/roteiro";
import type { ContribuicaoDeFit } from "@/lib/instrument/scoring";
import { faixaQualitativa, separarPorFaixa } from "@/lib/instrument/scoring";
import {
  FATORES,
  NOMES_DE_FATOR,
  type Fator,
  type PerfilAlvo,
} from "@/lib/instrument/types";
import {
  ROTULO_DE_STATUS_DE_AVALIACAO,
  data,
  duracao,
  haQuantoTempo,
  numero,
} from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";
import { urlBase } from "@/lib/url-publica";

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
      // O nome da empresa só é usado no cabeçalho impresso — a tela já sabe
      // em qual conta está. Vem por aqui para o documento não sair anônimo.
      organization: { select: { name: true } },
      assessments: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        include: {
          job: { select: { id: true, title: true, targetProfile: true } },
          // Só o nome de quem deu o parecer. Parecer sem autor não sustenta uma
          // conversa seis meses depois nem um pedido de revisão.
          decidedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!candidato) notFound();

  // Pessoa cadastrada que ainda não terminou caía num 404 — que diz "não
  // existe" de alguém que existe e está no meio do processo. O que o RH precisa
  // saber aqui é em que pé está e como reenviar o acesso.
  if (candidato.assessments.length === 0) {
    return (
      <AguardandoResposta
        candidatoId={candidato.id}
        organizationId={organizationId}
      />
    );
  }

  const avaliacao =
    candidato.assessments.find((a) => a.id === avaliacaoId) ??
    candidato.assessments[0];

  const leitura = lerAvaliacao(
    avaliacao,
    await respostasBrutas(avaliacao),
    avaliacao.job.targetProfile as unknown as PerfilAlvo | null,
  );

  /*
   * Sem os cinco fatores não existe ficha de aderência para montar.
   *
   * Acontece quando a bateria da vaga não tem o Mapeamento Baliza nem o Big Five: DISC devolve
   * estilo e o SJT devolve acerto contra gabarito, e nenhum dos dois vira
   * fator.
   *
   * A saída é dizer isso com todas as letras e mostrar o que os testes
   * aplicados produziram — e não desenhar o relatório de sempre com zeros:
   * metade desta página lê `escores[fator]` e a outra metade lê o detalhe do
   * fit. Zero na tela se lê como "candidato péssimo", que é a leitura que
   * decide quem vai para a entrevista.
   */
  if (!leitura.escores) {
    return (
      <SemOsCincoFatores
        candidatoId={candidato.id}
        candidato={candidato.name}
        email={candidato.email}
        vaga={avaliacao.job}
        avaliacaoId={avaliacao.id}
        leitura={leitura}
        respondidoEm={avaliacao.completedAt}
      />
    );
  }

  const escores = leitura.escores;
  // `selo` nunca é nulo quando há aderência (é a regra do §4.4, garantida em
  // `lerAvaliacao`) — mas o número também pode faltar por conta própria, e aí
  // não há o que acompanhar.
  const confianca = leitura.selo as unknown as Confianca | null;
  const aderencia =
    avaliacao.fitScore == null ? null : numero(avaliacao.fitScore, 1);
  const detalhe = (avaliacao.fitDetail ?? {}) as {
    contribuicoes?: ContribuicaoDeFit[];
    ignoradas?: Fator[];
  };
  // Derivadas na leitura, e não lidas de `fitDetail.puxaram*`. A cópia gravada
  // é de quando a prova foi corrigida: as pontuadas antes do conserto ainda
  // trazem a mesma dimensão nas duas colunas. Ver `separarPorFaixa`.
  const separadas = separarPorFaixa(detalhe.contribuicoes ?? []);
  const facetas = (avaliacao.facetNotes as NotaDeFaceta[]) ?? [];
  const arquetipo = avaliacao.archetypeId
    ? ARQUETIPO_POR_ID.get(avaliacao.archetypeId)
    : null;

  const roteiro = montarRoteiro({
    contribuicoes: detalhe.contribuicoes ?? [],
    sinaisDeConfianca: confianca?.sinais ?? [],
    arquetipoId: avaliacao.archetypeId,
    escores,
    perguntasDeModulo: leitura.perguntasDeModulo,
  });

  // A síntese que a página não fazia. Vem depois do roteiro porque conta as
  // perguntas dele — e só as conta, não as repete.
  const diagnostico = montarDiagnostico({
    contribuicoes: detalhe.contribuicoes ?? [],
    ficha: leitura.ficha,
    arquetipoId: avaliacao.archetypeId,
    selo: leitura.selo,
    roteiro,
  });

  // Histórico: a mesma pessoa em mais de um processo desta empresa.
  const historico = candidato.assessments.filter((a) => a.id !== avaliacao.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CabecalhoDeImpressao
        candidato={candidato.name}
        vaga={avaliacao.job.title}
        empresa={candidato.organization.name}
        respondidoEm={
          avaliacao.completedAt ? data(avaliacao.completedAt) : null
        }
        aderencia={aderencia}
        selo={
          confianca
            ? {
                nivel: confianca.selo,
                rotulo: confianca.rotulo,
                texto: confianca.texto,
              }
            : null
        }
      />

      <div data-impressao="ocultar">
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
            <BotaoSalvarPdf
              href={`/candidatos/${candidato.id}/pdf?avaliacao=${avaliacao.id}`}
            />
            {/* O selo e o número andam juntos, e é aqui que a regra do §4.4
                vira layout: sem selo o número não é exibido — fit sozinho vira
                nota de aprovação. */}
            {confianca && aderencia && (
              <>
                <SeloDeConfianca confianca={confianca} />
                <div className="text-right">
                  <p className="etiqueta">Aderência</p>
                  <p className="t-numero mt-1 text-marca">{aderencia}</p>
                </div>
              </>
            )}
          </div>
        </header>
      </div>

      {/* A síntese primeiro: quem abre esta tela está a minutos da conversa. A
          aderência, as faixas, a ficha e o radar continuam logo abaixo, na
          ordem de sempre, para quem for verificar o que a síntese afirma. */}
      <DiagnosticoDoCandidato diagnostico={diagnostico} />

      {/* O selo nunca aparece sozinho, e o número nunca aparece sem a conta. */}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <section className="rounded-xl border bg-card p-5">
            <h2 className="t-cartao">
              {aderencia
                ? `Por que a aderência é ${aderencia}`
                : "Perfil por dimensão"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {roteiro.resumoDoGap}
            </p>
            {/* De qual instrumento saíram os cinco fatores. Só aparece quando
                NÃO é o Mapeamento Baliza: dizer a origem importa porque o Big Five mede o
                mesmo terreno com 20 itens em vez de 34, e sem facetas. */}
            {leitura.origemDosFatores === "BIG_FIVE" && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Os cinco fatores desta conta vieram do Big Five (20 itens), não
                do Mapeamento Baliza — esta vaga não aplicou o instrumento completo.
              </p>
            )}

            {/* O veredito antes da prova. Cinco medidores lidos sem saber quais
                pesaram obrigam a ler tudo duas vezes: uma para entender, outra
                para achar o que importou. */}
            <div className="mt-5 grid gap-4 rounded-lg bg-secondary/50 p-4 sm:grid-cols-2">
              <div>
                <p className="etiqueta mb-2 text-dentro">Puxaram pra cima</p>
                <ul className="space-y-1 t-corpo-sm">
                  {separadas.puxaramPraCima.length ? (
                    separadas.puxaramPraCima.map((c) => (
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
                  {separadas.puxaramPraBaixo.length ? (
                    separadas.puxaramPraBaixo.map((c) => (
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

            <div className="mt-7 space-y-7 border-t pt-6">
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
          </section>

          {/* ─── Os outros testes da bateria (§5.2 do manual) ──────────── */}
          <FichaDosModulos ficha={leitura.ficha} qualidade={leitura.qualidade} />

          {/* ─── O roteiro: o produto entrega decisão, não rótulo ──────── */}
          <section className="rounded-xl border border-marca/30 bg-marca-forte/[0.03] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MessageSquareQuote className="size-4 text-marca" />
                  <h2 className="t-cartao">Roteiro de entrevista</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Perguntas comportamentais — a pessoa conta um fato que
                  aconteceu. Cada uma sonda um ponto específico deste perfil.
                </p>
              </div>

              {/* O roteiro é o que o recrutador leva PARA a entrevista, e a
                  entrevista não acontece nesta tela: sem uma saída, ele era
                  copiado pergunta por pergunta na mão. */}
              <BotaoCopiar
                texto={roteiroEmTexto(
                  candidato.name,
                  avaliacao.job.title,
                  roteiro,
                )}
                confirmacao="Roteiro copiado"
                variant="outline"
                rotuloAcessivel="Copiar o roteiro de entrevista em texto"
              >
                Copiar roteiro
              </BotaoCopiar>
            </div>
            <ol className="mt-5 space-y-4">
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
              <h2 className="mt-1.5 t-secao">
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
            <h2 className="t-cartao">Perfil comportamental</h2>
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
              <h2 className="t-cartao">Nuances</h2>
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
              <h2 className="t-cartao">Histórico nesta empresa</h2>
              <ul className="mt-3 space-y-2">
                {historico.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/candidatos/${candidato.id}?avaliacao=${a.id}`}
                      className="flex items-baseline justify-between gap-3 rounded-md px-2 py-1.5 t-corpo-sm transition-colors hover:bg-secondary"
                    >
                      <span className="truncate">{a.job.title}</span>
                      {/* "—" e não 0: a vaga daquele processo pode não medir
                          aderência, e zero se leria como resultado ruim. */}
                      <span className="leitura shrink-0 text-muted-foreground">
                        {a.fitScore == null ? "—" : numero(a.fitScore, 1)}
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

      {/* O parecer vem DEPOIS de tudo: a ordem da tela é a ordem do trabalho, e
          um seletor de "avançar / não avançar" acima do resultado convidaria a
          decidir antes de ler. */}
      <ParecerDoAnalista
        avaliacaoId={avaliacao.id}
        decisao={avaliacao.decision}
        nota={avaliacao.decisionNote}
        decididoEm={avaliacao.decidedAt ? data(avaliacao.decidedAt) : null}
        decididoPor={avaliacao.decidedBy?.name ?? null}
      />

      {/* Na tela este aviso é o rodapé; no papel ele sairia duas vezes, porque
          o rodapé impresso já o carrega junto do aviso de confidencialidade. */}
      <p
        data-impressao="ocultar"
        className="rounded-xl border border-dashed px-5 py-4 t-corpo-sm leading-relaxed text-muted-foreground"
      >
        Este resultado é um insumo para a entrevista. Ele não substitui a conversa
        com a pessoa e não deve ser o único critério de decisão.
      </p>

      <RodapeDeImpressao />
    </div>
  );
}

/**
 * O roteiro em texto puro, para colar no bloco de notas ou no ATS.
 *
 * Leva o motivo de cada pergunta junto: sem ele o entrevistador tem uma lista
 * de perguntas soltas e volta a improvisar — o motivo é o que faz a pergunta
 * valer a pena. E leva o aviso do rodapé, porque um roteiro que sai da tela sem
 * ele vira "o sistema disse que a pessoa é assim".
 */
function roteiroEmTexto(
  nome: string,
  vaga: string,
  roteiro: { perguntas: Array<{ pergunta: string; motivo: string }> },
) {
  const linhas = roteiro.perguntas.map(
    (p, i) => `${i + 1}. ${p.pergunta}\n   (por que: ${p.motivo})`,
  );

  return [
    `Roteiro de entrevista — ${nome}`,
    `Vaga: ${vaga}`,
    "",
    ...linhas,
    "",
    "Insumo para a conversa. Não substitui a entrevista e não deve ser o único critério de decisão.",
  ].join("\n");
}

/**
 * As respostas brutas dos módulos do manual — só quando há módulo que as use.
 *
 * Os alertas do §6.3 (tempo por tela, padrão uniforme, itens espelhados) moram
 * na resposta item a item, que o relatório da Baliza nunca precisou carregar. A
 * consulta é condicionada ao que a bateria tem: a página da esmagadora maioria
 * das avaliações — as só do Mapeamento Baliza — continua fazendo exatamente as mesmas
 * consultas de antes.
 */
async function respostasBrutas(avaliacao: { id: string; testBattery: string[] }) {
  const precisa =
    avaliacao.testBattery.includes("BIG_FIVE") ||
    avaliacao.testBattery.includes("DISC");

  if (!precisa) return {};

  const [itens, blocos] = await Promise.all([
    prisma.itemResponse.findMany({
      where: { assessmentId: avaliacao.id },
      select: { itemId: true, value: true, elapsedMs: true },
    }),
    prisma.scenarioResponse.findMany({
      where: { assessmentId: avaliacao.id },
      select: { blockId: true, elapsedMs: true },
    }),
  ]);

  return { itens, blocos };
}

/**
 * Respondeu, mas a bateria não mede os cinco fatores.
 *
 * A tela diz por que não há aderência — sem fingir que há e sem mostrar zero —
 * e em seguida entrega o que a bateria DE FATO produziu: perfil DISC, nota por
 * competência do SJT, alertas de qualidade e o roteiro de entrevista que sai
 * deles. Uma vaga que aplica DISC e SJT não é uma vaga sem resultado; é uma
 * vaga com outro resultado.
 */
function SemOsCincoFatores({
  candidatoId,
  candidato,
  email,
  vaga,
  avaliacaoId,
  leitura,
  respondidoEm,
}: {
  candidatoId: string;
  candidato: string;
  email: string;
  vaga: { id: string; title: string };
  avaliacaoId: string;
  leitura: LeituraDaAvaliacao;
  respondidoEm: Date | null;
}) {
  const roteiro = montarRoteiro({
    contribuicoes: [],
    sinaisDeConfianca: [],
    arquetipoId: null,
    perguntasDeModulo: leitura.perguntasDeModulo,
    semAderencia: true,
  });

  // Também aqui, e não só na tela cheia: uma vaga que aplicou DISC e SJT tem
  // resultado, e quem entrevista tem o mesmo problema de síntese. O que muda é
  // que o diagnóstico diz, na primeira linha, que não houve comparação com o
  // perfil-alvo — em vez de deixar a ausência do número falar sozinha.
  const diagnostico = montarDiagnostico({
    contribuicoes: [],
    ficha: leitura.ficha,
    arquetipoId: null,
    selo: leitura.selo,
    roteiro,
    semAderencia: true,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div data-impressao="ocultar">
        <Link
          href={`/vagas/${vaga.id}`}
          className="etiqueta inline-flex items-center gap-1.5 hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          {vaga.title}
        </Link>

        <header className="mt-3 mb-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="t-titulo">{candidato}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {email}
              {respondidoEm && ` · respondeu em ${data(respondidoEm)}`}
            </p>
          </div>
          <BotaoSalvarPdf
            href={`/candidatos/${candidatoId}/pdf?avaliacao=${avaliacaoId}`}
          />
        </header>
      </div>

      <section className="rounded-xl border bg-card p-5">
        <h2 className="t-cartao">O que esta pessoa respondeu</h2>
        <ul className="mt-3 space-y-2">
          {leitura.bateria.map((teste: Teste) => (
            <li key={teste} className="t-corpo-sm">
              {CATALOGO_DE_TESTES[teste].nome}
              <span className="etiqueta ml-2">
                {CATALOGO_DE_TESTES[teste].formato}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-5 rounded-lg border border-fora/30 bg-fora/5 px-3 py-2.5 t-legenda leading-relaxed">
          Esta vaga não aplicou o Mapeamento Baliza nem o Big Five, então não há os cinco
          fatores — e sem eles não há aderência ao perfil-alvo para calcular.
          Não é aderência zero: é aderência não medida. Para ter o número,
          marque um dos dois na vaga; vale para quem for convidado a partir dali.
        </p>
      </section>

      <DiagnosticoDoCandidato diagnostico={diagnostico} />

      <FichaDosModulos ficha={leitura.ficha} qualidade={leitura.qualidade} />

      <section className="rounded-xl border border-marca/30 bg-marca-forte/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquareQuote className="size-4 text-marca" />
              <h2 className="t-cartao">Roteiro de entrevista</h2>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {roteiro.resumoDoGap}
            </p>
          </div>
          <BotaoCopiar
            texto={roteiroEmTexto(candidato, vaga.title, roteiro)}
            confirmacao="Roteiro copiado"
            variant="outline"
            rotuloAcessivel="Copiar o roteiro de entrevista em texto"
          >
            Copiar roteiro
          </BotaoCopiar>
        </div>
        <ol className="mt-5 space-y-4">
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

      <p className="rounded-xl border border-dashed px-5 py-4 t-corpo-sm leading-relaxed text-muted-foreground">
        Este resultado é um insumo para a entrevista. Ele não substitui a
        conversa com a pessoa e não deve ser o único critério de decisão.
        Nenhum destes testes elimina candidato sozinho.
      </p>
    </div>
  );
}

/**
 * O candidato que ainda não respondeu.
 *
 * Não é uma tela de erro: é o mesmo endereço de sempre, contando em que passo a
 * pessoa está e oferecendo o que resolve — o acesso de novo. Sem isso, o RH que
 * chegasse aqui via histórico ou link salvo via só "página não encontrada".
 */
async function AguardandoResposta({
  candidatoId,
  organizationId,
}: {
  candidatoId: string;
  organizationId: string;
}) {
  const [candidato, baseDoSite] = await Promise.all([
    prisma.candidate.findFirst({
      where: { id: candidatoId, organizationId },
      select: {
        name: true,
        email: true,
        assessments: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            createdAt: true,
            job: { select: { id: true, title: true } },
            invitation: { select: { accessCode: true } },
          },
        },
      },
    }),
    urlBase(),
  ]);

  if (!candidato) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/candidatos"
        className="etiqueta inline-flex items-center gap-1.5 hover:text-foreground"
      >
        <ArrowLeft className="size-3" />
        Candidatos
      </Link>

      <header className="mt-3 mb-6">
        <h1 className="t-titulo">{candidato.name}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{candidato.email}</p>
      </header>

      {candidato.assessments.length === 0 ? (
        <EstadoVazio
          icone={Hourglass}
          titulo="Nenhum mapeamento nesta pessoa"
          descricao="Ela está na sua base, mas não foi convidada para nenhuma vaga ainda. O acesso é gerado na página da vaga, em “Cadastrar candidato”."
          acao={<BotaoLink href="/vagas">Ver as vagas</BotaoLink>}
        />
      ) : (
        <div className="space-y-3">
          <EstadoVazio
            compacto
            icone={Hourglass}
            titulo="Ainda não respondeu"
            descricao="O resultado, o roteiro de entrevista e a aderência aparecem aqui assim que a pessoa terminar — leva cerca de 6 minutos do lado dela."
          />

          <ul className="divide-y rounded-xl border bg-card">
            {candidato.assessments.map((avaliacao) => (
              <li
                key={avaliacao.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"
              >
                <div className="min-w-0">
                  <Link
                    href={`/vagas/${avaliacao.job.id}`}
                    className="truncate text-sm font-medium hover:text-marca"
                  >
                    {avaliacao.job.title}
                  </Link>
                  <p className="t-legenda text-muted-foreground">
                    {ROTULO_DE_STATUS_DE_AVALIACAO[avaliacao.status]} · acesso
                    criado {haQuantoTempo(avaliacao.createdAt)}
                  </p>
                </div>

                {avaliacao.invitation?.accessCode && (
                  <CodigoDeAcesso
                    variante="linha"
                    codigo={avaliacao.invitation.accessCode}
                    baseDoSite={baseDoSite}
                    de={candidato.name}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
