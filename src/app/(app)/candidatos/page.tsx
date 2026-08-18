import type { Metadata } from "next";
import Link from "next/link";
import { Search, Users } from "lucide-react";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { EstadoVazio } from "@/components/app/estado-vazio";
import { LinhaDeCandidato } from "@/components/app/linha-de-candidato";
import type { Confianca } from "@/components/app/selo-de-confianca";
import { BotaoLink } from "@/components/ui/botao-link";
import { Painel, PainelLista } from "@/components/ui/painel";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { ROTULO_DA_DECISAO, data, numero } from "@/lib/formato";
import type { AnalystDecision } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { exigirPermissao } from "@/lib/tenant";

export const metadata: Metadata = { title: "Candidatos" };

/**
 * Vinte e cinco por página.
 *
 * A lista tinha um teto de 100 e nada além disso: quem passasse de cem
 * respostas simplesmente não alcançava a centésima primeira — sem busca, sem
 * página seguinte, sem nada. O texto era honesto ("as 100 mais recentes"), o
 * que só deixava explícito que o resto era inacessível pela interface.
 *
 * 25 e não 100 porque com paginação de verdade a página menor é mais rápida e
 * a navegação existe; o teto grande só fazia sentido enquanto ele ERA a lista
 * inteira.
 */
const POR_PAGINA = 25;

/** Os filtros de parecer, na ordem em que o trabalho acontece. */
const FILTROS = [
  { chave: "", rotulo: "Todos" },
  { chave: "sem", rotulo: "Sem parecer" },
  { chave: "ADVANCE", rotulo: "Avançar" },
  { chave: "DOUBT", rotulo: "Dúvida" },
  { chave: "REJECT", rotulo: "Não avançar" },
] as const;

export default async function PaginaDeCandidatos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; parecer?: string; p?: string }>;
}) {
  const { organizationId } = await exigirPermissao("candidato:ler");
  const { q, parecer, p } = await searchParams;

  const busca = (q ?? "").trim();
  const pagina = Math.max(1, Number(p) || 1);

  /**
   * O filtro de parecer, traduzido para o banco.
   *
   * "sem" é `null`, e não a ausência de filtro: são coisas diferentes e a
   * diferença é o ponto da tela. "Sem parecer" é a pilha de trabalho que
   * sobra — o que já tem resultado e ainda espera alguém decidir.
   */
  const filtroDeParecer: { decision?: AnalystDecision | null } =
    parecer === "sem"
      ? { decision: null }
      : parecer === "ADVANCE" || parecer === "DOUBT" || parecer === "REJECT"
        ? { decision: parecer as AnalystDecision }
        : {};

  const onde = {
    organizationId,
    status: "COMPLETED" as const,
    ...filtroDeParecer,
    // A busca cobre nome E e-mail porque quem procura tem um dos dois na mão —
    // e frequentemente é o e-mail, que é o que chega encaminhado.
    ...(busca
      ? {
          candidate: {
            OR: [
              { name: { contains: busca, mode: "insensitive" as const } },
              { email: { contains: busca, mode: "insensitive" as const } },
            ],
          },
        }
      : {}),
  };

  // A contagem vem ANTES da busca, e não em paralelo com ela.
  //
  // Em paralelo era mais rápido e estava errado: `?p=2` numa base de 16
  // respostas exibia "16 respostas concluídas" no cabeçalho e, logo abaixo,
  // "Nenhum candidato respondeu ainda" — as duas frases na mesma tela, uma
  // desmentindo a outra. Não é hipótese: basta alguém guardar o link da página
  // 3 e a base encolher depois, ou trocar de filtro estando na página 2.
  //
  // Sabendo o total primeiro dá para prender a página ao intervalo que existe.
  // O pior caso passa a ser cair na última página, nunca numa tela vazia que
  // contradiz o próprio cabeçalho.
  const total = await prisma.assessment.count({ where: onde });
  const totalDePaginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalDePaginas);

  const avaliacoes = await prisma.assessment.findMany({
    where: onde,
    orderBy: { completedAt: "desc" },
    skip: (paginaAtual - 1) * POR_PAGINA,
    take: POR_PAGINA,
    include: {
      candidate: { select: { id: true, name: true } },
      job: { select: { title: true } },
    },
  });
  const temFiltro = Boolean(busca) || Boolean(parecer);

  /** Preserva os outros parâmetros ao mexer em um deles. */
  const comParametros = (mudanca: Record<string, string | undefined>) => {
    const url = new URLSearchParams();
    const final = { q: busca || undefined, parecer, p: undefined, ...mudanca };
    for (const [chave, valor] of Object.entries(final))
      if (valor) url.set(chave, valor);
    const texto = url.toString();
    return texto ? `/candidatos?${texto}` : "/candidatos";
  };

  return (
    <div>
      <CabecalhoDePagina
        etiqueta="Base"
        titulo="Candidatos"
        descricao={
          total === 0 && !temFiltro
            ? undefined
            : // O número à direita de cada linha aparece sem rótulo nesta tela —
              // dizer o que ele é aqui custa uma frase e evita que a lista seja
              // lida como "nota do candidato".
              `${numero(total)} ${total === 1 ? "resposta concluída" : "respostas concluídas"}${temFiltro ? " neste filtro" : ""}, da mais recente para a mais antiga. O número à direita é a aderência daquela resposta à vaga em que ela foi dada.`
        }
      />

      {/* Busca e filtro: um `form` GET comum, sem JavaScript. A tela funciona
          com o script ainda carregando, e o estado do filtro fica na URL — que
          é o que torna "me manda o link dos que estão em dúvida" possível. */}
      <form method="get" className="mt-5 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            name="q"
            defaultValue={busca}
            placeholder="Buscar por nome ou e-mail"
            aria-label="Buscar por nome ou e-mail"
            className="reset-base h-9 w-full rounded-lg border border-input bg-transparent py-2 pl-9 pr-3 text-sm"
          />
        </div>
        {/* O filtro atual viaja junto na busca, senão pesquisar dentro de
            "Sem parecer" jogaria a pessoa de volta para a lista inteira. */}
        {parecer && <input type="hidden" name="parecer" value={parecer} />}
        <button
          type="submit"
          className="h-9 rounded-lg border border-input px-3 text-sm transition-colors hover:bg-secondary"
        >
          Buscar
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTROS.map((f) => {
          const ativo = (parecer ?? "") === f.chave;
          return (
            <Link
              key={f.chave || "todos"}
              href={comParametros({ parecer: f.chave || undefined })}
              aria-current={ativo ? "page" : undefined}
              className={`rounded-full border px-3 py-1 t-legenda transition-colors ${
                ativo
                  ? "border-foreground/20 bg-secondary text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-secondary"
              }`}
            >
              {f.rotulo}
            </Link>
          );
        })}
      </div>

      <div className="mt-4">
        {avaliacoes.length === 0 ? (
          temFiltro ? (
            <EstadoVazio
              icone={Search}
              titulo="Nada com esse filtro"
              descricao="Ninguém nesta empresa se encaixa na busca ou no filtro escolhido."
              acao={<BotaoLink href="/candidatos">Limpar filtros</BotaoLink>}
            />
          ) : (
            <EstadoVazio
              icone={Users}
              titulo="Nenhum candidato respondeu ainda"
              descricao="Quem responder pelo link de qualquer vaga aparece aqui, com a leitura completa do perfil."
              acao={<BotaoLink href="/vagas">Ver as vagas</BotaoLink>}
            />
          )
        ) : (
          <>
            <Painel padding="nenhum">
              <PainelLista>
                {avaliacoes.map((avaliacao) => (
                  <LinhaDeCandidato
                    key={avaliacao.id}
                    href={`/candidatos/${avaliacao.candidate.id}?avaliacao=${avaliacao.id}`}
                    comIniciais
                    nome={avaliacao.candidate.name}
                    detalhe={
                      <span className="flex flex-wrap items-center gap-x-1.5">
                        <span>
                          {[
                            avaliacao.job.title,
                            avaliacao.archetypeId
                              ? ARQUETIPO_POR_ID.get(avaliacao.archetypeId)?.nome
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                        {/* O parecer é a única coisa nesta linha que diz o que
                            JÁ FOI FEITO; o resto descreve o resultado. Por isso
                            vem destacado, e não como mais um item da lista de
                            atributos separada por ponto. */}
                        {avaliacao.decision && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 t-legenda ${
                              avaliacao.decision === "ADVANCE"
                                ? "bg-dentro/10 text-dentro"
                                : avaliacao.decision === "REJECT"
                                  ? "bg-fora/10 text-fora"
                                  : "bg-marca/10 text-marca"
                            }`}
                          >
                            {ROTULO_DA_DECISAO[avaliacao.decision]}
                          </span>
                        )}
                      </span>
                    }
                    meta={data(avaliacao.completedAt)}
                    escore={avaliacao.fitScore}
                    confianca={avaliacao.confidence as unknown as Confianca}
                  />
                ))}
              </PainelLista>
            </Painel>

            {totalDePaginas > 1 && (
              <nav
                className="mt-4 flex items-center justify-between gap-3"
                aria-label="Paginação"
              >
                <p className="t-legenda text-muted-foreground">
                  Página {numero(paginaAtual)} de {numero(totalDePaginas)}
                </p>
                <div className="flex gap-2">
                  {/* Só existe o botão que leva a algum lugar. Botão desabilitado
                      ocupa espaço para dizer "não dá" — a ausência já diz. */}
                  {paginaAtual > 1 && (
                    <BotaoLink
                      variant="outline"
                      href={comParametros({
                        p: paginaAtual - 1 > 1 ? String(paginaAtual - 1) : undefined,
                      })}
                    >
                      Anterior
                    </BotaoLink>
                  )}
                  {paginaAtual < totalDePaginas && (
                    <BotaoLink
                      variant="outline"
                      href={comParametros({ p: String(paginaAtual + 1) })}
                    >
                      Próxima
                    </BotaoLink>
                  )}
                </div>
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
