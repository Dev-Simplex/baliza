import { ARQUETIPO_POR_ID } from "@/lib/instrument/archetypes";
import { lerAvaliacao } from "@/lib/analise/modulos";
import { ROTULO_DA_DECISAO } from "@/lib/formato";
import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { exigirTenant } from "@/lib/tenant";

/**
 * Exportação das respostas concluídas em CSV.
 *
 * ─── Por que existe ───────────────────────────────────────────────────────
 * A tela de relatórios agrega, e agregado responde "como o processo está
 * andando". A pergunta que ela NÃO responde é a que vem depois: cruzar com o
 * ATS da empresa, mandar a lista para o gestor da área, calcular alguma coisa
 * que o produto não calcula. Sem exportação, a saída era copiar da tela à mão.
 *
 * ─── Ponto e vírgula, e não vírgula ───────────────────────────────────────
 * O Excel em português usa a vírgula como separador DECIMAL, então um arquivo
 * separado por vírgula abre com "58,1" partido em duas colunas — e a aderência,
 * que é a coluna que mais importa, é justamente a que quebra. `;` é o que o
 * Excel pt-BR entende como separador de campo.
 *
 * ─── O BOM não é enfeite ──────────────────────────────────────────────────
 * Sem os três bytes iniciais, o Excel abre UTF-8 como se fosse Latin-1 e todo
 * "Organização" vira "OrganizaÃ§Ã£o". O LibreOffice e o Sheets acertam
 * sozinhos; o Excel, que é onde isso vai parar, não.
 *
 * ─── A anotação do parecer VAI no arquivo ─────────────────────────────────
 * Foi decisão, não descuido. É o texto mais sensível que o sistema guarda, e um
 * CSV viaja mais fácil que uma tela. Mas ele já sai no PDF, quem exporta é o
 * controlador desses dados, e uma exportação que omite a conclusão da avaliação
 * obriga a pessoa a cruzar duas fontes na mão — que é a situação de onde
 * estamos saindo. O que o produto deve garantir é que a saída fique
 * REGISTRADA, e é por isso que a auditoria abaixo é obrigatória.
 */

/** Períodos oferecidos. `null` é "desde sempre". */
const PERIODOS: Record<string, number | null> = {
  "30": 30,
  "90": 90,
  "365": 365,
  tudo: null,
};

/**
 * Uma célula de CSV.
 *
 * Aspas duplicadas e o campo inteiro entre aspas: sem isso, uma anotação com
 * ponto e vírgula — que é escrita livre, então acontece — encerraria a coluna
 * no meio da frase e deslocaria todo o resto da linha. Quebra de linha dentro
 * da anotação vira espaço pelo mesmo motivo.
 */
function celula(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor).replace(/[\r\n]+/g, " ").trim();
  return `"${texto.replace(/"/g, '""')}"`;
}

export async function GET(requisicao: Request) {
  const { organizationId, userId } = await exigirTenant();

  const periodo = new URL(requisicao.url).searchParams.get("periodo") ?? "tudo";
  const dias = PERIODOS[periodo] ?? null;
  const desde = dias
    ? new Date(Date.now() - dias * 24 * 60 * 60 * 1000)
    : undefined;

  const avaliacoes = await prisma.assessment.findMany({
    // `organizationId` DENTRO do where, como em toda leitura de dado de
    // candidato. Rota de exportação é o pior lugar possível para descobrir um
    // escopo esquecido.
    where: {
      organizationId,
      status: "COMPLETED",
      ...(desde ? { completedAt: { gte: desde } } : {}),
    },
    orderBy: { completedAt: "desc" },
    include: {
      candidate: { select: { name: true, email: true } },
      job: { select: { title: true, department: true } },
      decidedBy: { select: { name: true } },
      // As respostas brutas vêm junto porque o selo de confiança e o arquétipo
      // são DERIVADOS, não colunas — ver o comentário na montagem das linhas.
      responses: { select: { itemId: true, value: true, elapsedMs: true } },
      scenarioResponses: { select: { blockId: true, elapsedMs: true } },
    },
  });

  const cabecalho = [
    "Candidato",
    "E-mail",
    "Vaga",
    "Departamento",
    "Respondido em",
    "Duração (min)",
    "Aderência",
    "Confiança",
    "Arquétipo",
    "Parecer",
    "Parecer por",
    "Parecer em",
    "Anotações",
  ];

  const linhas = avaliacoes.map((a) => {
    /**
     * O selo sai de `lerAvaliacao`, e NÃO da coluna `confidence`.
     *
     * A coluna só é preenchida quando a bateria inclui o Mapeamento Baliza. Numa vaga de
     * Big Five + DISC + SJT ela fica nula — e mesmo assim a tela e o PDF
     * mostram o selo, porque os dois o derivam na hora. Lendo a coluna, a
     * planilha sairia com a célula VAZIA para exatamente as pessoas cujo
     * relatório traz "Confiança baixa" escrito, e ninguém entenderia por quê.
     * É a mesma armadilha de `separarPorFaixa`: o que é derivado não se lê de
     * uma cópia gravada, mesmo quando a cópia existe.
     *
     * O ARQUÉTIPO é diferente e continua vindo da coluna: ele não é derivado
     * em lugar nenhum, e a mesma avaliação que não tem a coluna preenchida
     * também não mostra arquétipo na tela nem no PDF. Aqui vazio é a verdade.
     */
    const leitura = lerAvaliacao(a, {
      itens: a.responses,
      blocos: a.scenarioResponses,
    });
    return [
      celula(a.candidate.name),
      celula(a.candidate.email),
      celula(a.job.title),
      celula(a.job.department),
      celula(a.completedAt?.toISOString().slice(0, 10)),
      celula(a.durationMs ? Math.round(a.durationMs / 60000) : null),
      // Vírgula decimal: o número é lido por uma planilha em português, e
      // "58.1" chegaria lá como texto ou como cinquenta e oito mil e cem.
      celula(a.fitScore == null ? null : a.fitScore.toFixed(1).replace(".", ",")),
      celula(leitura.selo?.rotulo),
      celula(a.archetypeId ? ARQUETIPO_POR_ID.get(a.archetypeId)?.nome : null),
      celula(a.decision ? ROTULO_DA_DECISAO[a.decision] : null),
      celula(a.decidedBy?.name),
      celula(a.decidedAt?.toISOString().slice(0, 10)),
      celula(a.decisionNote),
    ].join(";");
  });

  const csv =
    "﻿" + [cabecalho.map(celula).join(";"), ...linhas].join("\r\n");

  await registrarAuditoria({
    categoria: "EXPORT",
    acao: "relatorio_exportado_csv",
    organizationId,
    userId,
    entidade: "Assessment",
    metadados: { periodo, linhas: avaliacoes.length },
  });

  const hoje = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="baliza-respostas-${hoje}.csv"`,
      // Exportação carrega dado pessoal: nada de cache em proxy nenhum.
      "Cache-Control": "no-store",
    },
  });
}
