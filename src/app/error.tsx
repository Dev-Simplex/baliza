"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { RotateCw } from "lucide-react";

import { Marca } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { BotaoLink } from "@/components/ui/botao-link";

/** Rotas onde quem está do outro lado é o candidato, não o cliente. */
const DO_CANDIDATO = ["/t/", "/vaga/", "/acesso"];

/**
 * Fronteira de erro.
 *
 * O texto explica o que aconteceu e oferece a saída, sem pedir desculpas e sem
 * jargão. `digest` é o identificador que o Next gera para o erro no servidor —
 * é o que torna um chamado de suporte resolvível, então ele fica visível.
 *
 * A segunda saída depende de QUEM quebrou. Esta fronteira é a raiz: pega tanto
 * o painel quanto a prova do candidato. Oferecer "Ir para o painel" a quem está
 * respondendo o questionário mandava a pessoa para um login que ela não tem —
 * uma saída que fecha a porta em vez de abrir. Para ela, o caminho de volta é o
 * link que ela já tem na mão, então o botão sai da tela: um botão a menos é
 * melhor que um botão que engana.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const caminho = usePathname();
  const ehCandidato = DO_CANDIDATO.some((r) => caminho?.startsWith(r));

  useEffect(() => {
    console.error("[erro de rota]", error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6">
      <Marca href={ehCandidato ? null : "/"} />

      <p className="etiqueta mt-12">Algo saiu de prumo</p>
      <h1 className="t-titulo mt-3">Esta tela não carregou.</h1>
      <p className="t-corpo mt-3 text-muted-foreground">
        {ehCandidato
          ? "Nada do que você respondeu se perdeu — as respostas são salvas a cada clique. Tentar de novo costuma resolver, e você também pode fechar e voltar depois pelo mesmo link."
          : "A falha foi registrada. Tentar de novo costuma resolver — se insistir, o código abaixo identifica exatamente o que aconteceu."}
      </p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button onClick={reset} className="gap-2">
          <RotateCw className="size-4" />
          Tentar de novo
        </Button>
        {!ehCandidato && (
          <BotaoLink href="/dashboard" variant="outline">
            Ir para o painel
          </BotaoLink>
        )}
      </div>

      {error.digest && (
        <p className="leitura mt-8 text-xs text-muted-foreground">
          código {error.digest}
        </p>
      )}
    </main>
  );
}
