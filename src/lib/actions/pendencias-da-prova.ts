/**
 * O que ainda falta responder numa prova.
 *
 * Fica fora da Server Action de propósito: aqui não entra banco nem cabeçalho
 * de requisição, então a regra que decide se alguém pode ou não concluir é
 * testável sozinha — e ela é a regra que tranca a porta na última tela.
 *
 * A sutileza que justifica o arquivo é a filtragem por catálogo. A forma da
 * prova é sorteada uma vez e gravada; o instrumento, não. Basta aposentar um
 * item ruim — coisa que o banco de 128 itens existe para permitir — e as provas
 * já sorteadas passam a carregar um id que a tela não sabe mais desenhar. O
 * candidato não vê a pergunta, logo não pode respondê-la; se ela continuasse
 * contando como pendência, a conclusão seria recusada para sempre, a tela
 * recarregaria, e ele ficaria num laço sem saída nem explicação.
 *
 * Exigir só o que dá para ver é a única regra que não trava ninguém — e o
 * escore aguenta, porque a escoragem ignora id desconhecido em vez de estourar.
 */
export function pendenciasDaProva(entrada: {
  itensDaForma: string[];
  cenariosDaForma: string[];
  itensRespondidos: Iterable<string>;
  cenariosRespondidos: Iterable<string>;
  /** O instrumento atual ainda conhece este item? */
  itemVisivel: (id: string) => boolean;
  cenarioVisivel: (id: string) => boolean;
}) {
  const respondidos = new Set(entrada.itensRespondidos);
  const blocosRespondidos = new Set(entrada.cenariosRespondidos);

  // `Set` na forma também protege de id repetido no sorteio: pendência contada
  // duas vezes viraria "faltam 2 respostas" com uma pergunta só na tela.
  const itens = [...new Set(entrada.itensDaForma)].filter(
    (id) => entrada.itemVisivel(id) && !respondidos.has(id),
  );

  const cenarios = [...new Set(entrada.cenariosDaForma)].filter(
    (id) => entrada.cenarioVisivel(id) && !blocosRespondidos.has(id),
  );

  return { itens, cenarios, total: itens.length + cenarios.length };
}
