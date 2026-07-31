import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BarrasPorFator, RadarComportamental } from "@/components/app/graficos";
import { Marca } from "@/components/marca";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { faixaQualitativa } from "@/lib/instrument/scoring";
import { FATORES, NOMES_DE_FATOR, type Fator } from "@/lib/instrument/types";
import { duracao } from "@/lib/formato";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Seu resultado",
  robots: { index: false, follow: false },
};

type NotaDeFaceta = { fator: Fator; tendencia: string; texto: string };

/**
 * Relatório do candidato.
 *
 * Regra de ética §7.3: a pessoa recebe o próprio resultado, integral, sem
 * depender de a empresa liberar. Este link é dela.
 *
 * O que NÃO aparece aqui, de propósito: a aderência à vaga e a posição no
 * ranking. Esses números só existem em relação a uma vaga específica e a uma
 * decisão que é da empresa — mostrá-los ao candidato transformaria um retorno
 * útil em uma nota de aprovação, que é exatamente o que o produto se recusa a
 * emitir.
 */
export default async function PaginaDoResultado({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const avaliacao = await prisma.assessment.findUnique({
    where: { resultToken: token },
    include: {
      candidate: { select: { name: true } },
      job: { select: { title: true } },
      organization: { select: { name: true, retentionMonths: true } },
    },
  });

  if (!avaliacao || avaliacao.status !== "COMPLETED") notFound();

  const escores = avaliacao.scores as Record<Fator, number>;
  const facetas = (avaliacao.facetNotes as NotaDeFaceta[]) ?? [];
  const arquetipo = avaliacao.archetypeId
    ? ARQUETIPO_POR_ID.get(avaliacao.archetypeId)
    : null;
  const segundo = avaliacao.archetypeMixedWith
    ? ARQUETIPO_POR_ID.get(avaliacao.archetypeMixedWith)
    : null;

  const ordenados = [...FATORES].sort((a, b) => escores[b] - escores[a]);
  const maisAlto = ordenados[0];
  const maisBaixo = ordenados[ordenados.length - 1];

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <header className="flex items-center justify-between">
        <Marca href={null} />
        <span className="etiqueta">Seu resultado</span>
      </header>

      <section className="mt-10">
        <p className="etiqueta">Obrigado por responder</p>
        <h1 className="mt-3 t-titulo">
          Pronto, {avaliacao.candidate.name.split(" ")[0]}. Suas respostas foram
          enviadas.
        </h1>
        <p className="mt-3 t-corpo leading-relaxed text-muted-foreground">
          A {avaliacao.organization.name} recebeu seu mapeamento para a vaga de{" "}
          {avaliacao.job.title}. Abaixo está a sua leitura — ela é sua, e este
          link continua funcionando.
        </p>
        {avaliacao.durationMs && (
          <p className="etiqueta mt-4">
            Concluído em {duracao(avaliacao.durationMs)}
          </p>
        )}
      </section>

      {arquetipo && (
        <section className="mt-10 rounded-xl border bg-card p-6">
          <p className="etiqueta">
            {segundo ? "Perfil misto" : "Seu perfil predominante"}
          </p>
          <h2 className="mt-2 t-secao font-semibold tracking-tight">
            {arquetipo.nome}
            {segundo && ` / ${segundo.nome}`}
          </h2>
          <p className="mt-1.5 t-corpo text-marca">{arquetipo.essencia}</p>

          <div className="mt-5 space-y-4 t-corpo leading-relaxed">
            <div>
              <p className="etiqueta mb-1">Onde você costuma brilhar</p>
              <p className="text-muted-foreground">{arquetipo.brilhaEm}</p>
            </div>
            <div>
              <p className="etiqueta mb-1">Onde costuma travar</p>
              <p className="text-muted-foreground">{arquetipo.travaEm}</p>
            </div>
            <div>
              <p className="etiqueta mb-1">O que ajuda você a render</p>
              <p className="text-muted-foreground">
                {arquetipo.oGestorPrecisaDar}
              </p>
            </div>
          </div>

          {segundo && (
            <p className="mt-5 border-t pt-4 t-corpo-sm leading-relaxed text-muted-foreground">
              Seu perfil ficou entre dois arquétipos, quase à mesma distância dos
              dois. Isso não é indefinição — é a leitura mais honesta que os seus
              escores permitem.
            </p>
          )}
        </section>
      )}

      <section className="mt-6 rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold">Suas cinco dimensões</h2>
        <p className="mt-1 t-corpo-sm text-muted-foreground">
          Nenhuma pontuação aqui é boa ou ruim por si só. Cada trabalho pede uma
          combinação diferente.
        </p>

        <div className="mt-4">
          <RadarComportamental escores={escores} altura={280} rotuloA="Você" />
        </div>

        <div className="mt-2">
          <BarrasPorFator escores={escores} altura={190} />
        </div>

        <ul className="mt-5 space-y-2.5 border-t pt-5">
          {FATORES.map((f) => {
            const faixa = faixaQualitativa(escores[f]);
            return (
              <li key={f} className="flex items-baseline justify-between gap-4">
                <span className="t-corpo">{NOMES_DE_FATOR[f].ui}</span>
                <span className="etiqueta shrink-0">{faixa.rotulo}</span>
              </li>
            );
          })}
        </ul>

        <p className="mt-5 rounded-lg bg-secondary px-3.5 py-3 t-legenda leading-relaxed text-muted-foreground">
          Mostramos faixa qualitativa, e não percentil, porque a comparação com
          outras pessoas só passa a ser confiável a partir de algumas centenas de
          respostas acumuladas. Preferimos dizer menos do que dizer errado.
        </p>
      </section>

      <section className="mt-6 rounded-xl border bg-card p-6">
        <h2 className="text-sm font-semibold">O que mais se destaca em você</h2>

        <div className="mt-4 space-y-4 t-corpo leading-relaxed">
          <p>
            Seu ponto mais forte é{" "}
            <strong className="font-medium">{NOMES_DE_FATOR[maisAlto].ui}</strong>
            {" "}({faixaQualitativa(escores[maisAlto]).rotulo.toLowerCase()}), e o
            mais discreto é{" "}
            <strong className="font-medium">{NOMES_DE_FATOR[maisBaixo].ui}</strong>
            {" "}({faixaQualitativa(escores[maisBaixo]).rotulo.toLowerCase()}).
          </p>

          {facetas.length > 0 && (
            <ul className="space-y-1.5 text-muted-foreground">
              {facetas.slice(0, 4).map((n, i) => (
                <li key={i}>· {n.texto}</li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <footer className="mt-10 space-y-3 border-t pt-6 t-legenda leading-relaxed text-muted-foreground">
        <p>
          Este é um questionário de autopercepção de comportamento no trabalho.
          Não é teste psicológico, avaliação psicológica, laudo nem diagnóstico, e
          não mede capacidade técnica nem inteligência.
        </p>
        <p>
          Suas respostas ficam guardadas por até{" "}
          {avaliacao.organization.retentionMonths} meses e depois são apagadas.
          Para pedir a exclusão antes disso, responda ao e-mail do convite ou
          fale com a {avaliacao.organization.name}.
        </p>
      </footer>
    </div>
  );
}
