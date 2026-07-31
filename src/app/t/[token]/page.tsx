import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

import { FluxoDoTeste, type DadosDoTeste } from "@/components/teste/fluxo-do-teste";
import { TelaDeAbertura } from "@/components/teste/tela-de-abertura";
import { CENARIO_POR_ID } from "@/lib/instrument/scenarios";
import { ITEM_POR_ID } from "@/lib/instrument/items";
import { ordenarOpcoesDeCenario } from "@/lib/instrument/form";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Mapeamento comportamental",
  robots: { index: false, follow: false },
};

export default async function PaginaDoTeste({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const convite = await prisma.invitation.findUnique({
    where: { token },
    include: {
      job: { select: { title: true } },
      candidate: { select: { name: true } },
      assessment: {
        include: {
          responses: { select: { itemId: true, value: true } },
          scenarioResponses: {
            select: { blockId: true, firstActionId: true, lastActionId: true },
          },
        },
      },
      organization: { select: { name: true } },
    },
  });

  if (!convite?.assessment) notFound();

  const avaliacao = convite.assessment;

  if (avaliacao.status === "COMPLETED") redirect(`/r/${avaliacao.resultToken}`);

  if (convite.expiresAt < new Date() || convite.status === "REVOKED") {
    return <ConviteVencido empresa={convite.organization.name} />;
  }

  const idsDeItens = (avaliacao.itemOrder as string[]) ?? [];
  const idsDeCenarios = (avaliacao.scenarioOrder as string[]) ?? [];

  // Ainda não começou: tela de abertura com o que esperar.
  if (avaliacao.status === "PENDING") {
    return (
      <TelaDeAbertura
        token={token}
        empresa={convite.organization.name}
        vaga={convite.job.title}
        nome={convite.candidate?.name ?? null}
        totalDeItens={idsDeItens.length}
        totalDeCenarios={idsDeCenarios.length}
      />
    );
  }

  const dados: DadosDoTeste = {
    token,
    itens: idsDeItens
      .map((id) => ITEM_POR_ID.get(id))
      .filter((i) => Boolean(i))
      .map((i) => ({ id: i!.id, texto: i!.texto })),

    cenarios: idsDeCenarios
      .map((id) => CENARIO_POR_ID.get(id))
      .filter((c) => Boolean(c))
      .map((c) => {
        // A ordem das opções também é sorteada, e derivada da semente: some a
        // vantagem de quem recebe a lista sempre na mesma sequência.
        const ordem = ordenarOpcoesDeCenario(
          avaliacao.seed,
          c!.id,
          c!.opcoes.map((o) => o.id),
        );
        return {
          id: c!.id,
          titulo: c!.titulo,
          situacao: c!.situacao,
          opcoes: ordem.map((oid) => {
            const o = c!.opcoes.find((x) => x.id === oid)!;
            return { id: o.id, texto: o.texto };
          }),
        };
      }),

    respostasSalvas: Object.fromEntries(
      avaliacao.responses.map((r) => [r.itemId, r.value]),
    ),
    cenariosSalvos: Object.fromEntries(
      avaliacao.scenarioResponses.map((r) => [
        r.blockId,
        { primeiraId: r.firstActionId, ultimaId: r.lastActionId },
      ]),
    ),
  };

  return <FluxoDoTeste dados={dados} />;
}

function ConviteVencido({ empresa }: { empresa: string }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 text-center">
      <h1 className="t-titulo">
        Este link não vale mais
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        O prazo para responder terminou. Fale com quem enviou o convite na{" "}
        {empresa} para receber um link novo.
      </p>
    </div>
  );
}
