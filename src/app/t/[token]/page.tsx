import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";

import { AvisoDeLink } from "@/components/teste/aviso-de-link";
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

  // Vencido e cancelado NÃO são a mesma coisa para quem está do outro lado:
  // num caso a pessoa perdeu o prazo, no outro a empresa desfez o convite. A
  // tela dizia "o prazo terminou" nos dois, e quem tinha sido cancelado ficava
  // procurando um prazo que nunca existiu.
  if (convite.status === "REVOKED") {
    return <ConviteCancelado empresa={convite.organization.name} />;
  }

  if (convite.expiresAt < new Date()) {
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
    <AvisoDeLink titulo="O prazo deste convite terminou." mostrarCaminhoDoCodigo={false}>
      <p>
        O link tem validade, e a desta vez passou. Nada do que você respondeu se
        perdeu — mas para continuar é preciso um convite novo.
      </p>
      <p>
        Fale com quem te enviou o convite na {empresa}: reenviar leva alguns
        segundos, e o novo link cai exatamente onde você parou.
      </p>
    </AvisoDeLink>
  );
}

function ConviteCancelado({ empresa }: { empresa: string }) {
  return (
    <AvisoDeLink titulo="Este convite foi cancelado." mostrarCaminhoDoCodigo={false}>
      <p>
        Quem enviou o convite o desfez — isso costuma acontecer quando a vaga
        muda de forma ou quando o convite foi enviado duas vezes por engano.
      </p>
      <p>
        Se você acha que não deveria ter sido cancelado, fale com a {empresa}.
      </p>
    </AvisoDeLink>
  );
}
