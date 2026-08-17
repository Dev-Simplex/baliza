import type { Teste } from "@/lib/instrument/baterias";

/**
 * O vocabulário da prova do candidato.
 *
 * ─── Por que este arquivo existe separado ──────────────────────────────────
 * A prova deixou de ser UMA prova. A vaga escolhe a bateria, e o candidato
 * atravessa um teste por vez — cada um com a sua instrução, o seu progresso e o
 * seu jeito de perguntar. Quem monta isso é o servidor (só ele pode tocar nos
 * bancos de itens); quem desenha é a tela. Este arquivo é o contrato entre os
 * dois, e por isso não importa nada além de tipos: se ele arrastasse
 * `items.ts`, o banco de 128 itens — com fator, faceta e inversão — viajaria
 * para o navegador do candidato, que é exatamente o que os manuais mandam nunca
 * fazer (§2.3, §3.3, §4.2).
 *
 * ─── A divisão é pela FORMA da pergunta, não pelo teste ────────────────────
 * Mesma regra que o schema já usa para as tabelas de resposta. Quatro tipos
 * cobrem os quatro testes de hoje, e um teste novo que peça uma dessas quatro
 * formas não precisa de tela nova:
 *
 *   · `likert`      1 a 5 numa afirmação        → Prumo, Big Five  (ItemResponse)
 *   · `ordenar`     a que eu faria PRIMEIRO e a que deixaria por ÚLTIMO
 *                                                → Prumo           (ScenarioResponse)
 *   · `mais-menos`  a palavra que MAIS e a que MENOS combinam
 *                                                → DISC            (ScenarioResponse)
 *   · `escolha`     uma alternativa entre quatro → SJT             (ChoiceResponse)
 *
 * `ordenar` e `mais-menos` gravam na mesma tabela e pelo mesmo caminho — as duas
 * são "um MAIS e um MENOS, obrigatoriamente diferentes". Continuam tipos
 * separados porque o que a pessoa lê e o que a tela precisa dizer são outros:
 * num caso são ações de um caso de trabalho, no outro são quatro adjetivos
 * soltos.
 */

export type OpcaoDePergunta = { id: string; texto: string };

export type TipoDePergunta =
  | "likert"
  | "ordenar"
  | "mais-menos"
  | "escolha-curta"
  | "binaria"
  | "escolha";

export type Pergunta =
  | { tipo: "likert"; id: string; texto: string }
  | {
      tipo: "ordenar";
      id: string;
      titulo: string;
      situacao: string;
      opcoes: OpcaoDePergunta[];
    }
  | { tipo: "mais-menos"; id: string; opcoes: OpcaoDePergunta[] }
  | {
      tipo: "escolha-curta" | "binaria";
      id: string;
      situacao: string;
      opcoes: OpcaoDePergunta[];
    }
  | { tipo: "escolha"; id: string; situacao: string; opcoes: OpcaoDePergunta[] };

export type OpcaoDeEscala = { valor: number; rotulo: string };

/**
 * Um teste da bateria, do jeito que o candidato o atravessa.
 *
 * A instrução vem pronta do servidor, e é **texto exato do manual** para os três
 * testes que têm um (§2.2, §3.2, §4.2). Parafrasear muda o que está sendo
 * medido: "responda o que você realmente faria — não o que acha que
 * gostaríamos de ouvir" é metade do que faz o SJT funcionar.
 */
export type EtapaDaProva = {
  teste: Teste;
  /** Nome completo, no cabeçalho da etapa. */
  nome: string;
  /** Cabe na trilha e no celular: "Big Five", "DISC". */
  curto: string;
  instrucao: string;
  /** Repetido acima de cada afirmação, só nas etapas com `likert`. */
  enunciado?: string;
  /** A escala de 1 a 5 desta etapa — o Prumo e o Big Five usam rótulos diferentes. */
  escala?: OpcaoDeEscala[];
  perguntas: Pergunta[];
};

/**
 * O que já está gravado no servidor, separado por tabela de destino.
 *
 * Chega inteiro no primeiro carregamento e é o que permite retomar de onde
 * parou — inclusive no meio de um teste, sabendo em qual teste era.
 */
export type RespostasSalvas = {
  /** id do item → 1..5 */
  itens: Record<string, number>;
  /** id do bloco → o par MAIS/MENOS (`ordenar` e `mais-menos`) */
  blocos: Record<string, { primeiraId: string; ultimaId: string }>;
  /** id do cenário → id da alternativa (`escolha`) */
  escolhas: Record<string, string>;
};

export type DadosDoTeste = {
  token: string;
  etapas: EtapaDaProva[];
  salvas: RespostasSalvas;
};

/** A pergunta já foi respondida? Uma regra só, usada pela tela e pelo progresso. */
export function perguntaRespondida(
  pergunta: Pergunta,
  salvas: RespostasSalvas,
): boolean {
  switch (pergunta.tipo) {
    case "likert":
      return salvas.itens[pergunta.id] != null;
    case "ordenar":
    case "mais-menos": {
      const par = salvas.blocos[pergunta.id];
      // As duas escolhas, e diferentes entre si. Meia resposta não é resposta:
      // é justamente o estado em que a pessoa marcou uma e achou que acabou.
      return Boolean(par && par.primeiraId && par.ultimaId && par.primeiraId !== par.ultimaId);
    }
    case "escolha-curta":
    case "binaria":
    case "escolha":
      return salvas.escolhas[pergunta.id] != null;
  }
}
