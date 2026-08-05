/**
 * Troca o endereço público das vagas antigas (`cuid`) por um legível.
 *
 * ⚠️ ISTO INVALIDA LINKS JÁ DISTRIBUÍDOS. Quem tiver o endereço antigo colado
 * num anúncio, num e-mail ou num QR impresso vai receber "vaga não encontrada".
 * Rode em base de demonstração à vontade; em base com processo em andamento,
 * só com decisão consciente — e de preferência em vaga por vaga.
 *
 * Uso:
 *   pnpm exec tsx prisma/tornar-links-legiveis.ts            # mostra o que faria
 *   pnpm exec tsx prisma/tornar-links-legiveis.ts --aplicar  # aplica
 */
import { prisma } from "../src/lib/prisma";
import { gerarTokenDeVaga } from "../src/lib/token-de-vaga";

const APLICAR = process.argv.includes("--aplicar");

/** `cuid` tem 25 caracteres, começa com "c" e não tem hífen. */
function pareceCuid(token: string) {
  return /^c[a-z0-9]{20,30}$/.test(token) && !token.includes("-");
}

async function main() {
  const vagas = await prisma.job.findMany({
    select: { id: true, title: true, publicToken: true },
    orderBy: { createdAt: "asc" },
  });

  const alvos = vagas.filter((v) => pareceCuid(v.publicToken));

  if (alvos.length === 0) {
    console.log("Nenhuma vaga com endereço antigo. Nada a fazer.");
    return;
  }

  console.log(
    `${alvos.length} de ${vagas.length} vagas com endereço antigo${APLICAR ? "" : "  (simulação — use --aplicar)"}\n`,
  );

  for (const vaga of alvos) {
    let novo = gerarTokenDeVaga(vaga.title);

    if (APLICAR) {
      // `publicToken` é UNIQUE: colisão vira erro, e a saída é outro sorteio.
      for (let tentativa = 0; tentativa < 5; tentativa += 1) {
        try {
          await prisma.job.update({
            where: { id: vaga.id },
            data: { publicToken: novo },
          });
          break;
        } catch (erro) {
          const colidiu =
            typeof erro === "object" &&
            erro !== null &&
            "code" in erro &&
            (erro as { code?: string }).code === "P2002";
          if (!colidiu) throw erro;
          novo = gerarTokenDeVaga(vaga.title);
        }
      }
    }

    console.log(`  ${vaga.title}`);
    console.log(`    ${vaga.publicToken}  ->  ${novo}`);
  }

  if (!APLICAR) console.log("\nNada foi alterado. Rode com --aplicar para valer.");
}

main().finally(() => prisma.$disconnect());
