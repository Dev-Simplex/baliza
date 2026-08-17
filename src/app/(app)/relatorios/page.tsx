import type { Metadata } from "next";
import Link from "next/link";
import { ChartNoAxesColumn } from "lucide-react";

import { CabecalhoDePagina } from "@/components/app/cabecalho-de-pagina";
import { ExportarRespostas } from "@/components/app/exportar-respostas";
import {
  CartaoIndicador,
  FaixaDeIndicadores,
} from "@/components/app/cartao-indicador";
import { EstadoVazio } from "@/components/app/estado-vazio";
import { Painel, PainelCabecalho, NotaDeRodape } from "@/components/ui/painel";
import { BotaoLink } from "@/components/ui/botao-link";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import {
  desempenhoPorVaga,
  distribuicaoDeArquetipos,
  distribuicaoDeConfianca,
  funilDeRespostas,
  mediaPorFator,
  resumoDoPainel,
} from "@/lib/dados/dashboard";
import {
  ROTULO_DE_STATUS_DE_VAGA,
  duracao,
  numero,
  porcentagem,
} from "@/lib/formato";
import { NOMES_DE_FATOR, FATORES } from "@/lib/instrument/types";
import { faixaQualitativa } from "@/lib/instrument/scoring";
import { exigirTenant } from "@/lib/tenant";

export const metadata: Metadata = { title: "Relatórios" };

export default async function PaginaDeRelatorios() {
  const { organizationId } = await exigirTenant();

  const [resumo, vagas, confianca, funil, arquetipos, medias] =
    await Promise.all([
      resumoDoPainel(organizationId),
      desempenhoPorVaga(organizationId),
      distribuicaoDeConfianca(organizationId),
      funilDeRespostas(organizationId),
      distribuicaoDeArquetipos(organizationId),
      mediaPorFator(organizationId),
    ]);

  if (resumo.concluidas === 0) {
    return (
      <div>
        <CabecalhoDePagina etiqueta="Agregado" titulo="Relatórios" />
        <EstadoVazio
          icone={ChartNoAxesColumn}
          titulo="Sem dados para agregar ainda"
          descricao="Os indicadores desta tela aparecem quando as primeiras respostas chegarem."
          acao={<BotaoLink href="/vagas">Ver as vagas</BotaoLink>}
        />
      </div>
    );
  }

  // Uma vez, fora do map: dentro dele o total era recalculado a cada arquétipo.
  const totalDeArquetipos = arquetipos.reduce((s, a) => s + a.total, 0);

  const etapasDoFunil = [
    { rotulo: "Receberam o link", valor: funil.convidados },
    { rotulo: "Começaram", valor: funil.iniciados },
    { rotulo: "Concluíram", valor: funil.concluidos },
  ];

  return (
    <div>
      <CabecalhoDePagina
        etiqueta="Agregado"
        titulo="Relatórios"
        descricao="Como o processo está andando, para além de um candidato de cada vez."
        acoes={<ExportarRespostas />}
      />

      <div className="space-y-4">
        <FaixaDeIndicadores>
          <CartaoIndicador
            rotulo="Respostas concluídas"
            valor={numero(resumo.concluidas)}
            variacao={{
              atual: resumo.concluidasNoPeriodo,
              anterior: resumo.concluidasNoPeriodoAnterior,
            }}
            apoio="vs. 30 dias anteriores"
          />
          <CartaoIndicador
            rotulo="Taxa de conclusão"
            valor={
              funil.convidados > 0
                ? porcentagem((funil.concluidos / funil.convidados) * 100)
                : "—"
            }
            apoio={`${numero(funil.concluidos)} de ${numero(funil.convidados)} que receberam o link`}
          />
          <CartaoIndicador
            rotulo="Tempo médio"
            valor={duracao(resumo.duracaoMedia)}
            apoio="por candidato"
          />
          <CartaoIndicador
            destaque
            rotulo="Aderência média"
            valor={
              resumo.aderenciaMedia === null
                ? "—"
                : numero(resumo.aderenciaMedia, 1)
            }
            apoio="em todas as vagas"
          />
        </FaixaDeIndicadores>

        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <Painel padding="nenhum">
            <PainelCabecalho
              comBorda
              titulo="Desempenho por vaga"
              descricao={
                // A consulta traz no máximo 20 vagas. Chegar exatamente em 20 é
                // sinal de que pode haver mais — e uma tabela que corta sem
                // dizer é lida como "estas são todas".
                vagas.length === 20
                  ? "As 20 vagas mais recentes: quantos receberam o link, quantos responderam e qual a aderência média."
                  : "Quantos receberam o link, quantos responderam e qual a aderência média."
              }
            />

            {/* ─── Celular: uma vaga por bloco ───────────────────────────
                A tabela abaixo tem cinco colunas e não cabe em 320px sem
                rolagem lateral — e rolagem lateral dentro de um painel é a
                forma mais fácil de esconder dado de quem só tem o telefone.
                Aqui os mesmos cinco valores viram rótulo e número, empilhados.

                As duas versões convivem porque `hidden` é `display: none`, e o
                que está em `display: none` sai da árvore de acessibilidade:
                em qualquer largura o leitor de tela encontra UMA das duas,
                nunca as duas. */}
            <ul className="divide-y md:hidden">
              {vagas.map((vaga) => (
                <li key={vaga.id}>
                  <Link
                    href={`/vagas/${vaga.id}`}
                    className="linha-clicavel block px-5 py-4"
                  >
                    <p className="text-sm font-medium">{vaga.titulo}</p>
                    <p className="t-legenda text-muted-foreground">
                      {[vaga.departamento, ROTULO_DE_STATUS_DE_VAGA[vaga.status]]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>

                    <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2.5 min-[26rem]:grid-cols-4">
                      <ValorDaVaga rotulo="Receberam" valor={numero(vaga.iniciadas)} />
                      <ValorDaVaga rotulo="Respostas" valor={numero(vaga.concluidas)} />
                      <ValorDaVaga
                        rotulo="Conclusão"
                        valor={
                          vaga.conversao === null
                            ? "—"
                            : porcentagem(vaga.conversao)
                        }
                      />
                      <ValorDaVaga
                        destaque
                        rotulo="Aderência"
                        valor={
                          vaga.aderenciaMedia === null
                            ? "—"
                            : numero(vaga.aderenciaMedia, 1)
                        }
                      />
                    </dl>
                  </Link>
                </li>
              ))}
            </ul>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Desempenho por vaga: quantas pessoas receberam o link, quantas
                  responderam, a taxa de conclusão e a aderência média.
                </caption>
                <thead>
                  <tr className="border-b">
                    <th scope="col" className="etiqueta px-5 py-2.5 text-left">
                      Vaga
                    </th>
                    <th scope="col" className="etiqueta px-3 py-2.5 text-right">
                      Receberam
                    </th>
                    <th scope="col" className="etiqueta px-3 py-2.5 text-right">
                      Respostas
                    </th>
                    <th scope="col" className="etiqueta px-3 py-2.5 text-right">
                      Conclusão
                    </th>
                    <th scope="col" className="etiqueta px-5 py-2.5 text-right">
                      Aderência
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {vagas.map((vaga) => (
                    <tr key={vaga.id} className="linha-clicavel">
                      <td className="px-5 py-3">
                        <Link
                          href={`/vagas/${vaga.id}`}
                          className="block min-w-40"
                        >
                          <span className="font-medium">{vaga.titulo}</span>
                          <span className="t-legenda block text-muted-foreground">
                            {[
                              vaga.departamento,
                              ROTULO_DE_STATUS_DE_VAGA[vaga.status],
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </Link>
                      </td>
                      <td className="leitura px-3 py-3 text-right text-muted-foreground">
                        {numero(vaga.iniciadas)}
                      </td>
                      <td className="leitura px-3 py-3 text-right">
                        {numero(vaga.concluidas)}
                      </td>
                      <td className="leitura px-3 py-3 text-right text-muted-foreground">
                        {vaga.conversao === null
                          ? "—"
                          : porcentagem(vaga.conversao)}
                      </td>
                      <td className="leitura px-5 py-3 text-right font-semibold">
                        {vaga.aderenciaMedia === null
                          ? "—"
                          : numero(vaga.aderenciaMedia, 1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Painel>

          <div className="space-y-4">
            <Painel>
              <PainelCabecalho
                titulo="Funil de resposta"
                descricao="Onde o candidato para."
              />
              <ul className="mt-5 space-y-3">
                {etapasDoFunil.map((etapa) => {
                  const proporcao =
                    funil.convidados > 0
                      ? (etapa.valor / funil.convidados) * 100
                      : 0;
                  return (
                    <li key={etapa.rotulo}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm">{etapa.rotulo}</span>
                        <span className="leitura text-sm text-muted-foreground">
                          {numero(etapa.valor)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-marca-forte"
                          style={{ width: `${Math.max(proporcao, 1.5)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Painel>

            <Painel>
              <PainelCabecalho
                titulo="Confiança das respostas"
                descricao="Saúde da própria base."
              />
              <ul className="mt-5 space-y-2.5">
                {(
                  [
                    ["alta", "Alta", "bg-dentro"],
                    ["media", "Média", "bg-marca-forte"],
                    ["baixa", "Baixa", "bg-fora"],
                  ] as const
                ).map(([chave, rotulo, cor]) => {
                  const valor = confianca[chave];
                  const proporcao =
                    confianca.total > 0 ? (valor / confianca.total) * 100 : 0;
                  return (
                    <li key={chave}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm">{rotulo}</span>
                        <span className="leitura text-sm text-muted-foreground">
                          {numero(valor)} · {porcentagem(proporcao)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${cor}`}
                          style={{ width: `${Math.max(proporcao, 1.5)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="t-legenda mt-4 border-t pt-3 text-muted-foreground">
                Muita resposta com confiança baixa costuma indicar convite mal
                explicado ou prazo apertado demais — não candidato desonesto.
              </p>
            </Painel>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {medias && (
            <Painel>
              <PainelCabecalho
                titulo="Perfil médio da base"
                descricao={`Média de ${numero(medias.n)} ${medias.n === 1 ? "resposta" : "respostas"}.`}
              />
              <ul className="mt-5 space-y-3">
                {FATORES.map((f) => {
                  const valor = medias.medias[f];
                  return (
                    <li key={f}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm">{NOMES_DE_FATOR[f].ui}</span>
                        <span className="etiqueta">
                          {faixaQualitativa(valor).rotulo}
                        </span>
                      </div>
                      <div className="regua mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-marca-forte"
                          style={{ width: `${valor}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Painel>
          )}

          <Painel>
            <PainelCabecalho
              titulo="Arquétipos na base"
              descricao="Camada de leitura. Nunca entra em ranking nem em filtro."
            />
            {arquetipos.length === 0 && (
              <p className="mt-5 t-legenda leading-relaxed text-muted-foreground">
                Nenhuma resposta com arquétipo atribuído ainda. O arquétipo sai
                do perfil inteiro, e perfis muito próximos da média não recebem
                nenhum — é leitura, não etiqueta obrigatória.
              </p>
            )}
            <ul className="mt-5 space-y-2.5">
              {arquetipos.map((a) => {
                const proporcao =
                  totalDeArquetipos > 0 ? (a.total / totalDeArquetipos) * 100 : 0;
                return (
                  <li key={a.id}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm">
                        {ARQUETIPO_POR_ID.get(a.id)?.nome ?? a.id}
                      </span>
                      <span className="leitura text-sm text-muted-foreground">
                        {numero(a.total)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-chart-2"
                        style={{ width: `${Math.max(proporcao, 1.5)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Painel>
        </div>

        <NotaDeRodape>
          Números agregados servem para calibrar o processo, não para decidir
          sobre pessoas. Nenhum indicador desta tela deve ser usado como corte.
        </NotaDeRodape>
      </div>
    </div>
  );
}

/**
 * Um número da vaga na versão de celular.
 *
 * `dt`/`dd` e não dois `span`: no bloco empilhado o rótulo é o cabeçalho de
 * coluna que a tabela tem e o cartão perdeu. Sem a relação declarada, o leitor
 * de tela anuncia quatro números soltos.
 */
function ValorDaVaga({
  rotulo,
  valor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <dt className="etiqueta">{rotulo}</dt>
      <dd
        className={`leitura mt-1 text-sm tabular-nums ${
          destaque ? "font-semibold" : "text-muted-foreground"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}
