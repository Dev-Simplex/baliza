import type { Metadata } from "next";

import { Marca } from "@/components/marca";
import { BotaoLink } from "@/components/ui/botao-link";

export const metadata: Metadata = { title: "Página não encontrada" };

export default function NaoEncontrado() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6">
      <Marca href="/" />

      <p className="etiqueta mt-12">Erro 404</p>
      <h1 className="t-titulo mt-3">Esta página não existe.</h1>
      <p className="t-corpo mt-3 text-muted-foreground">
        O endereço pode ter mudado, ou o link que trouxe você até aqui está
        desatualizado.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <BotaoLink href="/dashboard">Ir para o painel</BotaoLink>
        <BotaoLink href="/" variant="outline">
          Voltar ao início
        </BotaoLink>
      </div>
    </main>
  );
}
