import { cn } from "@/lib/utils"

/**
 * Esqueleto de carregamento.
 *
 * Pulso e não brilho deslizante: o brilho chama atenção para o que ainda não
 * existe, e uma tela inteira deles pisca. O `prefers-reduced-motion` global
 * zera a duração — quem pediu redução recebe um bloco parado, que continua
 * dizendo "aqui vem conteúdo".
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
