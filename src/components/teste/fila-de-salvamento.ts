/**
 * Fila de salvamento das respostas.
 *
 * Antes daqui, cada clique disparava a gravação e torcia. Quando a rede caía no
 * meio da prova — que é o caso comum de quem responde no celular, andando —
 * acontecia o pior desfecho possível: a chamada estourava, ninguém tratava a
 * exceção, o indicador ficava em "Salvando" para sempre e a pessoa seguia
 * respondendo mais trinta perguntas que só existiam na memória do navegador. No
 * fim, o servidor recusava a conclusão por falta de resposta, a tela recarregava
 * e tudo aquilo sumia.
 *
 * A fila resolve isso guardando o que ainda não foi aceito pelo servidor e
 * tentando de novo sozinha. Três decisões que valem explicação:
 *
 * 1. **Uma entrada por chave.** Trocar a resposta da mesma pergunta substitui a
 *    pendência em vez de empilhar outra — o que vale é a última.
 *
 * 2. **Envio serial.** Duas gravações da mesma pergunta em paralelo podem
 *    chegar fora de ordem e gravar a resposta velha por cima da nova.
 *
 * 3. **Falha que volta ≠ falha que fica.** Exceção (rede, servidor fora) é
 *    transitória e merece nova tentativa. Uma recusa explícita do servidor
 *    (`ok: false`) é definitiva — repetir "item fora desta avaliação" mil vezes
 *    só queima bateria e esconde o erro de quem precisa lê-lo.
 */

import { ehVersaoVelha } from "@/lib/versao-velha";

export type ResultadoDoEnvio = { ok: boolean; erro?: string };
export type Envio = () => Promise<ResultadoDoEnvio>;

export type SituacaoDaFila =
  | "ocioso"
  | "salvando"
  | "salvo"
  /** Tem coisa pendente e a última tentativa estourou: vamos tentar de novo. */
  | "aguardando-rede"
  /**
   * O servidor respondeu, e respondeu quebrado (500, deploy no meio, banco fora).
   *
   * Separado de `aguardando-rede` porque a saída é OUTRA. Quem está sem internet
   * resolve trocando de rede; dizer "sem conexão" para quem tem internet manda a
   * pessoa consertar o que não está quebrado — ela troca de wi-fi, vai para o
   * 4G, reinicia o roteador, e continua lendo a mesma frase.
   */
  | "servidor-instavel"
  /**
   * A prova está aberta numa versão do app que não existe mais.
   *
   * Publicar troca o identificador de cada Server Action, e o gravar É uma
   * Server Action. A aba que já estava aberta manda o identificador ANTIGO, o
   * servidor de hoje não o reconhece, e recusa — sempre, para sempre, naquela
   * aba.
   *
   * Separado de `servidor-instavel` porque a saída é OUTRA, e porque o
   * contrário é cruel: repetir não tem como funcionar, e a tela ficava
   * prometendo "sobem sozinhas" e "está demorando mais que o normal" para uma
   * fila que jamais subiria. Quem está no meio da prova acredita, espera, e
   * desiste — e prova incompleta não vira relatório.
   *
   * A recuperação é simples e não perde nada: recarregar busca o HTML novo, com
   * identificadores válidos, e a fila é relida do `localStorage` e reenviada.
   */
  | "versao-velha"
  /** O servidor recusou. Não adianta repetir. */
  | "recusado";

export type EstadoDaFila = {
  situacao: SituacaoDaFila;
  pendentes: number;
  erro: string | null;
  /**
   * Falhas seguidas. A tela usa isto para parar de repetir a mesma promessa:
   * depois de muitas tentativas, "já já volta" deixa de ser verdade.
   */
  tentativasFalhas: number;
};

/**
 * O que precisa ser gravado, em forma que sobrevive a `JSON.stringify`.
 *
 * A fila guardava CLOSURES, e closure não atravessa o fechamento da aba —
 * enquanto a tela prometia, em letra grande, "guardadas no aparelho". Agora a
 * pendência é DADO: cabe no `localStorage` e volta na próxima abertura. Quem
 * sabe transformar dado em chamada é o `reconstruir` de quem monta a fila; a
 * fila não conhece nenhuma action.
 */
export type Fila = {
  enfileirar: (chave: string, dados: unknown) => void;
  tentarAgora: () => void;
  encerrar: () => void;
};

const ESPERA_MAXIMA_MS = 15_000;

/** 1s, 2s, 4s, 8s, 15s, 15s… — rápido no soluço, sem martelar na queda longa. */
export function esperaDaTentativa(tentativa: number) {
  return Math.min(1000 * 2 ** Math.max(0, tentativa - 1), ESPERA_MAXIMA_MS);
}

/**
 * Falhas seguidas a partir das quais a tela deixa de prometer que já volta.
 *
 * Seis, e não três: com o backoff atual (1, 2, 4, 8, 15, 15s) seis tentativas
 * são ~45 segundos. Antes disso ainda é soluço de rede, e trocar o texto cedo
 * demais assusta quem só entrou no elevador.
 */
export const FALHAS_PARA_MUDAR_O_TOM = 6;

/**
 * Isto é queda de rede, ou o servidor respondendo quebrado?
 *
 * `navigator.onLine === false` é o caso fácil. O difícil é o resto: `fetch`
 * falha com `TypeError` quando não conseguiu falar com o servidor, e é o que a
 * Server Action propaga. Qualquer outra exceção significa que a conversa
 * ACONTECEU e deu errado do lado de lá — que é uma informação diferente e
 * merece uma frase diferente.
 */
function pareceQuedaDeRede(erro: unknown) {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return true;
  return erro instanceof TypeError;
}

export function criarFila(opcoes: {
  aoMudar: (estado: EstadoDaFila) => void;
  /**
   * Transforma a pendência guardada na chamada que a grava. É a peça que
   * permite a fila ser persistida: o que vai para o disco é `dados`, e é daqui
   * que ele volta a ser uma chamada quando a prova reabre.
   */
  reconstruir: (dados: unknown) => Envio;
  /**
   * Onde espelhar as pendências. Sem isto a fila segue só em memória — é o que
   * os testes usam, e o que acontece se `localStorage` não existir.
   */
  chaveDeArmazenamento?: string;
  /** Injetável para o teste não depender do relógio. */
  agendar?: (acao: () => void, ms: number) => () => void;
}): Fila {
  const agendar =
    opcoes.agendar ??
    ((acao: () => void, ms: number) => {
      const id = setTimeout(acao, ms);
      return () => clearTimeout(id);
    });

  const pendentes = new Map<string, unknown>();
  let rodando = false;
  let tentativa = 0;
  let falhasSeguidas = 0;
  let cancelarEspera: (() => void) | null = null;
  let situacao: SituacaoDaFila = "ocioso";
  let erro: string | null = null;

  /** O disco é best-effort: modo privado e cota cheia não podem derrubar a prova. */
  function armazenamento(): Storage | null {
    if (!opcoes.chaveDeArmazenamento) return null;
    try {
      return typeof localStorage === "undefined" ? null : localStorage;
    } catch {
      return null;
    }
  }

  function gravarNoDisco() {
    const store = armazenamento();
    if (!store) return;
    try {
      if (pendentes.size === 0) {
        store.removeItem(opcoes.chaveDeArmazenamento!);
        return;
      }
      store.setItem(
        opcoes.chaveDeArmazenamento!,
        JSON.stringify([...pendentes.entries()].map(([chave, dados]) => ({ chave, dados }))),
      );
    } catch {
      // Sem espaço ou sem permissão: a fila continua valendo em memória.
    }
  }

  function lerDoDisco() {
    const store = armazenamento();
    if (!store) return;
    try {
      const cru = store.getItem(opcoes.chaveDeArmazenamento!);
      if (!cru) return;
      const lista = JSON.parse(cru) as Array<{ chave: string; dados: unknown }>;
      if (!Array.isArray(lista)) return;
      // Reenviar o que já subiu não faz mal: o servidor grava por `upsert`, e a
      // dúvida "será que subiu?" só se resolve enviando de novo.
      for (const p of lista) if (p?.chave) pendentes.set(p.chave, p.dados);
    } catch {
      // Guardado corrompido não pode impedir a prova de abrir.
      try {
        store.removeItem(opcoes.chaveDeArmazenamento!);
      } catch {
        /* nada a fazer */
      }
    }
  }

  function mudar(nova: SituacaoDaFila, novoErro: string | null = null) {
    situacao = nova;
    erro = novoErro;
    opcoes.aoMudar({
      situacao,
      pendentes: pendentes.size,
      erro,
      tentativasFalhas: falhasSeguidas,
    });
  }

  async function processar() {
    if (rodando) return;
    rodando = true;

    // Uma recusa não interrompe a fila: as outras respostas continuam subindo,
    // e o motivo fica guardado para ser mostrado no fim da rodada.
    let recusa: string | null = null;

    try {
      while (pendentes.size > 0) {
        const [chave, dados] = pendentes.entries().next().value as [
          string,
          unknown,
        ];

        mudar("salvando");

        let resultado: ResultadoDoEnvio;
        try {
          resultado = await opcoes.reconstruir(dados)();
        } catch (falha) {
          falhasSeguidas += 1;

          /*
           * Versão velha não entra no ciclo de repetição.
           *
           * Repetir aqui é gastar bateria e rede numa chamada que o servidor
           * não tem mais como aceitar. Pior: enquanto a fila "tenta", a tela
           * diz que as respostas sobem sozinhas — e não sobem. A pendência
           * continua guardada no aparelho; o que muda é a tela pedir a única
           * coisa que resolve.
           */
          if (ehVersaoVelha(falha as Error)) {
            mudar("versao-velha");
            return;
          }

          tentativa += 1;
          cancelarEspera = agendar(() => {
            cancelarEspera = null;
            void processar();
          }, esperaDaTentativa(tentativa));
          mudar(pareceQuedaDeRede(falha) ? "aguardando-rede" : "servidor-instavel");
          return;
        }

        // A resposta pode ter sido trocada enquanto esta subia. Só remove a
        // pendência se ela ainda for a mesma que acabou de ser aceita.
        if (pendentes.get(chave) === dados) {
          pendentes.delete(chave);
          gravarNoDisco();
        }

        tentativa = 0;
        falhasSeguidas = 0;
        if (!resultado.ok) recusa = resultado.erro ?? "Não foi possível salvar.";
      }

      if (recusa) mudar("recusado", recusa);
      else mudar("salvo");
    } finally {
      rodando = false;
    }
  }

  function tentarAgora() {
    cancelarEspera?.();
    cancelarEspera = null;
    tentativa = 0;
    void processar();
  }

  // O que ficou de uma sessão anterior sobe antes de qualquer resposta nova.
  lerDoDisco();
  if (pendentes.size > 0) void processar();

  return {
    enfileirar(chave, dados) {
      pendentes.set(chave, dados);
      gravarNoDisco();
      // Uma resposta nova é também um pedido implícito de "tenta agora": se a
      // rede voltou, não faz sentido esperar o fim do backoff para descobrir.
      if (situacao === "aguardando-rede" || situacao === "servidor-instavel") tentarAgora();
      else void processar();
    },

    tentarAgora,

    encerrar() {
      cancelarEspera?.();
      cancelarEspera = null;
    },
  };
}
