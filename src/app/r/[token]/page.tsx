import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RadarComportamental } from "@/components/app/graficos";
import { Marca } from "@/components/marca";
import { BotaoSalvarResultado } from "@/components/teste/botao-salvar-resultado";
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
 * O que cada dimensão quer dizer, em português de quem não estudou psicometria.
 *
 * Fica aqui, e não em `lib/instrument`, porque é texto de tela do candidato e
 * não parte do instrumento: o nome técnico do fator não muda, a forma de contar
 * pode mudar sempre que ficar mais clara.
 *
 * A redação é toda descritiva — "o quanto você tende a", nunca "você é". A
 * diferença não é estilo: descrever comportamento é o que o produto mede;
 * afirmar traço de personalidade é o que a Resolução CFP nº 31/2022 reserva a
 * quem tem formação para isso.
 */
const O_QUE_A_DIMENSAO_OLHA: Record<Fator, string> = {
  C: "O quanto você tende a planejar antes, manter as coisas em ordem e levar o combinado até o fim sem precisar de cobrança.",
  E: "Como você costuma reagir quando o prazo aperta, quando vem uma crítica ou quando o plano muda de repente.",
  X: "O quanto você busca as pessoas, fala em grupo e toma a frente da conversa — em vez de trabalhar mais no seu canto.",
  A: "O quanto você tende a ceder, evitar o atrito e priorizar o acordo, em vez de bater o pé pelo que acha certo.",
  O: "O quanto você procura o que ainda não conhece e prefere mudar o jeito de fazer, em vez de repetir o que já funciona.",
};

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
    <div className="mx-auto max-w-2xl px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <header className="flex items-center justify-between gap-3">
        <Marca href={null} />
        <div className="flex items-center gap-3">
          <span className="etiqueta">Seu resultado</span>
          <BotaoSalvarResultado />
        </div>
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
        <section className="mt-10 rounded-xl border bg-card p-6 print:break-inside-avoid">
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

      <section className="mt-6 rounded-xl border bg-card p-6 print:break-inside-avoid">
        <h2 className="text-sm font-semibold">Suas cinco dimensões</h2>
        <p className="mt-1 t-corpo-sm text-muted-foreground">
          Nenhuma pontuação aqui é boa ou ruim por si só. Cada trabalho pede uma
          combinação diferente.
        </p>

        {/* O gráfico é a FORMA do perfil — bonito de ver, impossível de ler em
            leitor de tela. A lista abaixo diz a mesma coisa em palavras, e é
            ela que carrega a informação; o desenho fica como ilustração.
            (O gráfico de barras que existia aqui saiu: eixo "C E X A O" não
            significa nada para quem responde, o número exato só apareceria
            passando o mouse — que no celular não existe — e a página inteira se
            recusa a apresentar escore bruto como se fosse nota.) */}
        <div className="mt-4" aria-hidden>
          <RadarComportamental escores={escores} altura={280} rotuloA="Você" />
        </div>

        <ul className="mt-5 space-y-4 border-t pt-5">
          {FATORES.map((f) => {
            const faixa = faixaQualitativa(escores[f]);
            return (
              <li key={f}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="t-corpo font-medium">
                    {NOMES_DE_FATOR[f].ui}
                  </span>
                  <span className="etiqueta shrink-0">{faixa.rotulo}</span>
                </div>
                <p className="mt-1 t-corpo-sm leading-relaxed text-muted-foreground">
                  {O_QUE_A_DIMENSAO_OLHA[f]}
                </p>
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

      <section className="mt-6 rounded-xl border bg-card p-6 print:break-inside-avoid">
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

      {/* A pergunta que a pessoa faz depois de responder é sempre a mesma — "e
          agora?" —, e não respondê-la é o que transforma o retorno num susto.
          A regra §2 (ordena, nunca elimina) precisa estar escrita para quem é
          ordenado, não só para quem ordena. */}
      <section className="mt-6 rounded-xl border border-dashed p-6 print:break-inside-avoid">
        <h2 className="text-sm font-semibold">E agora, o que acontece</h2>
        <ul className="mt-4 space-y-3 t-corpo leading-relaxed text-muted-foreground">
          <li>
            A {avaliacao.organization.name} lê este mapeamento junto com o das
            outras pessoas e usa como insumo da conversa. Ele{" "}
            <strong className="font-medium text-foreground">
              organiza a ordem das entrevistas
            </strong>
            , não define sozinho quem segue: aqui não existe nota de corte.
          </li>
          <li>
            Se a empresa quiser conversar sobre algum ponto, a entrevista é o
            lugar. Nada do que está aqui é conclusão fechada sobre você.
          </li>
          <li>
            <strong className="font-medium text-foreground">
              Guarde este link.
            </strong>{" "}
            Ele é seu, não expira com o processo e mostra sempre esta página.
          </li>
        </ul>
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
        <p>
          Você também pode pedir que uma pessoa revise qualquer decisão tomada
          com base neste mapeamento, e pedir a explicação dos critérios usados
          (Lei nº 13.709/2018, art. 20).
        </p>
      </footer>
    </div>
  );
}
