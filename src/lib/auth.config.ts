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
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.organizationId = user.organizationId ?? null;
        token.role = user.role;
        token.isPlatformAdmin = user.isPlatformAdmin ?? false;
      }
      // ─── Por que NÃO existe mais um ramo `trigger === "update"` aqui ───────
      // Existia, e ele copiava `session.organizationId` para dentro do token
      // "para atualizar a sessão sem novo login". Só que esse `session` é o
      // corpo que o CLIENTE manda no POST /api/auth/session — não é o servidor
      // falando com ele mesmo.
      //
      // Reproduzido: logado como recrutador@acme.com, um POST com o id de outra
      // empresa fazia /candidatos listar os candidatos DELA. O tenant inteiro
      // trocava, e com ele todo o escopo de dados — porque é deste token que
      // sai o `organizationId` que vai no WHERE de cada consulta.
      //
      // Nenhuma tela do produto chamava `update()` com organizationId, então o
      // ramo era superfície de ataque sem nenhum consumidor legítimo. Se algum
      // dia for preciso trocar de empresa sem relogar, o caminho é o servidor
      // reler o vínculo do banco — nunca aceitar o que veio do navegador.
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
