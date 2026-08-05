import type { Metadata } from "next";

import { Marca } from "@/components/marca";
import { FormularioDeCodigo } from "@/components/teste/formulario-de-codigo";

export const metadata: Metadata = {
  title: "Entrar com código",
  robots: { index: false, follow: false },
};

/**
 * A terceira porta.
 *
 * Link e QR levam a pessoa direto. Esta tela existe para o caso em que nenhum
 * dos dois chega inteiro: o código foi ditado no telefone, mandado no WhatsApp
 * ou está escrito num papel. O endereço é curto de propósito — quem dita um
 * código também precisa ditar onde digitá-lo.
 */
export default function PaginaDeAcesso() {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col px-6 py-8">
      <header>
        <Marca href={null} />
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <p className="etiqueta">Mapeamento comportamental</p>

        <h1 className="mt-3 t-titulo">Digite seu código de acesso</h1>

        <p className="mt-3 t-corpo leading-relaxed text-muted-foreground">
          São os 4 números que a empresa te passou. Se você recebeu um link ou um
          QR Code, pode usar qualquer um dos três — vão todos para o mesmo lugar.
        </p>

        <FormularioDeCodigo />

        {/* O código volta ao acervo quando a prova conclui, e é isso que faz 4
            dígitos bastarem. Quem já respondeu tenta o mesmo código, recebe
            "não encontrado" e conclui que digitou errado — dizer isso antes
            evita a tentativa e a dúvida. */}
        <p className="mt-6 t-legenda leading-relaxed text-muted-foreground">
          Já respondeu? O código vale uma vez só. Para rever o seu resultado, use
          o link que apareceu no fim — ele continua funcionando.
        </p>
      </main>

      <footer className="t-legenda leading-relaxed text-muted-foreground">
        Não é prova e não existe resposta certa. Leva cerca de 6 minutos, e no
        fim você recebe o seu próprio resultado.
      </footer>
    </div>
  );
}
