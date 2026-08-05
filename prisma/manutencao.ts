/**
 * Manutenção periódica. É o "job que não existia" do README.
 *
 * Três rotinas, todas idempotentes e todas seguras de repetir:
 *
 *   1. EXPURGO POR RETENÇÃO — apaga a resposta bruta das avaliações que
 *      passaram do prazo de cada empresa e carimba `purgedAt`. É a promessa
 *      que o rodapé do relatório do candidato faz ("depois são apagadas") e
 *      que nada cumpria. O resultado consolidado fica: a regra nº 7 diz que o
 *      link do candidato continua funcionando. Ver `src/lib/retencao.ts`.
 *   2. DEVOLUÇÃO DE CÓDIGOS — solta o código de 4 dígitos de convite vencido.
 *      Sem isso o acervo de 10.000 seca e candidato novo fica sem código.
 *   3. FAXINA DOS CONTADORES — contador de limite de taxa de mais de 24h.
 *
 * Uso:
 *   pnpm exec tsx prisma/manutencao.ts             # mostra o que faria
 *   pnpm exec tsx prisma/manutencao.ts --aplicar   # aplica
 *
 * No servidor, uma vez por dia é de sobra — retenção se mede em meses:
 *   0 4 * * *  cd /caminho/do/prumo && pnpm exec tsx prisma/manutencao.ts --aplicar
 *
 * O padrão é SIMULAR, e não aplicar, porque a rotina 1 apaga dado de pessoa:
 * quem roda tem que poder olhar a conta antes de ela acontecer.
 */
import "dotenv/config";

import { prisma } from "../src/lib/prisma";
import { limparContadoresAntigos } from "../src/lib/rate-limit";
import { devolverCodigosVencidos, expurgarPorRetencao } from "../src/lib/retencao";

const APLICAR = process.argv.includes("--aplicar");

async function main() {
  console.log(
    APLICAR
      ? "Manutenção — APLICANDO"
      : "Manutenção — simulação (use --aplicar para valer)",
  );

  console.log("\n→ expurgo por retenção");
  const expurgo = await expurgarPorRetencao({ simular: !APLICAR });

  if (expurgo.avaliacoes === 0) {
    console.log("  nada vencido.");
  } else {
    for (const linha of expurgo.porEmpresa) {
      console.log(
        `  ${linha.organizacao}: ${linha.avaliacoes} avaliação(ões) anteriores a ${linha.corte.toLocaleDateString("pt-BR")} (retenção de ${linha.retencaoEmMeses} meses)`,
      );
    }
    console.log(
      `  total: ${expurgo.avaliacoes} avaliação(ões), ${expurgo.respostas} resposta(s) e ${expurgo.cenarios} cenário(s)`,
    );
  }

  console.log("\n→ devolução de códigos de convite vencido");
  if (APLICAR) {
    console.log(`  ${await devolverCodigosVencidos()} código(s) devolvido(s)`);
  } else {
    const presos = await prisma.invitation.count({
      where: {
        accessCode: { not: null },
        expiresAt: { lt: new Date() },
        status: { notIn: ["COMPLETED"] },
      },
    });
    console.log(`  ${presos} código(s) preso(s) em convite vencido`);
  }

  console.log("\n→ faxina dos contadores de limite de taxa");
  if (APLICAR) {
    console.log(`  ${await limparContadoresAntigos()} contador(es) removido(s)`);
  } else {
    const antigos = await prisma.rateLimitCounter.count({
      where: { windowStart: { lt: new Date(Date.now() - 24 * 3600 * 1000) } },
    });
    console.log(`  ${antigos} contador(es) vencido(s)`);
  }

  console.log(
    APLICAR ? "\nPronto." : "\nNada foi alterado. Rode com --aplicar.",
  );
}

main()
  .catch((erro) => {
    console.error(erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
