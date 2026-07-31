"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock, Loader2, Lock, Save } from "lucide-react";

import { Marca } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { iniciarAvaliacao } from "@/lib/actions/avaliacao";

/**
 * Tela de abertura.
 *
 * O candidato precisa de três informações antes de começar, e nenhuma delas é
 * marketing: quanto tempo leva, o que acontece com a resposta dele, e que não
 * existe resposta certa. Tudo o mais é ruído entre a pessoa e a primeira
 * pergunta.
 */
export function TelaDeAbertura({
  token,
  empresa,
  vaga,
  nome,
  totalDeItens,
  totalDeCenarios,
}: {
  token: string;
  empresa: string;
  vaga: string;
  nome: string | null;
  totalDeItens: number;
  totalDeCenarios: number;
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();

  const minutos = Math.max(
    6,
    Math.round((totalDeItens * 6 + totalDeCenarios * 25) / 60),
  );

  function comecar() {
    iniciarTransicao(async () => {
      await iniciarAvaliacao(token);
      router.refresh();
    });
  }

  return (
    <div className="mx-auto flex min-h-svh max-w-lg flex-col px-6 py-8">
      <header>
        <Marca href={null} />
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <p className="etiqueta">
          {empresa} · {vaga}
        </p>

        <h1 className="mt-4 text-balance text-[30px] leading-[1.18] font-semibold tracking-tight">
          {nome ? `${nome.split(" ")[0]}, vamos` : "Vamos"} mapear como você
          trabalha.
        </h1>

        <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
          Não é prova e não existe resposta certa. São afirmações sobre o dia a
          dia de trabalho, e a única resposta útil é a sincera — inclusive para
          você, porque no fim você recebe seu próprio resultado.
        </p>

        <ul className="mt-8 space-y-3.5">
          <Linha Icone={Clock} titulo={`Cerca de ${minutos} minutos`}>
            {totalDeItens} afirmações rápidas e {totalDeCenarios} situações de
            trabalho.
          </Linha>
          <Linha Icone={Save} titulo="Salva sozinho">
            Pode fechar e continuar depois pelo mesmo link, de onde parou.
          </Linha>
          <Linha Icone={Lock} titulo="Você recebe o resultado">
            O seu relatório fica disponível para você, sem depender da empresa
            liberar.
          </Linha>
        </ul>

        <Button
          onClick={comecar}
          disabled={pendente}
          size="lg"
          className="mt-9 h-11 w-full gap-2 text-[15px]"
        >
          {pendente ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Preparando
            </>
          ) : (
            <>
              Começar
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </main>

      <footer className="text-[11.5px] leading-relaxed text-muted-foreground">
        Este é um questionário de autopercepção de comportamento no trabalho. Não
        é teste psicológico nem avaliação psicológica, e o resultado é um insumo
        para a conversa — não uma decisão automática.
      </footer>
    </div>
  );
}

function Linha({
  Icone,
  titulo,
  children,
}: {
  Icone: React.ComponentType<{ className?: string }>;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-secondary">
        <Icone className="size-4 text-n-brass" />
      </span>
      <div>
        <p className="text-[14px] font-medium">{titulo}</p>
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {children}
        </p>
      </div>
    </li>
  );
}
