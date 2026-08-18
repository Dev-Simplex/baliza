import { renderToStream } from "@react-pdf/renderer";

import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { registrarAuditoria } from "@/lib/audit";
import { data, duracao } from "@/lib/formato";
import { AgregadoPdf, type DadosDoAgregado } from "@/lib/pdf/agregado";
import { prisma } from "@/lib/prisma";
import {
  desempenhoPorVaga,
  distribuicaoDeArquetipos,
  distribuicaoDeConfianca,
  funilDeRespostas,
  mediaPorFator,
  resumoDoPainel,
} from "@/lib/dados/dashboard";
import { exigirPermissaoDaApi, respostaDeAutorizacao } from "@/lib/tenant";

/**
 * O relatório do processo, em PDF.
 *
 * ─── Por que ele existe ao lado do CSV ─────────────────────────────────────
 * O CSV é linha por candidato e serve para o que o produto não faz: cruzar com o
 * ATS, filtrar, somar de outro jeito. Este responde a outra pergunta — "como o
 * processo está andando" — e vai para quem não abre o painel: a diretoria, o
 * cliente da consultoria, a reunião de fechamento.
 *
 * Ninguém dinamiza um PDF, e ninguém manda uma planilha para a diretoria. São
 * dois artefatos, não duas versões do mesmo.
 *
 * ─── Sem nome de candidato, de propósito ───────────────────────────────────
 * O agregado não identifica ninguém. Isso é decisão de privacidade e não
 * limitação: um arquivo sem dado pessoal circula por e-mail sem carregar o risco
 * junto — que é exatamente o que o CSV não consegue ser.
 *
 * ─── Stream, e não buffer ──────────────────────────────────────────────────
 * `renderToBuffer` monta o documento inteiro na memória antes de responder. Num
 * servidor onde o teto de memória é assunto conhecido, e com este arquivo
 * podendo crescer com o número de vagas, `renderToStream` entrega em pedaços e
 * o pico não acompanha o tamanho do relatório.
 */

const PERIODOS: Record<string, { dias: number | null; rotulo: string }> = {
  "30": { dias: 30, rotulo: "Últimos 30 dias" },
  "90": { dias: 90, rotulo: "Últimos 90 dias" },
  "365": { dias: 365, rotulo: "Último ano" },
  tudo: { dias: null, rotulo: "Todo o período" },
};

export async function GET(requisicao: Request) {
  let organizationId: string;
  let userId: string;
  try {
    ({ organizationId, userId } = await exigirPermissaoDaApi(
      "dados:exportar",
      "Seu perfil de acesso não permite exportar relatórios.",
    ));
  } catch (erro) {
    const recusa = respostaDeAutorizacao(erro);
    if (recusa) return recusa;
    throw erro;
  }

  const chave = new URL(requisicao.url).searchParams.get("periodo") ?? "tudo";
  const periodo = PERIODOS[chave] ?? PERIODOS.tudo;

  const [empresa, resumo, vagas, confianca, funil, arquetipos, medias] =
    await Promise.all([
      prisma.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { name: true },
      }),
      resumoDoPainel(organizationId),
      desempenhoPorVaga(organizationId),
      distribuicaoDeConfianca(organizationId),
      funilDeRespostas(organizationId),
      distribuicaoDeArquetipos(organizationId),
      mediaPorFator(organizationId),
    ]);

  const dados: DadosDoAgregado = {
    empresa: empresa.name,
    geradoEm: data(new Date()),
    periodo: periodo.rotulo,

    candidatos: resumo.candidatos,
    vagasAbertas: resumo.vagasAbertas,
    concluidas: resumo.concluidas,
    pendentes: resumo.pendentes,
    aderenciaMedia: resumo.aderenciaMedia,
    duracaoMedia: resumo.duracaoMedia ? duracao(resumo.duracaoMedia) : null,

    funil: [
      { rotulo: "Receberam o link", valor: funil.convidados },
      { rotulo: "Começaram", valor: funil.iniciados },
      { rotulo: "Concluíram", valor: funil.concluidos },
    ],
    confianca,
    medias: medias ? { n: medias.n, valores: medias.medias } : null,
    // O id do arquétipo é interno; o que vai ao papel é o nome.
    arquetipos: arquetipos
      .map((a) => ({
        nome: ARQUETIPO_POR_ID.get(a.id)?.nome ?? a.id,
        total: a.total,
      }))
      .slice(0, 6),
    vagas: vagas.map((v) => ({
      titulo: v.titulo,
      departamento: v.departamento,
      convites: v.convites,
      concluidas: v.concluidas,
      conversao: v.conversao,
      aderenciaMedia: v.aderenciaMedia,
    })),
  };

  const fluxo = await renderToStream(<AgregadoPdf d={dados} />);

  await registrarAuditoria({
    categoria: "EXPORT",
    acao: "relatorio_exportado_pdf",
    organizationId,
    userId,
    entidade: "Organization",
    entidadeId: organizationId,
    metadados: { periodo: chave, vagas: dados.vagas.length },
  });

  const hoje = new Date().toISOString().slice(0, 10);
  return new Response(fluxo as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="baliza-relatorio-${hoje}.pdf"`,
      // Agregado não tem nome de candidato, mas continua sendo dado da empresa.
      "Cache-Control": "private, no-store",
    },
  });
}
