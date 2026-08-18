import "dotenv/config";
import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

/**
 * Cria ou promove um operador da plataforma — o "super admin".
 *
 * ─── Por que um script, e não uma tela ─────────────────────────────────────
 * Operador da plataforma vive FORA do escopo de empresa (`organizationId`
 * nulo) e enxerga todas as contas no painel `/admin`. Não existe, e não deve
 * existir, uma tela dentro do produto que conceda isso: quem administra uma
 * empresa não pode alcançar as outras, e um botão "virar super admin" em
 * qualquer lugar do painel seria exatamente esse caminho. Então a concessão
 * mora onde só quem tem acesso ao servidor chega.
 *
 * ─── Uso ───────────────────────────────────────────────────────────────────
 *   pnpm exec tsx prisma/super-admin.ts <e-mail> [nome]
 *
 * A senha NÃO é argumento de linha de comando de propósito: argumento fica no
 * histórico do shell e na lista de processos, visível para qualquer outro
 * usuário da máquina. Ela vem por variável de ambiente:
 *
 *   SENHA='...' pnpm exec tsx prisma/super-admin.ts ops@baliza.app "Operação"
 *
 * Sem `SENHA`, o script gera uma forte e imprime UMA vez. Não há como
 * recuperá-la depois — o banco guarda só o hash bcrypt.
 *
 * Rodar de novo no mesmo e-mail redefine a senha e mantém o resto. É a forma
 * de destravar um acesso perdido.
 */

// Envolvido em `main()`, e não escrito no corpo do módulo, pelo mesmo motivo do
// `seed.ts`: o `tsx` compila para CJS aqui, e `await` de topo não existe lá.
const [, , email, ...restoDoNome] = process.argv;

/**
 * Alfabeto sem `l`, `1`, `O` e `0`.
 *
 * Esta senha vai ser lida de um terminal e digitada à mão pelo menos uma vez.
 * Um `l` confundido com `1` vira "a senha não funciona", e a pessoa reinstala
 * meio ambiente atrás de um problema que é de fonte tipográfica.
 */
const ALFABETO = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function gerarSenha(tamanho = 20) {
  const bytes = crypto.getRandomValues(new Uint8Array(tamanho));
  return Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("");
}

async function main() {
  if (!email || !email.includes("@")) {
    console.error(
      "Uso: pnpm exec tsx prisma/super-admin.ts <e-mail> [nome]\n" +
        "     SENHA='...' pnpm exec tsx prisma/super-admin.ts <e-mail> [nome]",
    );
    process.exit(1);
  }

  const senhaInformada = process.env.SENHA?.trim();

  if (senhaInformada && senhaInformada.length < 12) {
    console.error("A senha precisa de pelo menos 12 caracteres.");
    process.exit(1);
  }

  const senha = senhaInformada || gerarSenha();
  const nome = restoDoNome.join(" ").trim() || "Operação da plataforma";
  const normalizado = email.toLowerCase().trim();

  const existente = await prisma.user.findUnique({
    where: { email: normalizado },
    select: { id: true },
  });

  /*
   * `organizationId` NÃO é apagado de quem já pertence a uma empresa.
   *
   * Zerar o vínculo faria a pessoa perder o painel da empresa dela — e
   * `exigirTenant()` manda todo usuário sem empresa direto para `/admin`. Quem
   * já tinha conta de empresa vira operador COM as duas portas; quem é criado
   * aqui nasce só com a de operador.
   */
  const usuario = await prisma.user.upsert({
    where: { email: normalizado },
    update: {
      passwordHash: await bcrypt.hash(senha, 10),
      isPlatformAdmin: true,
      isActive: true,
    },
    create: {
      email: normalizado,
      name: nome,
      passwordHash: await bcrypt.hash(senha, 10),
      role: "OWNER",
      isPlatformAdmin: true,
      isActive: true,
    },
    select: { id: true, email: true, name: true, organizationId: true },
  });

  console.log("");
  console.log(existente ? "Acesso atualizado." : "Operador criado.");
  console.log("  e-mail:", usuario.email);
  console.log("  senha :", senha);
  console.log(
    "  painel:",
    usuario.organizationId
      ? "/admin e o painel da empresa"
      : "/admin (sem empresa vinculada, é o esperado para operador)",
  );
  console.log("");
  console.log("Anote a senha agora: o banco guarda só o hash, e ela não");
  console.log("aparece de novo. Troque-a depois do primeiro acesso.");

  await prisma.$disconnect();
}

main().catch(async (erro) => {
  console.error(erro);
  await prisma.$disconnect();
  process.exit(1);
});
