"use client";

import { cn } from "@/lib/utils";

/**
 * Progresso como régua de calibração, não como barra.
 *
 * Uma barra preenchida diz "quanto falta" de forma vaga. A régua mostra cada
 * item como um traço: dá pra ver exatamente quantos faltam, quais já foram
 * respondidos e onde você está. É o mesmo vocabulário do medidor — marcas de
 * instrumento — aplicado ao tempo em vez de à escala.
 *
 * O rótulo do lado direito carrega DUAS medidas de propósito. "23 de 39" diz
 * onde a pessoa está; "cerca de 3 min" responde a pergunta que decide se ela
 * continua agora ou fecha a aba. Mesmo em 39 telas, a segunda é a que segura.
 */
export function ReguaDeProgresso({
  total,
  atual,
  respondidos,
  etapa,
  etapaCurta,
  restante,
}: {
  total: number;
  atual: number;
  respondidos: Set<number>;
  etapa: string;
  /** Versão que cabe no celular ao lado da contagem. */
  etapaCurta: string;
  /** Estimativa do que falta, já formatada. Null perto do fim. */
  restante: string | null;
}) {
  const posicao = Math.min(atual + 1, total);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="etiqueta truncate">
          <span className="sm:hidden">{etapaCurta}</span>
          <span className="hidden sm:inline">{etapa}</span>
        </span>

        <span className="etiqueta shrink-0">
          <span className="sm:hidden">
            {posicao}/{total}
          </span>
          <span className="hidden sm:inline">
            {posicao} de {total}
          </span>
          {restante && (
            <>
              {" · "}
              <span className="text-muted-foreground">{restante}</span>
            </>
          )}
        </span>
      </div>

      <div
        className="flex h-6 items-end gap-px"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={respondidos.size}
        aria-valuetext={`${respondidos.size} de ${total} respondidas${
          restante ? `, falta ${restante}` : ""
        }`}
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
                  ? "h-6 bg-marca-forte"
                  : respondido
                    ? "h-3.5 bg-dentro/70"
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
