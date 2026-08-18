/**
 * "A aba está aberta numa versão do app que não existe mais."
 *
 * ─── Por que é um módulo, e não uma função dentro de `error.tsx` ───────────
 * Porque ela já falhou em silêncio uma vez. A fronteira de erro sabe tratar
 * esse caso desde sempre — mostra "A Baliza foi atualizada" e um botão que
 * RECARREGA em vez de remontar —, mas a regra só reconhecia arquivo sumido.
 * Quando a mesma causa apareceu pela porta da Server Action, caiu no ramo
 * genérico, ofereceu "Tentar de novo", e "Tentar de novo" não tem como
 * funcionar aqui: remonta a mesma árvore, que pede a mesma coisa que não existe
 * mais. Alguém ficou trancado para fora do produto clicando num botão morto.
 *
 * Dentro de um componente de cliente, a regra não podia ser testada sem montar
 * árvore de React. Aqui pode, e o teste ao lado guarda os dois formatos.
 *
 * ─── As duas portas da mesma causa ─────────────────────────────────────────
 * Publicar troca duas coisas de nome ao mesmo tempo:
 *
 *   · os ARQUIVOS de código, que carregam o hash do conteúdo. A aba antiga
 *     pede o nome antigo na primeira navegação e não acha → `ChunkLoadError`.
 *     Aparece ao NAVEGAR.
 *
 *   · os IDENTIFICADORES de cada Server Action. A aba antiga manda o id antigo
 *     no primeiro envio de formulário e o servidor de hoje não o reconhece →
 *     `UnrecognizedActionError`. Aparece ao ENVIAR — a tela carrega bem, a
 *     pessoa preenche, e só quebra quando ela clica.
 *
 * A segunda é mais cruel justamente por isso: acontece no momento em que a
 * pessoa está tentando fazer alguma coisa, e não ao passear pelo produto.
 *
 * ─── Como reconhecer ───────────────────────────────────────────────────────
 * Pelo `name` E pela mensagem. O `name` é o sinal limpo, mas ele se perde
 * quando o erro atravessa serialização — o que acontece justamente entre
 * servidor e cliente. A mensagem sobrevive, então as duas checagens existem, e
 * não é redundância: é a mesma pergunta feita por dois caminhos que falham em
 * situações diferentes.
 */

const NOMES = ["ChunkLoadError", "UnrecognizedActionError"];

const MENSAGENS =
  /Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed|Server Action .* was not found on the server|failed-to-find-server-action/i;

export function ehVersaoVelha(erro: { name?: string; message?: string }): boolean {
  if (erro.name && NOMES.includes(erro.name)) return true;
  return Boolean(erro.message && MENSAGENS.test(erro.message));
}
