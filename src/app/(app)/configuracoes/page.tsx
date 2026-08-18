import type { Metadata } from "next";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import {
  DadosDaEmpresa,
  PrazoDeRetencao,
} from "@/components/app/dados-da-empresa";
import {
  GestaoDeEquipe,
  type PessoaDaEquipe,
} from "@/components/app/gestao-de-equipe";
import { Painel, PainelCabecalho } from "@/components/ui/painel";
import { usoDoMes } from "@/lib/dados/dashboard";
import { ROTULO_DE_PAPEL, data, iniciais, numero } from "@/lib/formato";
import { papeisQuePodeConceder } from "@/lib/permissoes";
import { CENARIOS_POR_PROVA, TOTAL_DE_ITENS } from "@/lib/instrument/form";
import { ITENS, VERSAO_DO_INSTRUMENTO } from "@/lib/instrument/items";
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
        website: true,
        document: true,
        retentionMonths: true,
      },
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

  const podeGerenciar = contexto.pode("equipe:gerenciar");
  const podeEditarEmpresa = contexto.pode("empresa:editar");
  const podeMudarRetencao = contexto.pode("retencao:configurar");

  const pessoas: PessoaDaEquipe[] = equipe.map((pessoa) => ({
    id: pessoa.id,
    nome: pessoa.name,
    email: pessoa.email,
    papel: pessoa.role,
    ativo: pessoa.isActive,
    // Formatado aqui: o componente é de cliente, e mandar `Date` cru para o
    // navegador faz a data ser renderizada no fuso de quem abre a tela.
    ultimoAcesso: pessoa.lastLoginAt ? data(pessoa.lastLoginAt) : null,
  }));

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
            descricao={
              podeEditarEmpresa
                ? "Aparece para o candidato no convite e no relatório."
                : "Aparece para o candidato no convite e no relatório. Só quem administra a conta edita."
            }
          />
          <DadosDaEmpresa
            empresa={{
              nome: empresa.name,
              slug: empresa.slug,
              segmento: empresa.segment,
              site: empresa.website,
              documento: empresa.document,
              retencaoEmMeses: empresa.retentionMonths,
            }}
            podeEditar={podeEditarEmpresa}
          />

          <div className="mt-6 border-t pt-5">
            <PrazoDeRetencao
              meses={empresa.retentionMonths}
              podeEditar={podeMudarRetencao}
            />
          </div>
          {/* O que a manutenção apaga e o que ela preserva, dito aqui porque é
              a única tela onde o prazo aparece — e porque "apagar as respostas"
              soa como apagar o resultado, que é justamente o que não acontece.

              O motivo mudou: esta frase dizia que o consolidado fica "porque o
              link de resultado do candidato continua valendo". Esse link foi
              REMOVIDO (regra nº 7 do README, invertida). Quem lê esta tela é o
              controlador dos dados; deixá-lo achar que o titular tem acesso por
              conta própria faria ele responder errado a um pedido de titular. */}
          <p className="t-legenda mt-5 border-t pt-4 leading-relaxed text-muted-foreground">
            Passado o prazo, a manutenção apaga a resposta bruta — o que a pessoa
            marcou item por item. O resultado consolidado fica: é dele que a sua
            empresa precisa para responder a um pedido de acesso feito depois
            desse prazo. O candidato não vê o resultado por conta própria; o
            acesso, a correção e a exclusão passam por pedido a você.
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
              valor={`${TOTAL_DE_ITENS} + ${CENARIOS_POR_PROVA} cenários`}
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
            descricao={
              podeGerenciar
                ? `${numero(equipe.length)} ${equipe.length === 1 ? "pessoa com acesso" : "pessoas com acesso"}. O papel define o que cada uma enxerga — inclusive se enxerga o relatório comportamental. Convidar gente nova ainda é feito fora do painel.`
                : `${numero(equipe.length)} ${equipe.length === 1 ? "pessoa com acesso" : "pessoas com acesso"}. Só quem administra a conta muda papéis.`
            }
          />

          {podeGerenciar ? (
            <GestaoDeEquipe
              pessoas={pessoas}
              meuId={contexto.userId}
              papeisQuePossoConceder={[...papeisQuePodeConceder(contexto.role)]}
            />
          ) : (
            <ul className="divide-y">
              {pessoas.map((pessoa) => (
                <li key={pessoa.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span
                    aria-hidden
                    className="t-legenda grid size-8 shrink-0 place-items-center rounded-full bg-secondary font-semibold text-muted-foreground"
                  >
                    {iniciais(pessoa.nome)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {pessoa.nome}
                      {pessoa.id === contexto.userId && (
                        <span className="etiqueta ml-2">você</span>
                      )}
                    </p>
                    <p className="t-legenda truncate text-muted-foreground">
                      {pessoa.email}
                    </p>
                  </div>
                  <span className="etiqueta shrink-0">
                    {ROTULO_DE_PAPEL[pessoa.papel]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Painel>
      </div>
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
