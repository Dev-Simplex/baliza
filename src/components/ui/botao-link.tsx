import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Botão que navega.
 *
 * Os componentes de UI deste projeto são Base UI, não Radix: a composição é
 * feita com `render`, e `asChild` seria repassado ao DOM (React reclama do
 * atributo desconhecido e o layout do botão quebra, porque o link vira um
 * elemento inline dentro do flex). Este componente é o único lugar que precisa
 * saber disso.
 */
export function BotaoLink({
  href,
  children,
  className,
  variant,
  size,
  prefetch,
  ...resto
}: {
  href: string;
  children: React.ReactNode;
  prefetch?: boolean;
} & Omit<React.ComponentProps<typeof Button>, "render" | "children">) {
  return (
    <Button
      // Sem isto o Base UI avisa que perdeu a semântica nativa de botão: ele
      // precisa saber que o elemento renderizado é um <a> para aplicar o papel
      // e o comportamento de teclado corretos.
      nativeButton={false}
      render={<Link href={href} prefetch={prefetch} />}
      className={className}
      variant={variant}
      size={size}
      {...resto}
    >
      {children}
    </Button>
  );
}
