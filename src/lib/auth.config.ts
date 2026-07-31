import type { NextAuthConfig } from "next-auth";

/**
 * Configuração compartilhada — precisa rodar no Edge (middleware), então NÃO
 * pode importar Prisma, bcrypt nem nada de Node. Os provedores de verdade são
 * adicionados em `auth.ts`, que roda só no runtime Node.
 */
export const authConfig = {
  pages: {
    signIn: "/entrar",
    error: "/entrar",
  },
  session: {
    // Credenciais exigem JWT: a sessão de banco do adapter não é acionada por
    // login com senha. E JWT é o que o briefing pede.
    strategy: "jwt",
    maxAge: 60 * 60 * 8, // 8 horas
  },
  callbacks: {
    // O token carrega o tenant. É daqui que sai TODO o escopo de dados —
    // por isso ele nunca é lido do cliente nem de query string.
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.organizationId = user.organizationId ?? null;
        token.role = user.role;
        token.isPlatformAdmin = user.isPlatformAdmin ?? false;
      }
      // Atualização de sessão sem novo login (ex.: trocou de plano/papel).
      if (trigger === "update" && session?.organizationId) {
        token.organizationId = session.organizationId as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.organizationId = (token.organizationId as string) ?? null;
        session.user.role = token.role as typeof session.user.role;
        session.user.isPlatformAdmin = Boolean(token.isPlatformAdmin);
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
