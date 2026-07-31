import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * A marca.
 *
 * O símbolo é o próprio instrumento: o fio a prumo descendo, o peso de latão na
 * ponta, e a faixa alvo atravessando embaixo. A ponta do peso pousa DENTRO da
 * faixa — que é o estado que o produto procura.
 *
 * É o mesmo desenho do medidor (`components/faixa.tsx`) girado 90°: a leitura
 * na vertical, o alvo na horizontal. Nome, símbolo e gráfico dizendo a mesma
 * coisa, o que é a única razão de um símbolo existir.
 */
export function Simbolo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden
      className={cn("size-5 shrink-0", className)}
      fill="none"
    >
      {/* faixa alvo */}
      <rect
        x="1.5"
        y="13"
        width="17"
        height="3.6"
        rx="1.8"
        fill="var(--dentro)"
        fillOpacity="0.22"
      />
      <path
        d="M2.4 13.4v2.8M17.6 13.4v2.8"
        stroke="var(--dentro)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />

      {/* o fio */}
      <path
        d="M10 2.2V9"
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="1.1"
        strokeLinecap="round"
      />

      {/* o peso de latão — a ponta pousa dentro da faixa */}
      <path
        d="M10 8.6 12.5 11.4 10 15.6 7.5 11.4Z"
        fill="var(--marca-forte)"
      />
    </svg>
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
        tamanho === "md" && "t-corpo",
        tamanho === "lg" && "text-lg",
        className,
      )}
      style={{ fontFamily: "var(--fonte-display)" }}
    >
      <Simbolo className={cn(tamanho === "lg" && "size-6")} />
      Prumo
    </span>
  );

  if (!href) return conteudo;
  return (
    <Link
      href={href}
      className="rounded-sm"
    >
      {conteudo}
    </Link>
  );
}
