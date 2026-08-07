"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { RotateCw } from "lucide-react";

import { Marca } from "@/components/marca";
import { Button } from "@/components/ui/button";
import { BotaoLink } from "@/components/ui/botao-link";

/** Rotas onde quem está do outro lado é o candidato, não o cliente. */
const DO_CANDIDATO = ["/t/", "/vaga/", "/acesso"];

/**
 * A aba está aberta numa versão do app que não existe mais.
 *
 * Publicar troca os nomes dos arquivos de código, que carregam o hash do
 * conteúdo. A aba que já estava aberta guarda os nomes ANTIGOS e vai buscá-los
 * na primeira navegação — eles não estão mais no servidor, o carregamento falha
 * e cai aqui. Não é defeito de nada: é o preço de publicar com gente usando.
 *
 * Importa distinguir porque a saída é OUTRA. `reset()` remonta a mesma árvore,
 * que vai pedir o mesmo arquivo que não existe e falhar de novo — o botão
 * "Tentar de novo" vira um botão que não faz nada, e a pessoa clica três vezes
 * antes de desistir. O que resolve é recarregar a página inteira, que busca o
 * HTML novo e com ele a lista nova de arquivos.
 *
 * Sem `digest`: isto acontece no navegador, então não há erro de servidor para
 * o Next identificar — mais um motivo para o texto não prometer código nenhum.
 */
function ehVersaoVelha(erro: Error) {
  return (
    erro.name === "ChunkLoadError" ||
    /Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed/i.test(
      erro.message,
    )
  );
}

/**
 * Fronteira de erro.
 *
 * O texto explica o que aconteceu e oferece a saída, sem pedir desculpas e sem
 * jargão. `digest` é o identificador que o Next gera para o erro no servidor —
 * é o que torna um chamado de suporte resolvível, então ele fica visível.
 *
 * A segunda saída depende de QUEM quebrou. Esta fronteira é a raiz: pega tanto
 * o painel quanto a prova do candidato. Oferecer "Ir para o painel" a quem está
 * respondendo o questionário mandava a pessoa para um login que ela não tem —
 * uma saída que fecha a porta em vez de abrir. Para ela, o caminho de volta é o
 * link que ela já tem na mão, então o botão sai da tela: um botão a menos é
 * melhor que um botão que engana.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const caminho = usePathname();
  const ehCandidato = DO_CANDIDATO.some((r) => caminho?.startsWith(r));
  const versaoVelha = ehVersaoVelha(error);

  useEffect(() => {
    console.error("[erro de rota]", error);
  }, [error]);

  /**
   * O código só é prometido quando ele EXISTE.
   *
   * O texto dizia "o código abaixo identifica exatamente o que aconteceu" em
   * toda falha, mas `digest` só vem quando quem quebrou foi o SERVIDOR. Erro
   * de navegador não tem digest, e aí a frase apontava para um lugar vazio:
   * a pessoa lia "o código abaixo", olhava abaixo e não havia nada. Quem abre
   * chamado fica sem o que dizer, e quem atende fica sem o que procurar.
   */
  const explicacao = versaoVelha
    ? ehCandidato
      ? "Nada do que você respondeu se perdeu — as respostas são salvas a cada clique. Recarregue a página e você volta de onde parou."
      : "Uma versão nova foi publicada enquanto esta aba estava aberta. Recarregar resolve."
    : ehCandidato
      ? "Nada do que você respondeu se perdeu — as respostas são salvas a cada clique. Tentar de novo costuma resolver, e você também pode fechar e voltar depois pelo mesmo link."
      : error.digest
        ? "A falha foi registrada. Tentar de novo costuma resolver — se insistir, o código abaixo identifica exatamente o que aconteceu."
        : "A falha foi registrada. Tentar de novo costuma resolver; se insistir, recarregar a página costuma ser o próximo passo.";

  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6">
      <Marca href={ehCandidato ? null : "/"} />

      <p className="etiqueta mt-12">Algo saiu de prumo</p>
      <h1 className="t-titulo mt-3">
        {versaoVelha ? "O Prumo foi atualizado." : "Esta tela não carregou."}
      </h1>
      <p className="t-corpo mt-3 text-muted-foreground">{explicacao}</p>

      <div className="mt-8 flex flex-wrap gap-2">
        <Button
          onClick={versaoVelha ? () => window.location.reload() : reset}
          className="gap-2"
        >
          <RotateCw className="size-4" />
          {versaoVelha ? "Recarregar" : "Tentar de novo"}
        </Button>
        {!ehCandidato && (
          <BotaoLink href="/dashboard" variant="outline">
            Ir para o painel
          </BotaoLink>
        )}
      </div>

      {error.digest && (
        <p className="leitura mt-8 text-xs text-muted-foreground">
          código {error.digest}
        </p>
      )}
    </main>
  );
}
