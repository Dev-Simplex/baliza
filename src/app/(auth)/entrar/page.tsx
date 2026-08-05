import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";

import { FormularioDeLogin } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Explicações para `?erro=`.
 *
 * `proxy.ts` e `exigirTenant()` mandam a pessoa para cá com o motivo na URL, e
 * a página descartava o parâmetro em silêncio: quem tinha sessão válida mas
 * nenhuma empresa era devolvido a uma tela de login idêntica à normal, digitava
 * a mesma senha (certa) e voltava para o mesmo lugar. O laço parece problema de
 * senha e não é — nenhuma tentativa de login resolveria.
 */
const EXPLICACAO: Record<string, string> = {
  "sem-empresa":
    "Sua conta existe, mas não está ligada a nenhuma empresa — é por isso que o painel não abre, e entrar de novo não resolve. Use uma conta que já tenha empresa, ou crie a sua: o cadastro cria as duas coisas juntas.",
};

export default async function PaginaDeLogin({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>;
}) {
  const { proximo, erro } = await searchParams;
  const explicacao = erro ? EXPLICACAO[erro] : undefined;

  return (
    <div>
      <h1 className="t-titulo">Entrar</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Acesse o painel da sua empresa.
      </p>

      {explicacao && (
        <p
          role="status"
          className="mt-4 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-sm leading-relaxed text-amber-700 dark:text-amber-400"
        >
          <Info className="mt-0.5 size-4 shrink-0" />
          {explicacao}
        </p>
      )}

      <FormularioDeLogin proximo={proximo} />

      <p className="mt-8 text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastrar"
          className="font-medium text-foreground underline underline-offset-4 hover:text-marca"
        >
          Criar conta
        </Link>
      </p>
    </div>
  );
}
