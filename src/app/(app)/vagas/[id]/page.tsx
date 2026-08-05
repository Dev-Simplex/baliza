import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { Inbox } from "lucide-react";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { CompartilharVaga } from "@/components/app/compartilhar-vaga";
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
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";
import { urlBase, urlDaVaga } from "@/lib/url-publica";

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
        include: { candidate: { select: { id: true, name: true } } },
      },
    },
  });

  if (!vaga) notFound();

  const perfil = vaga.targetProfile as unknown as PerfilAlvo;
  // Base derivada do host da requisição: quem abre o painel por IP de rede
  // recebe um link com esse endereço, e não `localhost` — que só abriria na
  // máquina de quem copiou. Ver src/lib/url-publica.ts.
  const url = await urlDaVaga(vaga.publicToken);
  const baseDoSite = await urlBase();

  const [qr, pendentes] = await Promise.all([
    QRCode.toDataURL(url, {
      width: 440,
      margin: 1,
      color: { dark: "#0b0e14", light: "#ffffff" },
    }),
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
                Ranking por aderência
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  {vaga.assessments.length}{" "}
                  {vaga.assessments.length === 1 ? "resposta" : "respostas"}
                  {pendentes > 0 && ` · ${pendentes} aguardando`}
                </span>
              </>
            }
            descricao="A ordem é sugestão de prioridade de conversa. Nenhum candidato é descartado automaticamente."
          />

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
                const escores = avaliacao.scores as Record<Fator, number>;
                const detalhe = avaliacao.fitDetail as {
                  puxaramPraBaixo?: Array<{ fator: Fator; dentro: boolean }>;
                } | null;
                const derrubou = detalhe?.puxaramPraBaixo?.[0];

                const medidores: MedidorMinimo[] = FATORES.map((f) => {
                  const cfg = perfil[f];
                  const irrelevante = !cfg || cfg.peso === 0;
                  return {
                    fator: f,
                    escore: escores[f],
                    faixa: cfg?.faixa ?? [0, 100],
                    dentro:
                      !irrelevante &&
                      escores[f] >= cfg.faixa[0] &&
                      escores[f] <= cfg.faixa[1],
                    irrelevante,
                  };
                });

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
              />
            </div>
          </Painel>

          {convidados.length > 0 && (
            <Painel padding="nenhum">
              <PainelCabecalho
                comBorda
                titulo="Aguardando resposta"
                descricao="Quem já tem acesso e ainda não terminou."
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
                      <span className="leitura shrink-0 rounded bg-secondary/60 px-2 py-1 text-sm tabular-nums tracking-[0.2em]">
                        {convidado.accessCode}
                      </span>
                    )}
                  </li>
                ))}
              </PainelLista>
            </Painel>
          )}

          <Painel>
            <PainelCabecalho
              titulo="Perfil-alvo"
              descricao="As faixas que esta vaga pede. É contra elas que a aderência é calculada."
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
