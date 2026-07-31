import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Cabeçalho de página.
 *
 * Cada tela reimplementava o seu, com margens diferentes e a etiqueta às vezes
 * presente, às vezes não. O resultado era que o título de cada página começava
 * numa altura ligeiramente diferente — algo que ninguém aponta, mas que faz o
 * produto parecer montado por pessoas diferentes.
 */
export function CabecalhoDePagina({
  etiqueta,
  titulo,
  descricao,
  voltar,
  acoes,
  className,
}: {
  etiqueta?: string;
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  voltar?: { href: string; rotulo: string };
  acoes?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      {voltar && (
        <Link
          href={voltar.href}
          className="etiqueta -ml-1 mb-3 inline-flex items-center gap-1 rounded-md py-1 transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-3.5" />
          {voltar.rotulo}
        </Link>
      )}

      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          {etiqueta && <p className="etiqueta">{etiqueta}</p>}
          <h1 className={cn("t-titulo", etiqueta && "mt-2")}>{titulo}</h1>
          {descricao && (
            <p className="t-corpo mt-2 max-w-2xl text-muted-foreground">
              {descricao}
            </p>
          )}
        </div>

        {acoes && <div className="flex shrink-0 items-center gap-2">{acoes}</div>}
      </div>
    </div>
  );
}
