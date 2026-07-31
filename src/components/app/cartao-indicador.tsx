import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Cartão de indicador.
 *
 * O número usa a fonte de leitura (tabular) e o rótulo usa a etiqueta gravada.
 * A variação só aparece quando existe base de comparação — "+0%" sobre nada é
 * ruído que parece informação.
 */
export function CartaoIndicador({
  rotulo,
  valor,
  unidade,
  apoio,
  variacao,
  destaque = false,
}: {
  rotulo: string;
  valor: string | number;
  unidade?: string;
  apoio?: string;
  variacao?: { atual: number; anterior: number } | null;
  destaque?: boolean;
}) {
  const delta =
    variacao && variacao.anterior > 0
      ? Math.round(
          ((variacao.atual - variacao.anterior) / variacao.anterior) * 100,
        )
      : null;

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4",
        destaque && "border-n-brass/35 bg-n-brass/[0.04]",
      )}
    >
      <p className="etiqueta">{rotulo}</p>

      <div className="mt-2.5 flex items-baseline gap-1.5">
        <span
          className={cn(
            "leitura text-[26px] leading-none font-semibold",
            destaque && "text-n-brass",
          )}
        >
          {valor}
        </span>
        {unidade && (
          <span className="text-sm text-muted-foreground">{unidade}</span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {delta !== null && delta !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              delta > 0 ? "text-n-teal" : "text-n-clay",
            )}
          >
            {delta > 0 ? (
              <ArrowUpRight className="size-3" />
            ) : (
              <ArrowDownRight className="size-3" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
        {apoio && (
          <span className="text-xs text-muted-foreground">{apoio}</span>
        )}
      </div>
    </div>
  );
}
