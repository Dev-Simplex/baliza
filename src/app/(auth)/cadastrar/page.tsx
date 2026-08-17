import type { Metadata } from "next";
import Link from "next/link";

import { FormularioDeCadastro } from "./formulario";

export const metadata: Metadata = { title: "Criar conta" };

export default function PaginaDeCadastro() {
  return (
    <div>
      <h1 className="t-secao text-2xl">Criar conta</h1>
      {/* A camada comercial saiu do produto, mas a promessa de plano ficou
          aqui: a tela prometia um teto de "duas vagas e 30 respostas por mês"
          que não existe em lugar nenhum do código — nem como limite, nem como
          cobrança depois. Prometer menos do que se entrega ainda é prometer
          errado, e o candidato a cliente conta as vagas antes de criar a conta. */}
      <p className="mt-2 t-corpo-sm text-muted-foreground">
        Sem cartão e sem limite de vagas ou de respostas. Leva um minuto.
      </p>

      <FormularioDeCadastro />

      <p className="mt-8 text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link
          href="/entrar"
          className="font-medium text-foreground underline underline-offset-4 hover:text-marca"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}
