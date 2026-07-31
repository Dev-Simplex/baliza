import Link from "next/link";

import { AlternarTema } from "@/components/alternar-tema";
import { Faixa } from "@/components/faixa";
import { Marca } from "@/components/marca";

/**
 * Layout das telas de conta.
 *
 * O painel da direita não é enfeite: é o produto em uma tela. Quem está criando
 * conta vê exatamente o objeto que vai receber depois — o medidor com a faixa
 * alvo, o marcador e o desvio. Vender a tela real é mais honesto que vender uma
 * ilustração.
 */
export default function LayoutDeConta({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[1fr_minmax(0,44rem)]">
      <div className="flex flex-col px-6 py-8 sm:px-10 lg:px-14">
        <header className="flex items-center justify-between">
          <Marca />
          <AlternarTema />
        </header>

        <main className="flex flex-1 items-center py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="etiqueta flex flex-wrap gap-x-5 gap-y-2">
          <Link href="/privacidade" className="hover:text-foreground">
            Privacidade
          </Link>
          <Link href="/termos" className="hover:text-foreground">
            Termos
          </Link>
          <span>© {new Date().getFullYear()} Prumo</span>
        </footer>
      </div>

      {/* Painel de demonstração — some no mobile, onde a atenção é do formulário. */}
      <aside className="relative hidden overflow-hidden border-l bg-superficie-2 lg:block">
        <div className="grade-fina absolute inset-0 opacity-40" />

        <div className="relative flex h-full flex-col justify-center px-14">
          <p className="etiqueta">Aderência à vaga · Vendas — prospecção</p>

          <h2 className="mt-4 max-w-md t-secao">
            O número vem sempre com a conta que o gerou.
          </h2>

          <p className="mt-3 max-w-md text-sm text-muted-foreground">
            Cada dimensão mostra a faixa que a vaga pede, onde a pessoa caiu e,
            quando ela fica fora, o quanto exatamente isso está custando.
          </p>

          <div className="mt-9 max-w-md space-y-6 rounded-xl border bg-card p-6">
            <div className="flex items-baseline justify-between">
              <span className="etiqueta">Bruno Tavares</span>
              <span className="leitura text-2xl font-semibold">85,1</span>
            </div>

            <Faixa
              atraso={0.1}
              dados={{
                fator: "C",
                nome: "Organização e Entrega",
                escore: 68.8,
                faixa: [55, 100],
                ideal: 100,
                peso: 4,
                tipo: "maior_melhor",
                dentro: true,
              }}
            />
            <Faixa
              atraso={0.2}
              dados={{
                fator: "X",
                nome: "Energia Social",
                escore: 81.3,
                faixa: [65, 100],
                ideal: 100,
                peso: 5,
                tipo: "maior_melhor",
                dentro: true,
              }}
            />
            <Faixa
              atraso={0.3}
              dados={{
                fator: "A",
                nome: "Cooperação",
                escore: 93.8,
                faixa: [30, 60],
                ideal: 45,
                peso: 3,
                tipo: "faixa_otima",
                dentro: false,
              }}
            />

            <p className="border-t pt-4 t-corpo-sm leading-relaxed text-muted-foreground">
              <span className="font-medium text-foreground">
                Cooperação bem acima da faixa
              </span>{" "}
              é o que mais derruba a aderência aqui. Em prospecção, quem evita
              atrito não pede o fechamento e dá desconto pra não desagradar.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
