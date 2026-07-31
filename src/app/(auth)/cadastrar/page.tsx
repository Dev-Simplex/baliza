import type { Metadata } from "next";
import Link from "next/link";

import { FormularioDeCadastro } from "./formulario";

export const metadata: Metadata = { title: "Criar conta" };

export default function PaginaDeCadastro() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Duas vagas e 30 respostas por mês, sem cartão. Leva um minuto.
      </p>

      <FormularioDeCadastro />

      <p className="mt-8 text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/entrar"
          className="font-medium text-foreground underline underline-offset-4 hover:text-n-brass"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
