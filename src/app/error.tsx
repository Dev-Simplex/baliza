"use client";

import { useEffect } from "react";
import { RotateCw } from "lucide-react";

import { Marca } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { BotaoLink } from "@/components/ui/botao-link";

/**
 * Fronteira de erro.
 *
 * O texto explica o que aconteceu e oferece a saída, sem pedir desculpas e sem
 * jargão. `digest` é o identificador que o Next gera para o erro no servidor —
 * é o que torna um chamado de suporte resolvível, então ele fica visível.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[erro de rota]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6">
      <Marca href="/" />

      <p className="etiqueta mt-12">Algo saiu de prumo</p>
      <h1 className="t-titulo mt-3">Esta tela não carregou.</h1>
      <p className="t-corpo mt-3 text-muted-foreground">
        A falha foi registrada. Tentar de novo costuma resolver — se insistir,
        o código abaixo identifica exatamente o que aconteceu.
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button onClick={reset} className="gap-2">
          <RotateCw className="size-4" />
          Tentar de novo
        </Button>
        <BotaoLink href="/dashboard" variant="outline">
          Ir para o painel
        </BotaoLink>
      </div>

      {error.digest && (
        <p className="leitura mt-8 text-xs text-muted-foreground">
          código {error.digest}
        </p>
      )}
    </main>
  );
}
