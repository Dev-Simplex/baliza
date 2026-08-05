"use client";

import { Printer } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * O jeito de levar o resultado embora.
 *
 * Não existe geração de PDF aqui, e não precisa existir: o diálogo de impressão
 * do navegador salva em PDF em qualquer sistema e em qualquer celular, sem
 * servidor, sem espera e sem uma segunda versão do documento para manter em pé.
 * O rótulo fala do resultado ("salvar"), não do mecanismo ("imprimir"), porque
 * quase ninguém quer papel.
 */
export function BotaoSalvarResultado() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 print:hidden"
      onClick={() => window.print()}
    >
      <Printer className="size-3.5" />
      Salvar em PDF
    </Button>
  );
}
