import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

/** Prefixos que exigem sessão. Todo o resto é público por definição. */
const PRIVADAS = [
  "/dashboard",
  "/vagas",
  "/candidatos",
  "/relatorios",
  "/configuracoes",
  "/admin",
];

/** Rotas que um usuário já autenticado não deveria mais ver. */
const SO_DESLOGADO = ["/entrar", "/cadastrar"];

export default auth((req) => {
  const { nextUrl } = req;
  const logado = Boolean(req.auth?.user);
  const caminho = nextUrl.pathname;

  const ehPrivada = PRIVADAS.some(
    (p) => caminho === p || caminho.startsWith(`${p}/`),
  );

  if (ehPrivada && !logado) {
    const destino = new URL("/entrar", nextUrl);
    // Preserva para onde a pessoa queria ir, para devolver depois do login.
    destino.searchParams.set("proximo", caminho);
    return NextResponse.redirect(destino);
  }

  if (logado && SO_DESLOGADO.includes(caminho)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // O painel administrativo é da plataforma, não da empresa.
  if (caminho.startsWith("/admin") && logado && !req.auth?.user?.isPlatformAdmin) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Tudo, menos estáticos, imagens e as rotas do próprio NextAuth.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
