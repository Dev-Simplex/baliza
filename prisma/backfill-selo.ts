/**
 * Preenche `confidence` nas avaliações que a escrita antiga deixou sem selo.
 *
 * A aderência nunca pode aparecer sem o selo (§4.4), e `concluirAvaliacao`
 * gravava só o selo do Mapeamento Baliza — bateria de Big Five terminava com número e
 * coluna vazia. A causa já está corrigida na escrita; isto é para o que ficou
 * gravado antes.
 *
 * Idempotente: só toca em quem está com a coluna nula, e deriva com a MESMA
 * função que a tela usa. Simula por padrão; grava só com --aplicar.
 */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { lerAvaliacao } from "../src/lib/analise/modulos";
import type { PerfilAlvo } from "../src/lib/instrument/types";

const aplicar = process.argv.includes("--aplicar");

async function principal() {
  const alvos = await prisma.assessment.findMany({
  where: { status: "COMPLETED" },
  include: {
    job: { select: { targetProfile: true } },
    responses: { select: { itemId: true, value: true, elapsedMs: true } },
    scenarioResponses: { select: { blockId: true, elapsedMs: true } },
    candidate: { select: { name: true } },
  },
});

let mexidas = 0;
for (const a of alvos) {
  if (a.confidence !== null) continue;
  const leitura = lerAvaliacao(
    a,
    { itens: a.responses, blocos: a.scenarioResponses },
    a.job.targetProfile as unknown as PerfilAlvo | null,
  );
  if (!leitura.selo) {
    console.log(`  · ${a.candidate.name}: sem selo derivável (bateria sem os cinco fatores) — segue nulo, e o número também não aparece`);
    continue;
  }
  mexidas++;
  console.log(`  ${aplicar ? "GRAVANDO " : "simularia"} ${a.candidate.name}: selo "${leitura.selo.rotulo}"`);
  if (aplicar)
    await prisma.assessment.update({
      where: { id: a.id },
      data: { confidence: leitura.selo as never },
    });
}
console.log(`\n${mexidas} avaliação(ões) ${aplicar ? "atualizada(s)" : "seriam atualizadas"}.`);
  await prisma.$disconnect();
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
