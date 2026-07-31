import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * A marca.
 *
 * O símbolo não é uma rosa dos ventos — é a leitura de um instrumento: o
 * marcador de latão pousado dentro da faixa. Mesmo desenho do medidor que
 * carrega o produto inteiro, reduzido a 20 pixels.
 */
export function Simbolo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("relative inline-block h-5 w-5 shrink-0", className)}
    >
      <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-current opacity-25" />
      <span className="absolute top-1/2 left-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-n-teal" />
      <span className="absolute top-1/2 left-[58%] size-[7px] -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px] bg-n-brass" />
    </span>
  );
}

export function Marca({
  className,
  href = "/",
  tamanho = "md",
}: {
  className?: string;
  href?: string | null;
  tamanho?: "sm" | "md" | "lg";
}) {
  const conteudo = (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-semibold tracking-tight",
        tamanho === "sm" && "text-sm",
        tamanho === "md" && "text-[15px]",
        tamanho === "lg" && "text-lg",
        className,
      )}
      style={{ fontFamily: "var(--fonte-display)" }}
    >
      <Simbolo className={cn(tamanho === "lg" && "h-6 w-6")} />
      Bússola
    </span>
  );

  if (!href) return conteudo;
  return (
    <Link href={href} className="rounded-sm focus-visible:ring-2 focus-visible:ring-n-brass focus-visible:outline-none">
      {conteudo}
    </Link>
  );
}
