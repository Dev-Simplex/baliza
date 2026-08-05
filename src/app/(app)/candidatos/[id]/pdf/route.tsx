import { renderToBuffer } from "@react-pdf/renderer";

import { RelatorioPdf, type DadosDoRelatorio } from "@/lib/pdf/relatorio";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { montarRoteiro } from "@/lib/analise/roteiro";
import type { ContribuicaoDeFit } from "@/lib/instrument/scoring";
import { faixaQualitativa } from "@/lib/instrument/scoring";
import { FATORES, NOMES_DE_FATOR, type Fator } from "@/lib/instrument/types";
import { data, duracao, numero } from "@/lib/formato";
import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";

/**
 * Download do relatório em PDF.
 *
 * ─── Por que é uma rota, e não um botão de imprimir ────────────────────────
 * O diálogo de impressão do navegador não salva: ele abre uma caixa e carimba
 * no papel a data, o título da aba, a URL inteira e "1/3" — nada disso se
 * desliga por CSS, porque é configuração do usuário. Aqui o servidor devolve o
 * arquivo pronto, com `Content-Disposition: attachment`, e o navegador só
 * baixa.
 *
 * ─── O escopo é a parte que não pode falhar ────────────────────────────────
 * Esta rota entrega um relatório inteiro de uma pessoa. `exigirTenant()` na
 * primeira linha e `organizationId` DENTRO do `where` — nunca conferido depois
 * de buscar: consulta que esquece o escopo é vazamento entre clientes, e uma
 * rota de exportação é o pior lugar para descobrir isso.
 *
 * O download entra na trilha de auditoria pela mesma razão: dado de candidato
 * saindo da ferramenta em arquivo é exatamente o evento que alguém vai querer
 * reconstruir depois.
 */
export async function GET(
  requisicao: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { organizationId, userId } = await exigirTenant();

  const avaliacaoId = new URL(requisicao.url).searchParams.get("avaliacao");

  const candidato = await prisma.candidate.findFirst({
    where: { id, organizationId },
    include: {
      organization: { select: { name: true } },
      assessments: {
        where: { status: "COMPLETED" },
        orderBy: { completedAt: "desc" },
        include: { job: { select: { id: true, title: true } } },
      },
    },
  });

  if (!candidato || candidato.assessments.length === 0)
    return new Response("Relatório não encontrado", { status: 404 });

  const avaliacao =
    candidato.assessments.find((a) => a.id === avaliacaoId) ??
    candidato.assessments[0];

  const escores = avaliacao.scores as Record<Fator, number>;
  const confianca = avaliacao.confidence as unknown as {
    selo: "alta" | "media" | "baixa";
    rotulo: string;
    texto: string;
    sinais: string[];
  } | null;
  const detalhe = avaliacao.fitDetail as {
    contribuicoes: ContribuicaoDeFit[];
    puxaramPraCima: ContribuicaoDeFit[];
    puxaramPraBaixo: ContribuicaoDeFit[];
    ignoradas: Fator[];
  } | null;
  const facetas =
    (avaliacao.facetNotes as Array<{ texto: string }> | null) ?? [];

  const roteiro = montarRoteiro({
    contribuicoes: detalhe?.contribuicoes ?? [],
    sinaisDeConfianca: confianca?.sinais ?? [],
    arquetipoId: avaliacao.archetypeId,
    escores,
  });

  const arquetipo = avaliacao.archetypeId
    ? ARQUETIPO_POR_ID.get(avaliacao.archetypeId)
    : null;

  const dados: DadosDoRelatorio = {
    candidato: candidato.name,
    email: candidato.email,
    empresa: candidato.organization.name,
    vaga: avaliacao.job.title,
    respondidoEm: avaliacao.completedAt ? data(avaliacao.completedAt) : null,
    duracao: avaliacao.durationMs ? duracao(avaliacao.durationMs) : null,
    aderencia:
      avaliacao.fitScore == null ? null : numero(avaliacao.fitScore, 1),
    resumoDoGap: roteiro.resumoDoGap,
    selo: confianca
      ? { nivel: confianca.selo, rotulo: confianca.rotulo, texto: confianca.texto }
      : null,
    escores,

    // As dimensões que pesam vêm primeiro; as ignoradas entram no fim, com
    // peso 0, porque "não pesa nesta vaga" é informação — some do cálculo, não
    // da leitura.
    faixas: [
      ...(detalhe?.contribuicoes ?? []).map((c) => ({
        fator: c.fator as string,
        nome: c.nome ?? NOMES_DE_FATOR[c.fator].ui,
        escore: c.escore,
        faixa: c.faixa,
        peso: c.peso,
        tipo: c.tipo,
        dentro: c.dentro,
      })),
      ...(detalhe?.ignoradas ?? []).map((f) => ({
        fator: f as string,
        nome: NOMES_DE_FATOR[f].ui,
        escore: escores[f],
        faixa: [0, 100] as [number, number],
        peso: 0,
        tipo: "irrelevante" as const,
        dentro: true,
      })),
    ],

    puxaramPraCima: (detalhe?.puxaramPraCima ?? []).map((c) => ({
      nome: c.nome ?? NOMES_DE_FATOR[c.fator].ui,
      escore: c.escore,
    })),
    puxaramPraBaixo: (detalhe?.puxaramPraBaixo ?? []).map((c) => ({
      nome: c.nome ?? NOMES_DE_FATOR[c.fator].ui,
      escore: c.escore,
    })),

    perguntas: roteiro.perguntas.map((p) => ({
      pergunta: p.pergunta,
      motivo: p.motivo,
    })),

    arquetipo: arquetipo
      ? {
          nome: arquetipo.nome,
          frase: arquetipo.essencia,
          brilha: arquetipo.brilhaEm,
          trava: arquetipo.travaEm,
        }
      : null,

    facetas: facetas.map((f) => ({ texto: f.texto })),

    faixasQualitativas: FATORES.map((f) => ({
      nome: NOMES_DE_FATOR[f].ui,
      rotulo: faixaQualitativa(escores[f]).rotulo,
    })),
  };

  const buffer = await renderToBuffer(<RelatorioPdf d={dados} />);

  await registrarAuditoria({
    organizationId,
    userId,
    categoria: "EXPORT",
    acao: "relatorio.pdf",
    entidade: "Assessment",
    entidadeId: avaliacao.id,
  });

  // O nome do arquivo importa: ele vai para a pasta de downloads junto de
  // dezenas de outros, e "documento.pdf" obriga a abrir para saber de quem é.
  const nome = `Prumo — ${candidato.name} — ${avaliacao.job.title}.pdf`
    .replace(/[/\\?%*:|"<>]/g, "-")
    .trim();

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      // `attachment` é o que faz o navegador BAIXAR em vez de abrir num visor.
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(nome)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
