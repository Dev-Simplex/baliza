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
  // Mesmo laço da mensagem acima, por outra porta: quem teve o acesso desligado
  // enquanto estava logado é devolvido para cá, e sem explicação tentaria a
  // senha certa de novo achando que errou.
  "conta-inativa":
    "Seu acesso a esta empresa foi desligado, então o painel não abre — e entrar de novo não resolve. Fale com quem administra a conta para religar.",
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
      <h1 className="t-secao text-2xl">Entrar</h1>
      <p className="mt-2 t-corpo-sm text-muted-foreground">
        Acesse o painel da sua empresa.
      </p>

      {explicacao && (
        <p
          role="status"
          className="mt-5 flex items-start gap-2 rounded-lg border border-fora/30 bg-fora-suave px-3 py-2.5 text-sm leading-relaxed text-fora"
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
