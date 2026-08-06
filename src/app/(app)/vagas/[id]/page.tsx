import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Inbox } from "lucide-react";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { CodigoDeAcesso } from "@/components/app/codigo-de-acesso";
import { CompartilharVaga } from "@/components/app/compartilhar-vaga";
import { EditarBateria } from "@/components/app/editar-bateria";
import { EditarPerfilAlvo } from "@/components/app/editar-perfil-alvo";
import { EstadoVazio } from "@/components/app/estado-vazio";
import {
  LinhaDeCandidato,
  type MedidorMinimo,
} from "@/components/app/linha-de-candidato";
import type { Confianca } from "@/components/app/selo-de-confianca";
import { Faixa, type DadosDaFaixa } from "@/components/faixa";
import { Badge } from "@/components/ui/badge";
import { Painel, PainelCabecalho, PainelLista } from "@/components/ui/painel";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import {
  CATALOGO_DE_TESTES,
  lerBateria,
  produzFatores,
  rotuloDeTempo,
  telasDaBateria,
} from "@/lib/instrument/baterias";
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
} from "@/lib/formato";
import { cn } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import { gerarQr } from "@/lib/qr";
import { exigirTenant, podeAoMenos } from "@/lib/tenant";
import { urlBase, urlDaVaga } from "@/lib/url-publica";

export const metadata: Metadata = { title: "Vaga" };

export default async function PaginaDaVaga({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { organizationId, role } = await exigirTenant();

  // Quem só lê não pode cadastrar candidato nem mexer no perfil-alvo: as duas
  // ações exigem RECRUITER e, do outro lado, `exigirPapel` responde com um
  // redirecionamento para o painel. Oferecer o botão e depois expulsar a pessoa
  // é pior que não oferecer.
  const podeEditar = podeAoMenos(role, "RECRUITER");

  // O escopo por empresa vai no WHERE, não numa checagem depois da leitura:
  // trocar o id na URL simplesmente não encontra nada.
  const vaga = await prisma.job.findFirst({
    where: { id, organizationId },
    include: {
      assessments: {
        where: { status: "COMPLETED" },
        // `nulls: "last"` não é detalhe: em Postgres, DESC põe NULL PRIMEIRO.
        // Sem isso, quem respondeu uma bateria que não mede aderência (só DISC
        // e SJT, por exemplo) subiria ao topo do ranking justamente por não ter
        // nota. Sem nota, o desempate é por quem respondeu antes.
        orderBy: [
          { fitScore: { sort: "desc", nulls: "last" } },
          { completedAt: "asc" },
        ],
        include: { candidate: { select: { id: true, name: true } } },
      },
    },
  });

  if (!vaga) notFound();

  const perfil = vaga.targetProfile as unknown as PerfilAlvo;
  const bateria = lerBateria(vaga.testBattery);
  const temAderencia = produzFatores(bateria);
  // Base derivada do host da requisição: quem abre o painel por IP de rede
  // recebe um link com esse endereço, e não `localhost` — que só abriria na
  // máquina de quem copiou. Ver src/lib/url-publica.ts.
  const url = await urlDaVaga(vaga.publicToken);
  const baseDoSite = await urlBase();

  const [qr, pendentes] = await Promise.all([
    gerarQr(url),
    prisma.assessment.count({
      where: { jobId: vaga.id, status: { in: ["PENDING", "IN_PROGRESS"] } },
    }),
  ]);

  // Quem já tem acesso mas ainda não terminou. O código precisa continuar
  // visível DEPOIS que o diálogo de cadastro fecha: senão ele vira uso único e
  // o RH não consegue repetir para quem perdeu.
  const convidados = await prisma.invitation.findMany({
    where: {
      jobId: vaga.id,
      assessment: { status: { in: ["PENDING", "IN_PROGRESS"] } },
    },
    select: {
      id: true,
      accessCode: true,
      candidate: { select: { name: true } },
      assessment: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <CabecalhoDePagina
        voltar={{ href: "/vagas", rotulo: "Vagas" }}
        titulo={vaga.title}
        descricao={[
          vaga.department,
          ROTULO_DE_SENIORIDADE[vaga.seniority],
          ROTULO_DE_MODELO[vaga.workModel],
          vaga.location,
        ]
          .filter(Boolean)
          .join(" · ")}
        acoes={
          <Badge className="border">
            {ROTULO_DE_STATUS_DE_VAGA[vaga.status]}
          </Badge>
        }
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Painel padding="nenhum">
          <PainelCabecalho
            comBorda
            titulo={
              <>
                {temAderencia ? "Ranking por aderência" : "Quem respondeu"}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {vaga.assessments.length}{" "}
                  {vaga.assessments.length === 1 ? "resposta" : "respostas"}
                  {pendentes > 0 && ` · ${pendentes} aguardando`}
                </span>
              </>
            }
            descricao={
              temAderencia
                ? "A ordem é sugestão de prioridade de conversa. Nenhum candidato é descartado automaticamente."
                : "Esta vaga não aplica Prumo nem Big Five, então não há aderência a calcular: a lista é por ordem de resposta, e o resultado de cada pessoa está na ficha dela."
            }
          />

          {/* A legenda das colunas.
              Sem ela o ranking mostra cinco medidores rotulados C, E, X, A e O —
              e é justamente lado a lado, na mesma coluna, que dá para comparar
              duas pessoas. Coluna que não se lê não compara nada. */}
          {vaga.assessments.length > 0 && temAderencia && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-superficie-2/40 px-5 py-2">
              {FATORES.map((f) => {
                const cfg = perfil[f];
                const naoPesa = !cfg || cfg.peso === 0;
                return (
                  <span
                    key={f}
                    className={cn(
                      "t-legenda text-muted-foreground",
                      naoPesa && "opacity-50",
                    )}
                  >
                    <span className="leitura font-semibold">{f}</span>{" "}
                    {NOMES_DE_FATOR[f].curto}
                    {naoPesa && " (não pesa)"}
                  </span>
                );
              })}
              {/* Descrito por forma e posição, não por cor: quem não distingue
                  argila de latão continua conseguindo ler o medidor. */}
              <span className="t-legenda ml-auto text-muted-foreground">
                o trecho marcado é o que a vaga pede; o losango é o candidato
              </span>
            </div>
          )}

          {vaga.assessments.length === 0 ? (
            <div className="p-5">
              <EstadoVazio
                compacto
                icone={Inbox}
                titulo="Nenhuma resposta ainda"
                descricao="Cadastre um candidato ou compartilhe o link, ao lado. Assim que alguém responder, o ranking aparece aqui."
              />
            </div>
          ) : (
            <PainelLista>
              {vaga.assessments.map((avaliacao, indice) => {
                // `scores` é nulo quando a bateria daquela prova não mede os
                // cinco fatores. Sem eles não há medidor a desenhar nem
                // aderência a explicar — a linha mostra "—" e segue listando a
                // pessoa, que é o que o RH precisa: ela respondeu.
                const escores = avaliacao.scores as Record<Fator, number> | null;
                const detalhe = avaliacao.fitDetail as {
                  puxaramPraBaixo?: Array<{ fator: Fator; dentro: boolean }>;
                } | null;
                const derrubou = detalhe?.puxaramPraBaixo?.[0];

                const medidores: MedidorMinimo[] | undefined = escores
                  ? FATORES.map((f) => {
                      const cfg = perfil[f];
                      const irrelevante = !cfg || cfg.peso === 0;
                      return {
                        fator: f,
                        nome: NOMES_DE_FATOR[f].ui,
                        escore: escores[f],
                        faixa: cfg?.faixa ?? [0, 100],
                        dentro:
                          !irrelevante &&
                          escores[f] >= cfg.faixa[0] &&
                          escores[f] <= cfg.faixa[1],
                        irrelevante,
                      };
                    })
                  : undefined;

                return (
                  <LinhaDeCandidato
                    key={avaliacao.id}
                    href={`/candidatos/${avaliacao.candidate.id}?avaliacao=${avaliacao.id}`}
                    posicao={indice + 1}
                    nome={avaliacao.candidate.name}
                    detalhe={[
                      avaliacao.archetypeId
                        ? ARQUETIPO_POR_ID.get(avaliacao.archetypeId)?.nome
                        : null,
                      avaliacao.durationMs
                        ? `respondeu em ${duracao(avaliacao.durationMs)}`
                        : null,
                      avaliacao.completedAt
                        ? haQuantoTempo(avaliacao.completedAt)
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                    escore={avaliacao.fitScore}
                    confianca={avaliacao.confidence as unknown as Confianca}
                    medidores={medidores}
                    alerta={
                      derrubou && !derrubou.dentro
                        ? `Puxa pra baixo: ${NOMES_DE_FATOR[derrubou.fator].ui}`
                        : undefined
                    }
                  />
                );
              })}
            </PainelLista>
          )}
        </Painel>

        <div className="space-y-4">
          <Painel>
            <PainelCabecalho
              titulo="Acesso dos candidatos"
              descricao={
                vaga.publicEnabled
                  ? "Link aberto para quem quiser responder, e cadastro individual quando você quiser controlar quem entra."
                  : "Cadastre a pessoa e escolha como entregar o acesso: link, QR Code ou código de 4 dígitos."
              }
            />
            <div className="mt-4">
              <CompartilharVaga
                url={url}
                qrDataUrl={qr}
                titulo={vaga.title}
                jobId={vaga.id}
                aberta={vaga.publicEnabled}
                baseDoSite={baseDoSite}
                podeCadastrar={podeEditar}
              />
            </div>
          </Painel>

          {convidados.length > 0 && (
            <Painel padding="nenhum">
              <PainelCabecalho
                comBorda
                titulo="Aguardando resposta"
                descricao={
                  convidados.length === 20
                    ? "Os 20 acessos mais recentes que ainda não viraram resposta."
                    : "Quem já tem acesso e ainda não terminou."
                }
              />
              <PainelLista>
                {convidados.map((convidado) => (
                  <li
                    key={convidado.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">
                        {convidado.candidate?.name ?? "Candidato"}
                      </p>
                      <p className="t-legenda text-muted-foreground">
                        {convidado.assessment?.status === "IN_PROGRESS"
                          ? "respondendo agora"
                          : "ainda não começou"}
                      </p>
                    </div>
                    {convidado.accessCode && (
                      <CodigoDeAcesso
                        variante="linha"
                        codigo={convidado.accessCode}
                        baseDoSite={baseDoSite}
                        de={convidado.candidate?.name ?? undefined}
                      />
                    )}
                  </li>
                ))}
              </PainelLista>
            </Painel>
          )}

          <Painel>
            <PainelCabecalho
              titulo="Testes desta vaga"
              descricao={`${telasDaBateria(bateria)} telas, ${rotuloDeTempo(bateria)} para o candidato.`}
              acao={
                podeEditar && (
                  <EditarBateria
                    jobId={vaga.id}
                    bateria={bateria}
                    aguardandoResposta={pendentes}
                  />
                )
              }
            />

            <ol className="mt-4 space-y-2">
              {bateria.map((teste, i) => {
                const ficha = CATALOGO_DE_TESTES[teste];
                return (
                  <li key={teste} className="flex items-start gap-2.5">
                    {/* A posição não é enfeite: é a ordem em que o candidato
                        atravessa as etapas. */}
                    <span className="leitura mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-secondary t-legenda font-semibold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block t-corpo-sm font-medium">
                        {ficha.nome}
                      </span>
                      <span className="etiqueta">
                        {ficha.formato} · {ficha.telas} telas
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>

            {!temAderencia && (
              <p className="mt-4 rounded-lg border border-fora/30 bg-fora/5 px-3 py-2.5 t-legenda leading-relaxed">
                Nenhum destes testes mede os cinco fatores, então o perfil-alvo
                abaixo fica sem uso e as respostas vêm sem aderência. Marque o
                Prumo ou o Big Five para ligar o ranking de volta.
              </p>
            )}
          </Painel>

          <Painel>
            <PainelCabecalho
              titulo="Perfil-alvo"
              descricao={
                temAderencia
                  ? "As faixas que esta vaga pede. É contra elas que a aderência é calculada."
                  : "As faixas que esta vaga pede — sem efeito enquanto a bateria não tiver Prumo ou Big Five."
              }
              acao={
                podeEditar && (
                  <EditarPerfilAlvo
                    jobId={vaga.id}
                    perfil={perfil}
                    respostasConcluidas={vaga.assessments.length}
                  />
                )
              }
            />

            <div className="mt-5 space-y-5">
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
          </Painel>
        </div>
      </div>
    </div>
  );
}
