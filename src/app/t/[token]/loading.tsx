import { SimboloEncaixando } from "@/components/marca";

/**
 * O splash do questionário.
 *
 * Esta rota faz trabalho de banco antes de desenhar qualquer coisa — busca a
 * avaliação, remonta a prova a partir da semente, calcula o que já foi
 * respondido. Sem nada na tela, o candidato vê branco e conclui que o link não
 * funcionou; com um esqueleto, vê a forma de uma prova que ainda não sabe se vai
 * começar do zero ou de onde parou.
 *
 * Então aqui é o único lugar do produto onde a marca aparece sozinha, grande, e
 * se move: as duas metades se encaixam uma vez, e param. É calmo de propósito —
 * quem está aqui não está trabalhando num sistema, está respondendo a um convite.
 */
export default function CarregandoQuestionario() {
  return (
    <div
      className="flex min-h-svh flex-col items-center justify-center gap-5 bg-background px-6"
      aria-busy="true"
    >
      <SimboloEncaixando className="h-12" />
      <p className="etiqueta">Preparando o seu questionário</p>
    </div>
  );
}
