import type { Metadata } from "next";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { CartaoIndicador } from "@/components/app/cartao-indicador";
import { Painel, PainelCabecalho, NotaDeRodape } from "@/components/ui/painel";
import { data, dataHora, haQuantoTempo, numero } from "@/lib/formato";
import { TOTAL_DE_ITENS } from "@/lib/instrument/form";
import { prisma } from "@/lib/prisma";
import { exigirAdminPlataforma } from "@/lib/tenant";

export const metadata: Metadata = { title: "Administração" };

const ROTULO_DE_CATEGORIA: Record<string, string> = {
  AUTH: "Acesso",
  ACCESS: "Leitura",
  MUTATION: "Alteração",
  EXPORT: "Exportação",
  ADMIN: "Plataforma",
  PRIVACY: "Privacidade",
};

/**
 * Painel da plataforma.
 *
 * Vive FORA do escopo de empresa: é o operador do produto olhando o produto.
 * Por isso nenhuma consulta aqui passa por `exigirTenant` — e por isso a
 * proteção é `exigirAdminPlataforma`, que o proxy também barra na borda.
 */
export default async function PaginaDeAdministracao() {
  await exigirAdminPlataforma();

  const [empresas, totais, itens, cenarios, auditoria] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: {
        _count: { select: { users: true, jobs: true, assessments: true } },
      },
    }),
    Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.assessment.count({ where: { status: "COMPLETED" } }),
      prisma.candidate.count(),
    ]),
    prisma.item.count({ where: { isActive: true } }),
    prisma.scenarioBlock.count({ where: { isActive: true } }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        organization: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
  ]);

  const [totalEmpresas, totalUsuarios, totalRespostas, totalCandidatos] = totais;

  return (
    <div className="mx-auto max-w-6xl">
      <CabecalhoDePagina
        etiqueta="Plataforma"
        titulo="Administração"
        descricao="Visão do operador. Fora do escopo de qualquer empresa."
      />

      <div className="space-y-4">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CartaoIndicador rotulo="Empresas" valor={numero(totalEmpresas)} />
          <CartaoIndicador rotulo="Usuários" valor={numero(totalUsuarios)} />
          <CartaoIndicador rotulo="Candidatos" valor={numero(totalCandidatos)} />
          <CartaoIndicador
            destaque
            rotulo="Respostas concluídas"
            valor={numero(totalRespostas)}
            apoio={
              totalRespostas < 200
                ? `faltam ${numero(200 - totalRespostas)} para liberar percentil`
                : "amostra suficiente para percentil"
            }
          />
        </section>

        <Painel padding="nenhum">
          <PainelCabecalho
            comBorda
            titulo="Empresas"
            descricao="Uso e data de entrada."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th scope="col" className="etiqueta px-5 py-2.5 text-left">
                    Empresa
                  </th>
                  <th scope="col" className="etiqueta px-3 py-2.5 text-right">
                    Usuários
                  </th>
                  <th scope="col" className="etiqueta px-3 py-2.5 text-right">
                    Vagas
                  </th>
                  <th scope="col" className="etiqueta px-3 py-2.5 text-right">
                    Respostas
                  </th>
                  <th scope="col" className="etiqueta px-5 py-2.5 text-right">
                    Desde
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {empresas.map((empresa) => (
                    <tr key={empresa.id}>
                      <td className="px-5 py-3">
                        <span className="font-medium">{empresa.name}</span>
                        <span className="leitura block text-xs text-muted-foreground">
                          {empresa.slug}
                        </span>
                      </td>
                      <td className="leitura px-3 py-3 text-right text-muted-foreground">
                        {numero(empresa._count.users)}
                      </td>
                      <td className="leitura px-3 py-3 text-right text-muted-foreground">
                        {numero(empresa._count.jobs)}
                      </td>
                      <td className="leitura px-3 py-3 text-right">
                        {numero(empresa._count.assessments)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {data(empresa.createdAt)}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Painel>

        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Painel>
            <PainelCabecalho
              titulo="Banco de itens"
              descricao="A fonte da verdade é o arquivo TypeScript; o banco é a cópia gerenciável."
            />
            <dl className="mt-5 space-y-3">
              <Linha rotulo="Itens ativos" valor={numero(itens)} />
              <Linha rotulo="Blocos de cenário" valor={numero(cenarios)} />
              <Linha rotulo="Itens por aplicação" valor={`${TOTAL_DE_ITENS}`} />
            </dl>
            <p className="t-legenda mt-5 border-t pt-4 text-muted-foreground">
              Aposentar um item é seguro: a prova continua com {TOTAL_DE_ITENS} porque
              o sorteio tem folga no banco.
            </p>
          </Painel>

          <Painel padding="nenhum">
            <PainelCabecalho
              comBorda
              titulo="Auditoria"
              descricao="Últimos eventos registrados na plataforma."
            />
            <ul className="divide-y">
              {auditoria.length === 0 && (
                <li className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Nenhum evento registrado ainda.
                </li>
              )}
              {auditoria.map((evento) => (
                <li key={evento.id} className="flex items-baseline gap-3 px-5 py-3">
                  <span className="etiqueta w-20 shrink-0">
                    {ROTULO_DE_CATEGORIA[evento.category] ?? evento.category}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="leitura truncate t-corpo-sm">{evento.action}</p>
                    <p className="t-legenda truncate text-muted-foreground">
                      {[evento.organization?.name, evento.user?.name]
                        .filter(Boolean)
                        .join(" · ") || "sistema"}
                    </p>
                  </div>
                  <span
                    className="etiqueta shrink-0"
                    title={dataHora(evento.createdAt)}
                  >
                    {haQuantoTempo(evento.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Painel>
        </div>

        <NotaDeRodape>
          Esta tela lê dados de todas as empresas. O acesso é restrito a
          operadores da plataforma e cada visita fica registrada.
        </NotaDeRodape>
      </div>
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-sm text-muted-foreground">{rotulo}</dt>
      <dd className="leitura text-sm font-medium">{valor}</dd>
    </div>
  );
}
