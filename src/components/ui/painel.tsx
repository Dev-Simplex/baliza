import { cn } from "@/lib/utils";

/**
 * Painel — o cartão do produto.
 *
 * Existia antes como `rounded-xl border bg-card p-5` copiado em doze lugares,
 * com o padding variando entre p-4, p-5 e p-6 sem critério. Agora o raio, a
 * borda, a sombra e o padding têm um dono só.
 *
 * `padding="nenhum"` é para painel que contém lista: a linha precisa encostar
 * na borda para o realce de hover cobrir a largura inteira.
 */
export function Painel({
  children,
  className,
  padding = "normal",
  tom = "neutro",
  ...resto
}: React.ComponentProps<"section"> & {
  padding?: "nenhum" | "compacto" | "normal";
  tom?: "neutro" | "marca" | "tracejado";
}) {
  return (
    <section
      className={cn(
        "rounded-xl border",
        tom === "neutro" && "bg-card shadow-baixa",
        tom === "marca" && "border-marca/30 bg-marca-suave/40",
        tom === "tracejado" && "border-dashed bg-transparent",
        padding === "compacto" && "p-4",
        padding === "normal" && "p-5",
        className,
      )}
      {...resto}
    >
      {children}
    </section>
  );
}

/**
 * Cabeçalho do painel. A ação fica à direita e some do fluxo no mobile — nunca
 * espreme o título.
 */
export function PainelCabecalho({
  titulo,
  descricao,
  acao,
  className,
  comBorda = false,
}: {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  acao?: React.ReactNode;
  className?: string;
  comBorda?: boolean;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-x-4 gap-y-2",
        comBorda && "border-b px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="t-cartao">{titulo}</h2>
        {descricao && (
          <p className="t-legenda mt-1 text-muted-foreground">{descricao}</p>
        )}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </header>
  );
}

/** Lista dentro de um painel de padding zero. */
export function PainelLista({
  children,
  className,
  ...resto
}: React.ComponentProps<"ul">) {
  return (
    <ul className={cn("divide-y", className)} {...resto}>
      {children}
    </ul>
  );
}

/** Rodapé de nota — o aviso que acompanha dado sensível. */
export function NotaDeRodape({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "t-corpo-sm rounded-xl border border-dashed px-5 py-4 text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
