import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// O Prisma 7 conecta por driver adapter — o engine binário saiu do caminho
// padrão. A URL vem explicitamente do ambiente: no runtime da aplicação o
// client não lê mais o .env sozinho (só o CLI faz isso, via prisma.config.ts).
const criarCliente = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
};

const global_ = globalThis as unknown as {
  prisma: ReturnType<typeof criarCliente> | undefined;
};

// Em desenvolvimento o hot reload recria o módulo a cada mudança; sem o cache
// global cada recarga abre um pool novo e o Postgres estoura o limite de conexões.
export const prisma = global_.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") global_.prisma = prisma;
