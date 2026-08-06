import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AvisoDeLink } from "@/components/teste/aviso-de-link";
import { FluxoDoTeste } from "@/components/teste/fluxo-do-teste";
import { TelaDeAbertura } from "@/components/teste/tela-de-abertura";
import { TelaDeConclusao } from "@/components/teste/tela-de-conclusao";
import type { DadosDoTeste } from "@/components/teste/tipos-da-prova";
import {
  lerProvaDaBateria,
  montarEtapas,
} from "@/lib/actions/forma-da-bateria";
import { lerBateria } from "@/lib/instrument/baterias";
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
          choiceResponses: { select: { blockId: true, choiceId: true } },
        },
      },
      organization: { select: { name: true } },
    },
  });

  if (!convite?.assessment) notFound();

  const avaliacao = convite.assessment;

  // Concluída: agradece e para por aqui. Antes isto redirecionava para
  // `/r/<resultToken>`, o relatório do candidato — que deixou de existir. O
  // resultado e as respostas registradas ficam com quem aplicou o teste.
  if (avaliacao.status === "COMPLETED") {
    return (
      <TelaDeConclusao
        nome={convite.candidate?.name ?? null}
        empresa={convite.organization.name}
        vaga={convite.job.title}
      />
    );
  }

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

  // A prova desta pessoa, teste a teste. A bateria é a CONGELADA na avaliação,
  // nunca a da vaga: mexer na vaga hoje não muda o que ela já começou a
  // responder.
  const prova = lerProvaDaBateria({
    semente: avaliacao.seed,
    bateria: lerBateria(avaliacao.testBattery),
    itensGuardados: (avaliacao.itemOrder as string[]) ?? [],
    blocosGuardados: (avaliacao.scenarioOrder as string[]) ?? [],
  });

  const etapas = montarEtapas({ semente: avaliacao.seed, prova });

  // Ainda não começou: tela de abertura com o que esperar.
  if (avaliacao.status === "PENDING") {
    return (
      <TelaDeAbertura
        token={token}
        empresa={convite.organization.name}
        vaga={convite.job.title}
        nome={convite.candidate?.name ?? null}
        etapas={etapas.map((e) => ({
          teste: e.teste,
          nome: e.nome,
          perguntas: e.perguntas.map((p) => ({ tipo: p.tipo })),
        }))}
      />
    );
  }

  const dados: DadosDoTeste = {
    token,
    etapas,
    salvas: {
      itens: Object.fromEntries(
        avaliacao.responses.map((r) => [r.itemId, r.value]),
      ),
      blocos: Object.fromEntries(
        avaliacao.scenarioResponses.map((r) => [
          r.blockId,
          { primeiraId: r.firstActionId, ultimaId: r.lastActionId },
        ]),
      ),
      escolhas: Object.fromEntries(
        avaliacao.choiceResponses.map((r) => [r.blockId, r.choiceId]),
      ),
    },
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
