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

/**
 * Endereços que são CREDENCIAL: quem tem o endereço responde a prova ou lê o
 * relatório de alguém. As páginas já pedem `noindex` no metadata, mas metadata
 * só existe em resposta HTML — o cabeçalho cobre também o que não passa por
 * lá. Buscador que indexa `/r/…` transforma um link pessoal em resultado de
 * busca pelo nome da pessoa.
 */
const NAO_INDEXAR = ["/r/", "/t/", "/vaga/", "/acesso"];

export default auth((req) => {
  const { nextUrl } = req;
  const usuario = req.auth?.user;
  const logado = Boolean(usuario);
  const caminho = nextUrl.pathname;

  // Sessão sem empresa é sessão pela metade: ela atravessa o middleware e
  // morre no primeiro `exigirTenant()`. Tratá-la como deslogada é o que evita
  // o laço — o painel manda pro login, o login vê alguém "logado" e manda de
  // volta pro painel. Operador da plataforma não tem empresa de propósito.
  const semEmpresa =
    logado && !usuario?.organizationId && !usuario?.isPlatformAdmin;

  const ehPrivada = PRIVADAS.some(
    (p) => caminho === p || caminho.startsWith(`${p}/`),
  );

  if (ehPrivada && (!logado || semEmpresa)) {
    const destino = new URL("/entrar", nextUrl);
    // Preserva para onde a pessoa queria ir, para devolver depois do login.
    destino.searchParams.set("proximo", caminho);
    if (semEmpresa) destino.searchParams.set("erro", "sem-empresa");
    return NextResponse.redirect(destino);
  }

  if (logado && !semEmpresa && SO_DESLOGADO.includes(caminho)) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // O painel administrativo é da plataforma, não da empresa.
  if (caminho.startsWith("/admin") && logado && !usuario?.isPlatformAdmin) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  const resposta = NextResponse.next();
  if (NAO_INDEXAR.some((p) => caminho === p || caminho.startsWith(p))) {
    resposta.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }
  return resposta;
});

export const config = {
  matcher: [
    // Tudo, menos estáticos, imagens e as rotas do próprio NextAuth.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
