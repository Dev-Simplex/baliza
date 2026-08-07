import { renderToBuffer } from "@react-pdf/renderer";

import { RelatorioPdf, type DadosDoRelatorio } from "@/lib/pdf/relatorio";
import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { CATALOGO_DE_TESTES } from "@/lib/instrument/baterias";
import { lerAvaliacao } from "@/lib/analise/modulos";
import { montarRoteiro } from "@/lib/analise/roteiro";
import type { ContribuicaoDeFit } from "@/lib/instrument/scoring";
import { faixaQualitativa, separarPorFaixa } from "@/lib/instrument/scoring";
import {
  FATORES,
  NOMES_DE_FATOR,
  type Fator,
  type PerfilAlvo,
} from "@/lib/instrument/types";
import { ROTULO_DA_DECISAO, data, duracao, numero } from "@/lib/formato";
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
        include: {
          job: { select: { id: true, title: true, targetProfile: true } },
          // As respostas brutas alimentam os alertas do §6.3 do manual, que só
          // existem para Big Five e DISC. Vêm sempre porque a rota é de
          // exportação e roda uma vez por download — o custo de duas listas
          // curtas aqui não se compara ao de duas consultas condicionais.
          responses: { select: { itemId: true, value: true, elapsedMs: true } },
          scenarioResponses: { select: { blockId: true, elapsedMs: true } },
          // O nome de quem deu o parecer: sem autor, o parecer impresso não
          // sustenta uma conversa meses depois nem um pedido de revisão.
          decidedBy: { select: { name: true } },
        },
      },
    },
  });

  if (!candidato || candidato.assessments.length === 0)
    return new Response("Relatório não encontrado", { status: 404 });

  const avaliacao =
    candidato.assessments.find((a) => a.id === avaliacaoId) ??
    candidato.assessments[0];

  const leitura = lerAvaliacao(
    avaliacao,
    { itens: avaliacao.responses, blocos: avaliacao.scenarioResponses },
    avaliacao.job.targetProfile as unknown as PerfilAlvo | null,
  );

  // Sem os cinco fatores E sem módulo do manual não sobrou o que desenhar: é a
  // avaliação que concluiu sem resultado nenhum gravado. Antes o 409 pegava
  // toda bateria sem os cinco fatores — inclusive a de DISC + SJT, que TEM
  // relatório (as fichas do §5.2), só não tem aderência.
  if (!leitura.escores && !leitura.ficha.temAlgum)
    return new Response(
      "Esta avaliação não tem resultado gravado para gerar relatório.",
      { status: 409 },
    );

  const escores = leitura.escores;
  const confianca = leitura.selo;
  const detalhe = avaliacao.fitDetail as {
    contribuicoes: ContribuicaoDeFit[];
    puxaramPraCima: ContribuicaoDeFit[];
    puxaramPraBaixo: ContribuicaoDeFit[];
    ignoradas: Fator[];
  } | null;
  const facetas =
    (avaliacao.facetNotes as Array<{ texto: string }> | null) ?? [];
  const separadas = separarPorFaixa(detalhe?.contribuicoes ?? []);

  const roteiro = montarRoteiro({
    contribuicoes: detalhe?.contribuicoes ?? [],
    sinaisDeConfianca: confianca?.sinais ?? [],
    arquetipoId: avaliacao.archetypeId,
    escores: escores ?? undefined,
    perguntasDeModulo: leitura.perguntasDeModulo,
    semAderencia: !escores,
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
      ...(escores ? detalhe?.ignoradas ?? [] : []).map((f) => ({
        fator: f as string,
        nome: NOMES_DE_FATOR[f].ui,
        escore: escores![f],
        faixa: [0, 100] as [number, number],
        peso: 0,
        tipo: "irrelevante" as const,
        dentro: true,
      })),
    ],

    // Derivadas na leitura, e NÃO lidas de `detalhe.puxaram*`: a cópia gravada
    // é de quando a prova foi corrigida, e as pontuadas antes do conserto ainda
    // trazem a mesma dimensão nas duas colunas. Ver `separarPorFaixa`.
    puxaramPraCima: separadas.puxaramPraCima.map((c) => ({
      nome: c.nome ?? NOMES_DE_FATOR[c.fator].ui,
      escore: c.escore,
    })),
    puxaramPraBaixo: separadas.puxaramPraBaixo.map((c) => ({
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

    faixasQualitativas: escores
      ? FATORES.map((f) => ({
          nome: NOMES_DE_FATOR[f].ui,
          rotulo: faixaQualitativa(escores[f]).rotulo,
        }))
      : [],

    // A ficha dos módulos do manual. `temAlgum` falso — a vaga que só aplica o
    // Prumo — deixa o documento exatamente como sempre foi.
    modulos: leitura.ficha.temAlgum ? leitura.ficha : null,
    qualidade: leitura.qualidade,
    bateria: leitura.bateria.map((t) => CATALOGO_DE_TESTES[t].nome),

    // Traduzir o valor do banco para o rótulo é trabalho DESTA camada: o
    // arquivo do PDF desenha, e não conhece o vocabulário do domínio.
    parecer: avaliacao.decision
      ? {
          decisao: ROTULO_DA_DECISAO[avaliacao.decision],
          nota: avaliacao.decisionNote,
          por: avaliacao.decidedBy?.name ?? null,
          em: avaliacao.decidedAt ? data(avaliacao.decidedAt) : null,
        }
      : null,
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
