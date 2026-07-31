import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Cartão de indicador.
 *
 * A variação só aparece quando existe base de comparação: "+0%" sobre nada é
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
        "rounded-xl border p-4 transition-colors",
        destaque
          ? "border-marca/30 bg-marca-suave/40"
          : "bg-card shadow-baixa hover:border-linha-forte",
      )}
    >
      <p className="etiqueta">{rotulo}</p>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className={cn(
            "leitura text-[1.625rem] leading-none font-semibold",
            destaque && "text-marca",
          )}
        >
          {valor}
        </span>
        {unidade && (
          <span className="t-corpo-sm text-muted-foreground">{unidade}</span>
        )}
      </div>

      <div className="mt-2.5 flex min-h-4 items-center gap-2">
        {delta !== null && delta !== 0 && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 text-xs font-medium",
              delta > 0 ? "text-dentro" : "text-fora",
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
        {apoio && <span className="t-legenda text-muted-foreground">{apoio}</span>}
      </div>
    </div>
  );
}
