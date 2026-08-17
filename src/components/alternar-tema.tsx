"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

/** Nunca notifica: o valor só muda uma vez, na hidratação. */
const semInscricao = () => () => {};

/**
 * "Já hidratou?" sem `useEffect`.
 *
 * O padrão anterior (`useState(false)` + `useEffect(() => setMontado(true))`)
 * fazia o que a regra `react-hooks/set-state-in-effect` proíbe: agendava um
 * segundo render logo depois do primeiro, em toda montagem do seletor.
 *
 * `useSyncExternalStore` responde a mesma pergunta pelo caminho para o qual ela
 * existe — um valor no servidor, outro no cliente — e o React resolve a
 * diferença durante a própria hidratação, sem render extra.
 */
function useHidratado() {
  return useSyncExternalStore(
    semInscricao,
    () => true,
    () => false,
  );
}

const OPCOES = [
  { valor: "light", Icone: Sun, rotulo: "Claro" },
  { valor: "dark", Icone: Moon, rotulo: "Escuro" },
  { valor: "system", Icone: Monitor, rotulo: "Sistema" },
] as const;

/**
 * O seletor de tema.
 *
 * Três estados explícitos em vez de um interruptor: "sistema" é um estado de
 * verdade — a pessoa que deixa o telefone virar escuro às 18h quer isso aqui
 * também — e um interruptor de duas posições não sabe representá-lo.
 *
 * `tamanho="confortavel"` existe para a gaveta do celular, onde o controle
 * ganha 44px de alvo. No cabeçalho do desktop ele é compacto de propósito:
 * trocar de tema é raro, e um controle grande ali competiria com as ações da
 * página.
 */
export function AlternarTema({
  className,
  tamanho = "compacto",
}: {
  className?: string;
  tamanho?: "compacto" | "confortavel";
}) {
  const { theme, setTheme } = useTheme();
  // O tema resolvido só existe no cliente; marcar antes disso pisca o estado
  // errado na hidratação.
  const montado = useHidratado();

  const confortavel = tamanho === "confortavel";

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
              "grid place-items-center rounded-full transition-colors",
              confortavel ? "h-10 w-14" : "size-7",
              ativo
                ? "text-marca"
                : "text-muted-foreground hover:text-foreground",
            )}
            style={
              ativo
                ? {
                    background:
                      "color-mix(in oklab, var(--marca-sinal) 14%, transparent)",
                  }
                : undefined
            }
          >
            <Icone className={confortavel ? "size-4" : "size-3.5"} />
          </button>
        );
      })}
    </div>
  );
}
