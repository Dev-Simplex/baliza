import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

/**
 * Campo de texto.
 *
 * `tamanho="lg"` (44px) é o campo de formulário que a pessoa preenche de fato —
 * entrar, criar conta, dados do candidato, código de acesso. O padrão de 36px
 * fica para filtro, busca e campo dentro de tabela, onde a densidade importa
 * mais que o alvo de toque.
 *
 * `text-base` abaixo de `md` não é escolha estética: o Safari do iPhone dá zoom
 * automático em qualquer campo com fonte menor que 16px, e o zoom desalinha o
 * formulário inteiro.
 */
function Input({
  className,
  type,
  tamanho = "default",
  ...props
}: React.ComponentProps<"input"> & { tamanho?: "default" | "lg" }) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-lg border border-input bg-card text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        tamanho === "default" && "h-9 px-3 py-1",
        tamanho === "lg" && "h-11 px-3.5 py-2",
        className
      )}
      {...props}
    />
  )
}

export { Input }
