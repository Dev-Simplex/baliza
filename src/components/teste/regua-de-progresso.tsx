"use client";

import { cn } from "@/lib/utils";

/**
 * Progresso como régua de calibração, não como barra.
 *
 * Uma barra preenchida diz "quanto falta" de forma vaga. A régua mostra cada
 * item como um traço: dá pra ver exatamente quantos faltam, quais já foram
 * respondidos e onde você está. É o mesmo vocabulário do medidor — marcas de
 * instrumento — aplicado ao tempo em vez de à escala.
 */
export function ReguaDeProgresso({
  total,
  atual,
  respondidos,
  etapa,
}: {
  total: number;
  atual: number;
  respondidos: Set<number>;
  etapa: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="etiqueta">{etapa}</span>
        <span className="etiqueta">
          {Math.min(atual + 1, total)} de {total}
        </span>
      </div>

      <div
        className="flex h-6 items-end gap-px"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={respondidos.size}
        aria-label={`${respondidos.size} de ${total} respondidas`}
      >
        {Array.from({ length: total }, (_, i) => {
          const respondido = respondidos.has(i);
          const aqui = i === atual;
          // A cada 10 traços, um mais alto — a marca de dezena da régua.
          const marcaDeDezena = i % 10 === 0;

          return (
            <span
              key={i}
              className={cn(
                "flex-1 rounded-full transition-all duration-300",
                aqui
                  ? "h-6 bg-n-brass"
                  : respondido
                    ? "h-3.5 bg-n-teal/70"
                    : marcaDeDezena
                      ? "h-3 bg-border"
                      : "h-2 bg-border/60",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
