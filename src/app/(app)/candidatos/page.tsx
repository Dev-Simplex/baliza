import type { Metadata } from "next";
import { Users } from "lucide-react";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { EstadoVazio } from "@/components/app/estado-vazio";
import { LinhaDeCandidato } from "@/components/app/linha-de-candidato";
import type { Confianca } from "@/components/app/selo-de-confianca";
import { BotaoLink } from "@/components/ui/botao-link";
import { Painel, PainelLista } from "@/components/ui/painel";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { data, numero } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Candidatos" };

export default async function PaginaDeCandidatos() {
  const { organizationId } = await exigirTenant();

  const avaliacoes = await prisma.assessment.findMany({
    where: { organizationId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 100,
    include: {
      candidate: { select: { id: true, name: true } },
      job: { select: { title: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <CabecalhoDePagina
        etiqueta="Base"
        titulo="Candidatos"
        descricao={
          avaliacoes.length === 0
            ? undefined
            : `${numero(avaliacoes.length)} ${avaliacoes.length === 1 ? "resposta concluída" : "respostas concluídas"}, da mais recente para a mais antiga.`
        }
      />

      {avaliacoes.length === 0 ? (
        <EstadoVazio
          icone={Users}
          titulo="Nenhum candidato respondeu ainda"
          descricao="Quem responder pelo link de qualquer vaga aparece aqui, com a leitura completa do perfil."
          acao={<BotaoLink href="/vagas">Ver as vagas</BotaoLink>}
        />
      ) : (
        <Painel padding="nenhum">
          <PainelLista>
            {avaliacoes.map((avaliacao) => (
              <LinhaDeCandidato
                key={avaliacao.id}
                href={`/candidatos/${avaliacao.candidate.id}?avaliacao=${avaliacao.id}`}
                comIniciais
                nome={avaliacao.candidate.name}
                detalhe={[
                  avaliacao.job.title,
                  avaliacao.archetypeId
                    ? ARQUETIPO_POR_ID.get(avaliacao.archetypeId)?.nome
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
                meta={data(avaliacao.completedAt)}
                escore={avaliacao.fitScore}
                confianca={avaliacao.confidence as unknown as Confianca}
              />
            ))}
          </PainelLista>
        </Painel>
      )}
    </div>
  );
}
