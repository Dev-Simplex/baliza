import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Os indicadores do topo das telas de painel.
 *
 * ─── Por que uma FAIXA, e não quatro cartões ───────────────────────────────
 * Quatro caixas iguais, lado a lado, com borda igual e número do mesmo tamanho,
 * dizem ao olho que as quatro coisas têm o mesmo peso — e não têm. Aderência
 * média é o número que resume a operação; "candidatos" é contexto. A faixa
 * resolve isso trocando quatro molduras por UMA, dividida por linhas finas: os
 * indicadores viram colunas de uma mesma leitura, e a hierarquia passa a ser
 * dada pelo destaque, não pela moldura.
 *
 * É também o que mata o "cartão dentro de cartão": a faixa é um objeto só.
 */
export function FaixaDeIndicadores({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid overflow-hidden rounded-xl border bg-card shadow-baixa",
        // As divisórias seguem a grade: no celular os indicadores empilham e a
        // linha vira horizontal; a partir de `sm` ela vira vertical.
        "divide-y divide-border sm:grid-cols-2 sm:divide-y-0",
        "[&>*:nth-child(n+3)]:sm:border-t",
        "sm:[&>*:nth-child(even)]:border-l",
        "xl:grid-cols-4 xl:divide-y-0 xl:[&>*:nth-child(n+3)]:border-t-0 xl:[&>*:not(:first-child)]:border-l",
        className,
      )}
    >
      {children}
    </section>
  );
}

/**
 * Um indicador.
 *
 * A variação só aparece quando existe base de comparação: "+0%" sobre nada é
 * ruído que parece informação.
 *
 * `destaque` é um por tela, e é o único lugar da faixa onde o laranja aparece.
 * Ele não significa "bom": significa "é este que você veio ver".
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
    <div className={cn("relative p-5", destaque && "bg-marca-suave/45")}>
      {/* O fio laranja no topo do destaque: presença de marca do tamanho certo
          — visível de relance, e pequeno o bastante para não virar alerta. */}
      {destaque && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: "var(--marca-sinal)" }}
        />
      )}

      <p className="etiqueta">{rotulo}</p>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className={cn("t-numero", destaque && "text-marca")}>{valor}</span>
        {unidade && (
          <span className="t-corpo-sm text-muted-foreground">{unidade}</span>
        )}
      </div>

      <div className="mt-2.5 flex min-h-4 flex-wrap items-center gap-x-2 gap-y-1">
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
