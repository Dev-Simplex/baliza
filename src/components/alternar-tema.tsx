"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

const OPCOES = [
  { valor: "light", Icone: Sun, rotulo: "Claro" },
  { valor: "dark", Icone: Moon, rotulo: "Escuro" },
  { valor: "system", Icone: Monitor, rotulo: "Sistema" },
] as const;

export function AlternarTema({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [montado, setMontado] = useState(false);

  // O tema resolvido só existe no cliente; renderizar antes disso pisca o
  // ícone errado na hidratação.
  useEffect(() => setMontado(true), []);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border bg-card p-0.5",
        className,
      )}
      role="radiogroup"
      aria-label="Tema da interface"
    >
      {OPCOES.map(({ valor, Icone, rotulo }) => {
        const ativo = montado && theme === valor;
        return (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={ativo}
            aria-label={rotulo}
            title={rotulo}
            onClick={() => setTheme(valor)}
            className={cn(
              "grid size-7 place-items-center rounded-full transition-colors",
              "focus-visible:ring-2 focus-visible:ring-n-brass focus-visible:outline-none",
              ativo
                ? "bg-n-brass/15 text-n-brass"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icone className="size-3.5" />
          </button>
        );
      })}
    </div>
  );
}
