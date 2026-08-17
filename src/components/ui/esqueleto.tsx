import { cn } from "@/lib/utils";

/**
 * Esqueleto de carregamento.
 *
 * A regra que importa: o esqueleto tem que ter a MESMA forma do conteúdo que
 * vai chegar. Bloco genérico piscando é pior que nada — cria um salto de layout
 * quando o conteúdo entra, e o salto é justamente o que faz um produto parecer
 * barato.
 */
export function Esqueleto({
  className,
  ...resto
}: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...resto}
    />
  );
}

export function EsqueletoDeTexto({
  linhas = 3,
  className,
}: {
  linhas?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: linhas }, (_, i) => (
        <Esqueleto
          key={i}
          className="h-3"
          style={{ width: i === linhas - 1 ? "62%" : "100%" }}
        />
      ))}
    </div>
  );
}

/** Uma célula da faixa de indicadores. Mesma altura e recuo da célula real. */
export function EsqueletoDeIndicador() {
  return (
    <div className="p-5">
      <Esqueleto className="h-2.5 w-20" />
      <Esqueleto className="mt-3 h-8 w-16" />
      <Esqueleto className="mt-3 h-2.5 w-28" />
    </div>
  );
}

/** A faixa inteira — a moldura que os quatro indicadores dividem. */
export function EsqueletoDaFaixaDeIndicadores({ celulas = 4 }: { celulas?: number }) {
  return (
    <div className="grid overflow-hidden rounded-xl border bg-card shadow-baixa divide-y divide-border sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4">
      {Array.from({ length: celulas }, (_, i) => (
        <EsqueletoDeIndicador key={i} />
      ))}
    </div>
  );
}

/** Linha de ranking — mesma altura e colunas da linha real. */
export function EsqueletoDeLinha() {
  return (
    <div className="flex items-center gap-4 px-5 py-4">
      <Esqueleto className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <Esqueleto className="h-3.5 w-40" />
        <Esqueleto className="h-2.5 w-56" />
      </div>
      <Esqueleto className="h-5 w-24 shrink-0 rounded-full" />
      <Esqueleto className="h-4 w-10 shrink-0" />
    </div>
  );
}

export function EsqueletoDePainel({
  linhas = 5,
  titulo = true,
}: {
  linhas?: number;
  titulo?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-baixa">
      {titulo && (
        <div className="border-b px-5 py-4">
          <Esqueleto className="h-3.5 w-44" />
          <Esqueleto className="mt-2 h-2.5 w-64" />
        </div>
      )}
      <div className="divide-y">
        {Array.from({ length: linhas }, (_, i) => (
          <EsqueletoDeLinha key={i} />
        ))}
      </div>
    </div>
  );
}

export function EsqueletoDeGrafico({ altura = 260 }: { altura?: number }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-baixa">
      <Esqueleto className="h-3.5 w-40" />
      <Esqueleto className="mt-2 h-2.5 w-52" />
      <div
        className="mt-5 grid place-items-center"
        style={{ height: altura }}
      >
        <Esqueleto className="size-40 rounded-full" />
      </div>
    </div>
  );
}
