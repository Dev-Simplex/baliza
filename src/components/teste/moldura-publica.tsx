import { Marca } from "@/components/marca";
import { cn } from "@/lib/utils";

/**
 * A moldura das telas do candidato.
 *
 * Tudo que a pessoa que responde vê — a página da vaga, a entrada por código, a
 * abertura, a conclusão — mora aqui dentro, e por isso todas começam na mesma
 * altura, com a mesma largura e a mesma marca no mesmo lugar. Antes cada tela
 * repetia o próprio `mx-auto max-w-… px-6 py-8`, com valores parecidos e não
 * iguais, e a diferença aparecia justamente na troca de tela.
 *
 * O tom é deliberadamente mais calmo que o do painel do recrutador: uma coluna
 * estreita, muito ar em volta e a marca em tamanho pequeno. Quem está aqui não
 * está trabalhando num sistema — está respondendo a um convite, muitas vezes do
 * celular, no meio de outra coisa. Nada nesta tela pode parecer prova.
 */
export function MolduraPublica({
  children,
  rodape,
  largura = "estreita",
  className,
}: {
  children: React.ReactNode;
  rodape?: React.ReactNode;
  /** `media` para a página da vaga, que carrega descrição e formulário. */
  largura?: "estreita" | "media";
  className?: string;
}) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="px-5 py-6 sm:px-8">
        <div
          className={cn(
            "mx-auto w-full",
            largura === "estreita" ? "max-w-md" : "max-w-xl",
          )}
        >
          {/* Sem link: daqui a pessoa não tem para onde ir dentro do produto, e
              uma marca clicável que leva a uma tela de login é um convite a sair
              do que ela veio fazer. */}
          <Marca href={null} tamanho="sm" />
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-8">
        <div
          className={cn(
            "mx-auto w-full",
            largura === "estreita" ? "max-w-md" : "max-w-xl",
            className,
          )}
        >
          {children}
        </div>
      </main>

      {rodape && (
        <footer className="px-5 py-6 sm:px-8">
          <div
            className={cn(
              "mx-auto w-full t-legenda leading-relaxed text-muted-foreground",
              largura === "estreita" ? "max-w-md" : "max-w-xl",
            )}
          >
            {rodape}
          </div>
        </footer>
      )}
    </div>
  );
}
