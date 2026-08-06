"use client";

import { Check } from "lucide-react";

import type { Teste } from "@/lib/instrument/baterias";
import { cn } from "@/lib/utils";

/**
 * A trilha dos testes da bateria — onde estou e quanto ainda vem.
 *
 * Uma régua de progresso responde "quantas perguntas faltam nesta tela de
 * perguntas". Ela não responde a que decide se a pessoa continua: "isso aqui
 * acaba quando?". Numa bateria de três testes, terminar o primeiro sem saber
 * que existem outros dois é a forma mais cara de perder alguém — prova
 * incompleta não vira relatório, e a pessoa já tinha respondido de verdade.
 *
 * Some com um teste só: aí a trilha seria um selo decorativo dizendo o que a
 * linha de baixo já diz.
 */
export function TrilhaDeEtapas({
  etapas,
  atual,
  concluidas,
}: {
  etapas: Array<{ teste: Teste; curto: string }>;
  atual: number;
  concluidas: boolean[];
}) {
  if (etapas.length <= 1) return null;

  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {etapas.map((etapa, i) => {
        const aqui = i === atual;
        const feita = concluidas[i];

        return (
          <li key={etapa.teste}>
            <span
              aria-current={aqui ? "step" : undefined}
              className={cn(
                "flex items-center gap-1 rounded-full border px-2.5 py-1 t-legenda transition-colors",
                aqui && "border-marca bg-marca-forte/10 font-medium text-foreground",
                !aqui && feita && "border-dentro/40 bg-dentro/5 text-muted-foreground",
                !aqui && !feita && "border-dashed text-muted-foreground",
              )}
            >
              {feita && !aqui && (
                <Check className="size-3 text-dentro" aria-hidden />
              )}
              {etapa.curto}
              <span className="sr-only">
                {feita
                  ? " — respondido"
                  : aqui
                    ? " — respondendo agora"
                    : " — ainda vem"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
