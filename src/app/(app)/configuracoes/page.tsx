import type { Metadata } from "next";
import { Check } from "lucide-react";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { Painel, PainelCabecalho } from "@/components/ui/painel";
import { Badge } from "@/components/ui/badge";
import { usoDoMes } from "@/lib/dados/dashboard";
import { PLANOS, formatarPreco } from "@/lib/plans";
import { ROTULO_DE_PAPEL, data, iniciais, numero } from "@/lib/formato";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Configurações" };

export default async function PaginaDeConfiguracoes() {
  const contexto = await exigirTenant();

  const [empresa, uso, equipe] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: contexto.organizationId },
      include: { subscription: true },
    }),
    usoDoMes(contexto.organizationId),
    prisma.user.findMany({
      where: { organizationId: contexto.organizationId },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
      },
    }),
  ]);

  const plano = PLANOS[empresa.subscription?.planCode ?? "STARTER"];
  const limites = plano.limites;

  const medidores = [
    { rotulo: "Vagas ativas", usado: uso.vagasAtivas, teto: limites.vagasAtivas },
    {
      rotulo: "Respostas neste mês",
      usado: uso.avaliacoesNoMes,
      teto: limites.avaliacoesPorMes,
    },
    { rotulo: "Usuários", usado: uso.usuarios, teto: limites.usuarios },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <CabecalhoDePagina
        etiqueta="Conta"
        titulo="Configurações"
        descricao="Sua empresa, seu plano e quem tem acesso."
      />

      <div className="space-y-4">
        <Painel>
          <PainelCabecalho
            titulo="Empresa"
            descricao="Aparece para o candidato no convite e no relatório."
          />
          <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            <Campo rotulo="Nome" valor={empresa.name} />
            <Campo rotulo="Identificador" valor={empresa.slug} monospace />
            <Campo rotulo="Segmento" valor={empresa.segment ?? "—"} />
            <Campo
              rotulo="Retenção das respostas"
              valor={`${empresa.retentionMonths} meses`}
            />
          </dl>
          <p className="t-legenda mt-5 border-t pt-4 text-muted-foreground">
            Passado o prazo de retenção, a resposta bruta do candidato é
            apagada. O candidato pode pedir a exclusão antes disso.
          </p>
        </Painel>

        <Painel>
          <PainelCabecalho
            titulo="Plano e uso"
            acao={
              <Badge className="border border-marca/30 bg-marca-suave text-accent-foreground">
                {plano.nome}
              </Badge>
            }
            descricao={
              empresa.subscription?.status === "TRIALING"
                ? `Período de teste até ${data(empresa.subscription.currentPeriodEnd)}.`
                : `${formatarPreco(plano.precoMensalCentavos)}${plano.precoMensalCentavos > 0 ? " por mês" : ""}.`
            }
          />

          <div className="mt-6 space-y-5">
            {medidores.map((m) => {
              const ilimitado = !Number.isFinite(m.teto);
              const proporcao = ilimitado
                ? 0
                : Math.min(100, (m.usado / m.teto) * 100);
              const apertado = proporcao >= 80;

              return (
                <div key={m.rotulo}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm">{m.rotulo}</span>
                    <span className="leitura text-sm text-muted-foreground">
                      {numero(m.usado)}
                      {ilimitado ? "" : ` / ${numero(m.teto)}`}
                    </span>
                  </div>
                  <div className="regua mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                    {!ilimitado && (
                      <div
                        className={
                          apertado
                            ? "h-full rounded-full bg-fora"
                            : "h-full rounded-full bg-marca-forte"
                        }
                        style={{ width: `${Math.max(proporcao, 2)}%` }}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <ul className="mt-6 grid gap-2 border-t pt-5 sm:grid-cols-2">
            {plano.vitrine.map((linha) => (
              <li key={linha} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-3.5 shrink-0 text-dentro" />
                <span className="text-muted-foreground">{linha}</span>
              </li>
            ))}
          </ul>
        </Painel>

        <Painel padding="nenhum">
          <PainelCabecalho
            comBorda
            titulo="Equipe"
            descricao={`${numero(equipe.length)} ${equipe.length === 1 ? "pessoa com acesso" : "pessoas com acesso"}.`}
          />
          <ul className="divide-y">
            {equipe.map((pessoa) => (
              <li
                key={pessoa.id}
                className="flex items-center gap-3 px-5 py-3.5"
              >
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary t-legenda font-semibold text-muted-foreground"
                >
                  {iniciais(pessoa.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {pessoa.name}
                    {pessoa.id === contexto.userId && (
                      <span className="etiqueta ml-2">você</span>
                    )}
                  </p>
                  <p className="t-legenda truncate text-muted-foreground">
                    {pessoa.email}
                  </p>
                </div>
                <span className="etiqueta shrink-0">
                  {ROTULO_DE_PAPEL[pessoa.role]}
                </span>
              </li>
            ))}
          </ul>
        </Painel>
      </div>
    </div>
  );
}

function Campo({
  rotulo,
  valor,
  monospace = false,
}: {
  rotulo: string;
  valor: string;
  monospace?: boolean;
}) {
  return (
    <div>
      <dt className="etiqueta">{rotulo}</dt>
      <dd className={monospace ? "leitura mt-1.5 text-sm" : "mt-1.5 text-sm"}>
        {valor}
      </dd>
    </div>
  );
}
