import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { authConfig } from "@/lib/auth.config";
import { prisma } from "@/lib/prisma";
import { registrarAuditoria } from "@/lib/audit";
import { limitarPorIp } from "@/lib/rate-limit";

const credenciais = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Atrás de proxy (Cloudflare → nginx → aqui), o host que vale é o do
  // `x-forwarded-host`, não o que este processo enxerga. Sem isto o NextAuth
  // monta o callback com `localhost:3300` e o login volta para lugar nenhum.
  // É seguro porque o único caminho até este processo é o proxy: nada chega
  // aqui com um Host inventado por um cliente.
  trustHost: true,
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(entrada) {
        const analise = credenciais.safeParse(entrada);
        if (!analise.success) return null;

        // ─── O limite mora AQUI, e não só na Server Action ──────────────────
        // Estava só em `actions/auth.ts`, e por isso protegia pouco: quem posta
        // direto em `/api/auth/callback/credentials` cai neste `authorize` sem
        // passar pela Action. Reproduzido — dá para logar por esse caminho sem
        // encostar no contador, o que deixava a força bruta de senha SEM TETO
        // justamente no endpoint mais fácil de automatizar.
        //
        // `bcrypt` com custo 10 encarece cada tentativa, mas encarecer não é
        // limitar: quem paraleliza testa dicionário do mesmo jeito.
        //
        // Este é o funil por onde TODO login passa — tela, callback ou qualquer
        // cliente futuro. O da Action continua lá como redundância barata, e
        // porque é ele que consegue devolver mensagem para a tela.
        const limite = await limitarPorIp("login", {
          max: 10,
          janelaSegundos: 300,
        });
        // `null` é o único "não" que o NextAuth entende aqui. De fora fica
        // indistinguível de senha errada — o que também convém: não avisa ao
        // atacante que ele bateu no teto.
        if (!limite.permitido) return null;

        const { email, senha } = analise.data;

        const usuario = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
          include: { organization: { select: { isActive: true } } },
        });

        // Comparação em tempo constante mesmo quando o usuário não existe:
        // sem isso, o tempo de resposta vira um oráculo de e-mails cadastrados.
        const hash =
          usuario?.passwordHash ??
          "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu";
        const confere = await bcrypt.compare(senha, hash);

        if (!usuario || !usuario.passwordHash || !confere) return null;
        if (!usuario.isActive) return null;
        if (usuario.organization && !usuario.organization.isActive) return null;

        await prisma.user.update({
          where: { id: usuario.id },
          data: { lastLoginAt: new Date() },
        });

        await registrarAuditoria({
          categoria: "AUTH",
          acao: "login",
          organizationId: usuario.organizationId,
          userId: usuario.id,
        });

        return {
          id: usuario.id,
          name: usuario.name,
          email: usuario.email,
          image: usuario.image,
          organizationId: usuario.organizationId,
          role: usuario.role,
          isPlatformAdmin: usuario.isPlatformAdmin,
        };
      },
    }),
  ],
});
