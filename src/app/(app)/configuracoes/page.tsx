import type { Metadata } from "next";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { Painel, PainelCabecalho } from "@/components/ui/painel";
import { usoDoMes } from "@/lib/dados/dashboard";
import { ROTULO_DE_PAPEL, iniciais, numero } from "@/lib/formato";
import { VERSAO_DO_INSTRUMENTO } from "@/lib/instrument/items";
import { TOTAL_DE_ITENS } from "@/lib/instrument/form";
import { ITENS } from "@/lib/instrument/items";
import { CENARIOS } from "@/lib/instrument/scenarios";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Configurações" };

export default async function PaginaDeConfiguracoes() {
  const contexto = await exigirTenant();

  const [empresa, uso, equipe] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: contexto.organizationId },
      select: {
        name: true,
        slug: true,
        segment: true,
        retentionMonths: true,
      },
    }),
    usoDoMes(contexto.organizationId),
    prisma.user.findMany({
      where: { organizationId: contexto.organizationId },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: { id: true, name: true, email: true, role: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <CabecalhoDePagina
        etiqueta="Conta"
        titulo="Configurações"
        descricao="Sua empresa, o instrumento em uso e quem tem acesso."
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
            titulo="Uso"
            descricao="Sem teto: o sistema não recusa vaga nem resposta."
          />
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <Medida rotulo="Vagas ativas" valor={numero(uso.vagasAtivas)} />
            <Medida
              rotulo="Respostas neste mês"
              valor={numero(uso.avaliacoesNoMes)}
            />
            <Medida rotulo="Usuários" valor={numero(uso.usuarios)} />
          </dl>
        </Painel>

        <Painel>
          <PainelCabecalho
            titulo="Instrumento"
            descricao="O que cada candidato responde."
          />
          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <Medida rotulo="Versão" valor={VERSAO_DO_INSTRUMENTO} />
            <Medida
              rotulo="Itens por aplicação"
              valor={`${TOTAL_DE_ITENS} + ${CENARIOS.length} cenários`}
            />
            <Medida rotulo="Itens no banco" valor={numero(ITENS.length)} />
          </dl>
          <p className="t-legenda mt-5 border-t pt-4 text-muted-foreground">
            Cada aplicação sorteia itens do banco respeitando as invariantes do
            instrumento. Duas pessoas não recebem a mesma prova, e quem responde
            de novo recebe itens que ainda não viu.
          </p>
        </Painel>

        <Painel padding="nenhum">
          <PainelCabecalho
            comBorda
            titulo="Equipe"
            descricao={`${numero(equipe.length)} ${equipe.length === 1 ? "pessoa com acesso" : "pessoas com acesso"}.`}
          />
          <ul className="divide-y">
            {equipe.map((pessoa) => (
              <li key={pessoa.id} className="flex items-center gap-3 px-5 py-3.5">
                <span
                  aria-hidden
                  className="t-legenda grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-semibold text-muted-foreground"
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

function Medida({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-lg border bg-superficie-2/50 p-3.5">
      <dt className="etiqueta">{rotulo}</dt>
      <dd className="leitura mt-2 text-lg font-semibold">{valor}</dd>
    </div>
  );
}
