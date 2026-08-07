import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Marca } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { FormularioDeEntrada } from "@/components/teste/formulario-de-entrada";
import { ROTULO_DE_MODELO, ROTULO_DE_SENIORIDADE } from "@/lib/formato";
// O tempo prometido AQUI e o primeiro que o candidato le. Era fixo em "6
// minutos" e nao tinha relacao com a bateria da vaga — numa bateria completa
// ficava a 17 minutos da verdade que ele encontra na tela seguinte.
import { lerBateria, rotuloDeTempo } from "@/lib/instrument/baterias";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ publicToken: string }>;
}): Promise<Metadata> {
  const { publicToken } = await params;
  const vaga = await prisma.job.findUnique({
    where: { publicToken },
    select: { title: true, organization: { select: { name: true } } },
  });

  if (!vaga) return { title: "Vaga não encontrada" };
  return {
    title: `${vaga.title} · ${vaga.organization.name}`,
    robots: { index: false, follow: false },
  };
}

export default async function PaginaPublicaDaVaga({
  params,
}: {
  params: Promise<{ publicToken: string }>;
}) {
  const { publicToken } = await params;

  const vaga = await prisma.job.findUnique({
    where: { publicToken },
    include: { organization: { select: { name: true } } },
  });

  if (!vaga) notFound();

  const aberta = vaga.publicEnabled && vaga.status === "OPEN";
  // Fechada mas viva: a entrada existe, só não é por aqui.
  const porConvite = !vaga.publicEnabled && vaga.status === "OPEN";

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col px-6 py-8">
      <header>
        <Marca href={null} />
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <p className="etiqueta">{vaga.organization.name}</p>

        <h1 className="mt-3 t-titulo">
          {vaga.title}
        </h1>

        <div className="mt-3 flex flex-wrap gap-x-2 gap-y-1 t-corpo-sm text-muted-foreground">
          {vaga.department && <span>{vaga.department}</span>}
          <span aria-hidden>·</span>
          <span>{ROTULO_DE_SENIORIDADE[vaga.seniority] ?? vaga.seniority}</span>
          <span aria-hidden>·</span>
          <span>{ROTULO_DE_MODELO[vaga.workModel] ?? vaga.workModel}</span>
          {vaga.location && (
            <>
              <span aria-hidden>·</span>
              <span>{vaga.location}</span>
            </>
          )}
        </div>

        {vaga.description && (
          <p className="mt-6 t-corpo leading-relaxed whitespace-pre-line text-muted-foreground">
            {vaga.description}
          </p>
        )}

        {aberta ? (
          <div className="mt-9">
            <h2 className="text-sm font-semibold">
              Comece pelo mapeamento comportamental
            </h2>
            <p className="mt-1.5 t-corpo-sm leading-relaxed text-muted-foreground">
              Leva {rotuloDeTempo(lerBateria(vaga.testBattery))} e responde pelo
              celular. Não é prova, não
              precisa criar conta, e o resultado vai direto para quem conduz o
              processo.
            </p>
            <FormularioDeEntrada publicToken={publicToken} />

            {/* Quem já começou volta por este mesmo endereço achando que vai
                recomeçar do zero. Vai cair de onde parou — mas só descobre isso
                se alguém disser. */}
            <p className="mt-4 t-legenda leading-relaxed text-muted-foreground">
              Já começou antes? Use o mesmo e-mail: você volta exatamente de onde
              parou, sem repetir nada.
            </p>
          </div>
        ) : porConvite ? (
          // Vaga fechada não é vaga encerrada, e a diferença importa muito para
          // quem está do outro lado: uma pede o acesso, a outra já acabou.
          <div className="mt-9 rounded-xl border border-dashed px-5 py-6 text-center">
            <p className="text-sm font-medium">Esta vaga é por convite</p>
            <p className="mt-1.5 t-corpo-sm leading-relaxed text-muted-foreground">
              A empresa envia um link, um QR Code ou um código de 4 dígitos para
              cada pessoa. Se você já recebeu o seu código, entre por aqui.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              nativeButton={false}
              render={<Link href="/acesso" />}
            >
              Entrar com código
            </Button>
          </div>
        ) : (
          <div className="mt-9 rounded-xl border border-dashed px-5 py-6 text-center">
            <p className="text-sm font-medium">Esta vaga já foi encerrada</p>
            <p className="mt-1.5 t-corpo-sm leading-relaxed text-muted-foreground">
              A empresa não está mais recebendo respostas por aqui. Se você
              respondeu antes do encerramento, o seu link de resultado continua
              funcionando.
            </p>
          </div>
        )}
      </main>

      <footer className="t-legenda leading-relaxed text-muted-foreground">
        Seus dados são usados apenas neste processo seletivo e apagados no prazo
        informado pela empresa. Você pode pedir a exclusão a qualquer momento.
      </footer>
    </div>
  );
}
