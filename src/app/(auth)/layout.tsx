import Link from "next/link";

import { AlternarTema } from "@/components/alternar-tema";
import { Marca } from "@/components/marca";

/**
 * Layout das telas de conta.
 *
 * Uma coluna, centrada, e nada mais. A versão anterior vendia o produto num
 * painel ilustrado à direita — o que fazia sentido enquanto a landing não
 * mostrava o produto, e hoje só repete o que a pessoa acabou de ver. Quem chega
 * aqui já decidiu; a tela tem uma tarefa só, que é não atrapalhar.
 *
 * O painel também sumia inteiro no celular, o que significava que metade do
 * desenho era invisível justamente para a metade do tráfego. Uma coluna é a
 * mesma tela nos dois lugares.
 */
export default function LayoutDeConta({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="flex items-center justify-between gap-4 px-5 py-5 sm:px-8">
        <Marca tamanho="md" />
        <AlternarTema />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[27rem]">
          <div className="rounded-2xl border bg-card p-6 shadow-baixa sm:p-8">
            {children}
          </div>

          <RegraDeFit />
        </div>
      </main>

      <footer className="etiqueta flex flex-wrap justify-center gap-x-5 gap-y-2 px-5 py-6 sm:px-8">
        <Link href="/privacidade" className="rounded-sm hover:text-foreground">
          Privacidade
        </Link>
        <Link href="/termos" className="rounded-sm hover:text-foreground">
          Termos
        </Link>
        <span>© {new Date().getFullYear()} Baliza by SPXIA</span>
      </footer>
    </div>
  );
}

/**
 * O único enfeite da tela, e ele diz alguma coisa: duas metades que se
 * aproximam e não se tocam. É o símbolo da Baliza reduzido a uma régua — o
 * espaço entre elas é o mesmo espaço negativo do logotipo.
 */
function RegraDeFit() {
  return (
    <div
      aria-hidden
      className="mx-auto mt-8 flex max-w-56 items-center gap-3 opacity-70"
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-foreground/40" />
      <span className="size-1 rounded-full bg-foreground/40" />
      <span
        className="size-1 rounded-full"
        style={{ background: "var(--marca-sinal)" }}
      />
      <span
        className="h-px flex-1"
        style={{
          background:
            "linear-gradient(to left, transparent, color-mix(in oklab, var(--marca-sinal) 55%, transparent))",
        }}
      />
    </div>
  );
}
