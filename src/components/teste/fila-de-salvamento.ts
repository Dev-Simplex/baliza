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

export type ResultadoDoEnvio = { ok: boolean; erro?: string };
export type Envio = () => Promise<ResultadoDoEnvio>;

export type SituacaoDaFila =
  | "ocioso"
  | "salvando"
  | "salvo"
  /** Tem coisa pendente e a última tentativa estourou: vamos tentar de novo. */
  | "aguardando-rede"
  /** O servidor recusou. Não adianta repetir. */
  | "recusado";

export type EstadoDaFila = {
  situacao: SituacaoDaFila;
  pendentes: number;
  erro: string | null;
};

export type Fila = {
  enfileirar: (chave: string, envio: Envio) => void;
  tentarAgora: () => void;
  encerrar: () => void;
};

const ESPERA_MAXIMA_MS = 15_000;

/** 1s, 2s, 4s, 8s, 15s, 15s… — rápido no soluço, sem martelar na queda longa. */
export function esperaDaTentativa(tentativa: number) {
  return Math.min(1000 * 2 ** Math.max(0, tentativa - 1), ESPERA_MAXIMA_MS);
}

export function criarFila(opcoes: {
  aoMudar: (estado: EstadoDaFila) => void;
  /** Injetável para o teste não depender do relógio. */
  agendar?: (acao: () => void, ms: number) => () => void;
}): Fila {
  const agendar =
    opcoes.agendar ??
    ((acao: () => void, ms: number) => {
      const id = setTimeout(acao, ms);
      return () => clearTimeout(id);
    });

  const pendentes = new Map<string, Envio>();
  let rodando = false;
  let tentativa = 0;
  let cancelarEspera: (() => void) | null = null;
  let situacao: SituacaoDaFila = "ocioso";
  let erro: string | null = null;

  function mudar(nova: SituacaoDaFila, novoErro: string | null = null) {
    situacao = nova;
    erro = novoErro;
    opcoes.aoMudar({ situacao, pendentes: pendentes.size, erro });
  }

  async function processar() {
    if (rodando) return;
    rodando = true;

    // Uma recusa não interrompe a fila: as outras respostas continuam subindo,
    // e o motivo fica guardado para ser mostrado no fim da rodada.
    let recusa: string | null = null;

    try {
      while (pendentes.size > 0) {
        const [chave, envio] = pendentes.entries().next().value as [
          string,
          Envio,
        ];

        mudar("salvando");

        let resultado: ResultadoDoEnvio;
        try {
          resultado = await envio();
        } catch {
          tentativa += 1;
          cancelarEspera = agendar(() => {
            cancelarEspera = null;
            void processar();
          }, esperaDaTentativa(tentativa));
          mudar("aguardando-rede");
          return;
        }

        // A resposta pode ter sido trocada enquanto esta subia. Só remove a
        // pendência se ela ainda for a mesma que acabou de ser aceita.
        if (pendentes.get(chave) === envio) pendentes.delete(chave);

        tentativa = 0;
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

  return {
    enfileirar(chave, envio) {
      pendentes.set(chave, envio);
      // Uma resposta nova é também um pedido implícito de "tenta agora": se a
      // rede voltou, não faz sentido esperar o fim do backoff para descobrir.
      if (situacao === "aguardando-rede") tentarAgora();
      else void processar();
    },

    tentarAgora,

    encerrar() {
      cancelarEspera?.();
      cancelarEspera = null;
    },
  };
}
