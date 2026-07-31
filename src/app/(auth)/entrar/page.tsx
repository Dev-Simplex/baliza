import type { Metadata } from "next";
import Link from "next/link";

import { FormularioDeLogin } from "./formulario";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaDeLogin({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const { proximo } = await searchParams;

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Acesse o painel da sua empresa.
      </p>

      <FormularioDeLogin proximo={proximo} />

      <p className="mt-8 text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastrar"
          className="font-medium text-foreground underline underline-offset-4 hover:text-n-brass"
        >
          Criar conta grátis
        </Link>
      </p>
    </div>
  );
}
