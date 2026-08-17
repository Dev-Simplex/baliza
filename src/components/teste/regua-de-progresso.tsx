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

        {/* Duas medidas de unidades DIFERENTES, e o rótulo precisa dizer isso.
            A contagem é DESTA etapa; o tempo é do que falta da BATERIA inteira
            (decisão de `fluxo-do-teste.tsx`: a pergunta que faz alguém fechar a
            aba é "quanto falta disso tudo"). Grudadas por um ponto médio, elas
            liam como uma coisa só — "1/12 · cerca de 18 min" sugeria 90
            segundos por bloco de palavras, quando o DISC inteiro custa 6.

            Sem `shrink-0`: ampliado a 175% o rótulo empurrava a página para
            rolagem lateral em TODAS as telas da prova. Agora ele quebra. */}
        <span className="etiqueta min-w-0 text-right">
          <span className="sm:hidden">
            {posicao}/{total}
          </span>
          <span className="hidden sm:inline">
            {posicao} de {total}
          </span>
          {restante && (
            <span className="block text-muted-foreground sm:inline">
              <span className="hidden sm:inline"> · </span>
              {restante} no total
            </span>
          )}
        </span>
      </div>

      <div
        className="flex h-6 items-end gap-px"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={respondidos.size}
        aria-valuetext={`${respondidos.size} de ${total} respondidas nesta etapa${
          restante ? `, e ${restante} para terminar tudo` : ""
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
                  ? "h-6 bg-marca-sinal"
                  : respondido
                    ? "h-3.5 bg-dentro/60"
                    : marcaDeDezena
                      ? "h-2.5 bg-linha-forte/70"
                      : "h-1.5 bg-border",
              )}
            />
          );
        })}
      </div>
    </div>
  );
}
