"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, CloudOff, Loader2, RotateCw } from "lucide-react";

import {
  criarFila,
  FALHAS_PARA_MUDAR_O_TOM,
  type EstadoDaFila,
  type Fila,
} from "@/components/teste/fila-de-salvamento";
import { ReguaDeProgresso } from "@/components/teste/regua-de-progresso";
import { rotuloDoRestante } from "@/components/teste/tempo-estimado";
import { TrilhaDeEtapas } from "@/components/teste/trilha-de-etapas";
import {
  perguntaRespondida,
  type DadosDoTeste,
  type EtapaDaProva,
  type OpcaoDeEscala,
  type OpcaoDePergunta,
  type Pergunta,
  type RespostasSalvas,
} from "@/components/teste/tipos-da-prova";
import { Button } from "@/components/ui/button";
import {
  concluirAvaliacao,
  salvarCenario,
  salvarEscolha,
  salvarResposta,
} from "@/lib/actions/avaliacao";
import { cn } from "@/lib/utils";

/**
 * A prova do candidato, um teste por vez.
 *
 * ─── O que mudou, e por quê ────────────────────────────────────────────────
 * Isto já foi uma fila única: um índice percorria as afirmações e depois os
 * cenários, e um booleano decidia qual dos dois desenhar. Funcionava com um
 * instrumento e um formato e meio. Com quatro testes — cada um com a sua
 * instrução, o seu tipo de pergunta e o seu progresso —, aquele booleano teria
 * virado três, e a tela deixaria de saber responder a pergunta mais simples de
 * todas: "em que teste eu estou?".
 *
 * Agora a prova é uma lista de ETAPAS, uma por teste da bateria, e cada etapa
 * tem as suas perguntas. Continua existindo um índice só, global, porque é ele
 * que faz "voltar" atravessar a fronteira entre dois testes sem caso especial —
 * mas ele é traduzido para (etapa, posição) na hora de mostrar qualquer coisa.
 *
 * O que NÃO mudou, de propósito: a fila de salvamento, o aviso de rede caída, o
 * retomar de onde parou e a recusa de concluir prova incompleta. Cada um desses
 * é cicatriz de um jeito específico de perder a resposta de alguém.
 */

/** O rótulo do heading da vez. Serve de nome acessível para a área da pergunta. */
const ID_DA_PERGUNTA = "pergunta-atual";

type Tela = { etapa: number; posicao: number; pergunta: Pergunta };

/**
 * A pendência como ela vai para o disco.
 *
 * Discriminada por `tipo` porque a fila é cega ao conteúdo: ela guarda, devolve
 * e reenvia sem saber o que é. Quem traduz de volta é o `reconstruir` logo
 * abaixo — e é por isso que este tipo precisa ser puro JSON, sem função nem
 * classe no meio.
 */
type PendenciaDeResposta =
  | { tipo: "item"; itemId: string; valor: number; tempoMs?: number }
  | {
      tipo: "bloco";
      blocoId: string;
      primeiraId: string;
      ultimaId: string;
      tempoMs?: number;
    }
  | { tipo: "escolha"; blocoId: string; escolhaId: string; tempoMs?: number };

/**
 * O teclado que `role="radiogroup"` promete — e que não existia.
 *
 * O papel diz ao leitor de tela: "grupo de opções, 1 de 5". Quem ouve isso faz
 * o que o padrão manda e aperta uma seta. Aqui não acontecia nada — e no eixo
 * horizontal era pior: `ArrowLeft`/`ArrowRight` estão capturados na janela para
 * trocar de PERGUNTA, então a seta jogava a pessoa para a tela anterior sem
 * anunciar nada.
 *
 * Além disso os cinco botões tinham `tabIndex` 0, ou seja cinco paradas de Tab
 * por tela: numa bateria completa, ~395 Tabs a mais do que o padrão pede.
 *
 * As duas coisas se resolvem juntas com o "tabIndex rotativo": só UM botão do
 * grupo é tabulável (o marcado, ou o primeiro quando nada está marcado), e as
 * setas movem o foco dentro do grupo — parando a propagação, para o atalho de
 * navegação entre perguntas não roubar a tecla.
 */
function useTecladoDeGrupo(indiceMarcado: number) {
  const grupo = useRef<HTMLDivElement | null>(null);

  const aoTeclar = useCallback(
    (evento: React.KeyboardEvent) => {
      const teclas = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
      if (!teclas.includes(evento.key)) return;

      const botoes = Array.from(
        grupo.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]') ?? [],
      );
      if (botoes.length === 0) return;

      const atual = botoes.findIndex((b) => b === document.activeElement);
      // Fora do grupo: a seta segue valendo para navegar entre perguntas.
      if (atual < 0) return;

      evento.preventDefault();
      evento.stopPropagation();

      const passo =
        evento.key === "ArrowDown" || evento.key === "ArrowRight" ? 1 : -1;
      const proximo =
        evento.key === "Home"
          ? 0
          : evento.key === "End"
            ? botoes.length - 1
            : (atual + passo + botoes.length) % botoes.length;

      botoes[proximo]?.focus();
    },
    [],
  );

  /** Só um botão entra na ordem de tabulação — o padrão do radiogroup. */
  const tabIndexDe = useCallback(
    (i: number) => (i === (indiceMarcado >= 0 ? indiceMarcado : 0) ? 0 : -1),
    [indiceMarcado],
  );

  return { grupo, aoTeclar, tabIndexDe };
}

export function FluxoDoTeste({ dados }: { dados: DadosDoTeste }) {
  const router = useRouter();
  const semMovimento = useReducedMotion();

  const etapas = dados.etapas;

  // A prova inteira em fila, com a etapa carimbada em cada tela. É o que
  // permite um índice global só — e "voltar" da primeira pergunta de um teste
  // cair na última do anterior sem nenhum caso especial.
  const telas = useMemo<Tela[]>(
    () =>
      etapas.flatMap((etapa, ie) =>
        etapa.perguntas.map((pergunta, ip) => ({
          etapa: ie,
          posicao: ip,
          pergunta,
        })),
      ),
    [etapas],
  );

  const total = telas.length;

  const [salvas, setSalvas] = useState<RespostasSalvas>(dados.salvas);
  const [concluindo, setConcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [estadoDaFila, setEstadoDaFila] = useState<EstadoDaFila>({
    situacao: "ocioso",
    pendentes: 0,
    erro: null,
    tentativasFalhas: 0,
  });

  // A fila é criada uma vez por prova e sobrevive a toda re-renderização: é ela
  // que segura as respostas que ainda não foram aceitas pelo servidor.
  const filaRef = useRef<Fila | null>(null);
  if (filaRef.current === null) {
    filaRef.current = criarFila({
      aoMudar: setEstadoDaFila,
      // A chave é por PROVA. Duas abas da mesma prova compartilham a fila de
      // propósito (é a mesma pessoa); provas diferentes nunca se misturam.
      chaveDeArmazenamento: `prumo:fila:${dados.token}`,
      // A fila guarda dado; quem sabe virar chamada é este mapa. Ele mora aqui,
      // e não na fila, porque é o único lugar que já conhece as actions.
      reconstruir: (bruto) => {
        const d = bruto as PendenciaDeResposta;
        if (d.tipo === "item")
          return () => salvarResposta(dados.token, { itemId: d.itemId, valor: d.valor, tempoMs: d.tempoMs });
        if (d.tipo === "bloco")
          return () =>
            salvarCenario(dados.token, {
              blocoId: d.blocoId,
              primeiraId: d.primeiraId,
              ultimaId: d.ultimaId,
              tempoMs: d.tempoMs,
            });
        return () => salvarEscolha(dados.token, { blocoId: d.blocoId, escolhaId: d.escolhaId, tempoMs: d.tempoMs });
      },
    });
  }

  const respondidos = useMemo(() => {
    const marcados = new Set<number>();
    telas.forEach((tela, i) => {
      if (perguntaRespondida(tela.pergunta, salvas)) marcados.add(i);
    });
    return marcados;
  }, [telas, salvas]);

  // Retoma exatamente onde parou — inclusive no meio de um teste, e sabendo em
  // qual teste era: a primeira pergunta ainda sem resposta da bateria inteira.
  const indiceInicial = useMemo(() => {
    for (let i = 0; i < telas.length; i += 1) {
      if (!perguntaRespondida(telas[i].pergunta, dados.salvas)) return i;
    }
    return Math.max(0, telas.length - 1);
    // Só na abertura: depois disso quem manda no índice é a navegação.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telas]);

  const [indice, setIndice] = useState(indiceInicial);

  // Quantas já estavam salvas quando esta página abriu. Se for mais que zero, a
  // pessoa está VOLTANDO — e o medo dela é ter perdido o que já respondeu.
  const jaRespondidasAoAbrir = useMemo(
    () =>
      Object.keys(dados.salvas.itens).length +
      Object.keys(dados.salvas.blocos).length +
      Object.keys(dados.salvas.escolhas).length,
    [dados.salvas],
  );

  const inicioDaPergunta = useRef(0);
  const avancoAgendado = useRef<number | null>(null);
  const areaDaPergunta = useRef<HTMLDivElement | null>(null);
  const primeiraPintura = useRef(true);

  const telaAtual = telas[indice];
  const indiceDaEtapa = telaAtual?.etapa ?? 0;
  const etapaAtual: EtapaDaProva | undefined = etapas[indiceDaEtapa];

  // A capa da etapa: o teste se apresenta antes de perguntar qualquer coisa.
  //
  // Ela aparece uma vez por teste, e some assim que existe resposta ali dentro
  // — quem retoma no meio do DISC não é obrigado a reler a instrução para voltar
  // a responder. É também o único lugar onde a instrução exata do manual cabe
  // inteira: repeti-la nas 79 telas viraria ruído.
  const [capasVistas, setCapasVistas] = useState<number[]>([]);

  const respondidasNaEtapa = useMemo(() => {
    let n = 0;
    telas.forEach((tela, i) => {
      if (tela.etapa === indiceDaEtapa && respondidos.has(i)) n += 1;
    });
    return n;
  }, [telas, respondidos, indiceDaEtapa]);

  const mostrarCapa =
    Boolean(etapaAtual) &&
    !capasVistas.includes(indiceDaEtapa) &&
    respondidasNaEtapa === 0;

  useEffect(() => {
    inicioDaPergunta.current = Date.now();
  }, [indice]);

  /**
   * Tempo gasto na pergunta, em milissegundos.
   *
   * O teto de 10 minutos não é enfeite: é o mesmo limite que o servidor valida.
   * Quem deixa a aba aberta durante o almoço voltava com um `tempoMs` fora da
   * faixa, a gravação era recusada como "resposta inválida" e a resposta se
   * perdia — justamente a de quem tinha pensado mais. O sinal de confiança
   * olha para tempo CURTO demais; um teto no longo não custa nada a ele.
   */
  const tempoNaPergunta = useCallback(() => {
    if (!inicioDaPergunta.current) return undefined;
    return Math.min(600_000, Math.max(0, Date.now() - inicioDaPergunta.current));
  }, []);

  const cancelarAvanco = useCallback(() => {
    if (avancoAgendado.current !== null) {
      window.clearTimeout(avancoAgendado.current);
      avancoAgendado.current = null;
    }
  }, []);

  const irPara = useCallback(
    (destino: number) => {
      cancelarAvanco();
      setIndice(Math.max(0, Math.min(destino, total - 1)));
    },
    [cancelarAvanco, total],
  );

  const avancar = useCallback(() => {
    irPara(indice + 1);
  }, [irPara, indice]);

  /**
   * Avanço automático depois de responder.
   *
   * O agendamento é cancelado antes de criar outro porque trocar de resposta
   * dentro da janela de 240 ms empilhava DOIS avanços — a tela pulava uma
   * pergunta, e ela só reaparecia lá no fim como "falta 1 resposta", sem a
   * pessoa fazer ideia de onde tinha ficado.
   */
  const agendarAvanco = useCallback(() => {
    cancelarAvanco();
    avancoAgendado.current = window.setTimeout(
      () => {
        avancoAgendado.current = null;
        setIndice((i) => Math.min(i + 1, total - 1));
      },
      semMovimento ? 60 : 240,
    );
  }, [cancelarAvanco, semMovimento, total]);

  const responderItem = useCallback(
    (itemId: string, valor: number) => {
      const tempoMs = tempoNaPergunta();
      setSalvas((s) => ({ ...s, itens: { ...s.itens, [itemId]: valor } }));
      setErro(null);
      filaRef.current?.enfileirar(`item:${itemId}`, {
        tipo: "item",
        itemId,
        valor,
        tempoMs,
      } satisfies PendenciaDeResposta);
      agendarAvanco();
    },
    [agendarAvanco, tempoNaPergunta],
  );

  /**
   * O par MAIS/MENOS — as situações da Baliza e os blocos de palavras do DISC.
   *
   * Os dois gravam pelo mesmo caminho porque a resposta tem a mesma forma. Só o
   * avanço difere: o bloco de palavras anda sozinho quando o par fecha (são 12
   * telas iguais em sequência, e parar em cada uma cansa), e a situação da Baliza
   * continua esperando — ela é longa, e a pessoa costuma querer reler o que
   * marcou antes de seguir.
   */
  const responderBloco = useCallback(
    (blocoId: string, primeiraId: string, ultimaId: string, avancarDepois: boolean) => {
      const tempoMs = tempoNaPergunta();
      setSalvas((s) => ({
        ...s,
        blocos: { ...s.blocos, [blocoId]: { primeiraId, ultimaId } },
      }));
      setErro(null);
      filaRef.current?.enfileirar(`bloco:${blocoId}`, {
        tipo: "bloco",
        blocoId,
        primeiraId,
        ultimaId,
        tempoMs,
      } satisfies PendenciaDeResposta);
      if (avancarDepois) agendarAvanco();
    },
    [agendarAvanco, tempoNaPergunta],
  );

  const responderEscolha = useCallback(
    (blocoId: string, escolhaId: string) => {
      const tempoMs = tempoNaPergunta();
      setSalvas((s) => ({
        ...s,
        escolhas: { ...s.escolhas, [blocoId]: escolhaId },
      }));
      setErro(null);
      filaRef.current?.enfileirar(`escolha:${blocoId}`, {
        tipo: "escolha",
        blocoId,
        escolhaId,
        tempoMs,
      } satisfies PendenciaDeResposta);
      agendarAvanco();
    },
    [agendarAvanco, tempoNaPergunta],
  );

  // Rede que volta, aba que volta ao primeiro plano: os dois são o momento de
  // tentar de novo sem esperar o fim do backoff. No celular o segundo é o que
  // mais acontece — o navegador congela a aba de fundo e a fila para junto.
  useEffect(() => {
    const fila = filaRef.current;
    const retomar = () => fila?.tentarAgora();
    const aoVoltarAAba = () => {
      if (document.visibilityState === "visible") retomar();
    };

    window.addEventListener("online", retomar);
    document.addEventListener("visibilitychange", aoVoltarAAba);
    return () => {
      window.removeEventListener("online", retomar);
      document.removeEventListener("visibilitychange", aoVoltarAAba);
    };
  }, []);

  useEffect(() => {
    return () => {
      filaRef.current?.encerrar();
      if (avancoAgendado.current !== null)
        window.clearTimeout(avancoAgendado.current);
    };
  }, []);

  // Só avisa quando existe mesmo resposta em trânsito. Fora disso, fechar a aba
  // é seguro e o produto promete isso em voz alta — o aviso não pode desmentir.
  useEffect(() => {
    if (estadoDaFila.pendentes === 0) return;
    const avisar = (evento: BeforeUnloadEvent) => evento.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [estadoDaFila.pendentes]);

  /**
   * Troca de pergunta: leva o foco (e a rolagem) para o alto. Sem isso, quem
   * usa teclado ou leitor de tela continua no rodapé da tela anterior, e quem
   * rolou uma pergunta longa no celular cai no meio da próxima.
   *
   * Precisa ser ref de callback, e não efeito no índice: o `AnimatePresence`
   * em `mode="wait"` só monta a pergunta nova DEPOIS que a anterior termina de
   * sair. Um efeito disparado na troca do índice pegaria a tela velha saindo —
   * daria foco num nó que está prestes a ser removido, e o foco voltaria para o
   * corpo do documento. A ref de callback roda quando o nó novo entra, que é
   * exatamente o momento certo.
   */
  const conectarAreaDaPergunta = useCallback(
    (node: HTMLDivElement | null) => {
      areaDaPergunta.current = node;
      if (!node) return;

      // Na primeira pintura ninguém pediu nada: roubar o foco de quem acabou de
      // abrir a página atrapalharia a leitura da orientação inicial.
      if (primeiraPintura.current) {
        primeiraPintura.current = false;
        return;
      }

      node.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: semMovimento ? "auto" : "smooth" });
    },
    [semMovimento],
  );

  const pergunta = telaAtual?.pergunta;

  /**
   * Teclado: dígitos respondem, setas navegam. Quem responde 79 perguntas no
   * computador não quer usar o mouse 79 vezes.
   *
   * O bloco de MAIS/MENOS fica de fora do atalho por dígito de propósito: um
   * número sozinho não diz qual das duas colunas foi marcada, e um atalho que
   * marca a coluna errada é pior que atalho nenhum. Ali a navegação é por Tab,
   * que a grade de botões já atende.
   */
  useEffect(() => {
    if (mostrarCapa || !pergunta) return;

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
      if (!pergunta) return;

      if (pergunta.tipo === "likert" && /^[1-5]$/.test(evento.key)) {
        evento.preventDefault();
        responderItem(pergunta.id, Number(evento.key));
        return;
      }

      if (
        pergunta.tipo === "escolha" ||
        pergunta.tipo === "escolha-curta" ||
        pergunta.tipo === "binaria"
      ) {
        const n = Number(evento.key);
        if (Number.isInteger(n) && n >= 1 && n <= pergunta.opcoes.length) {
          evento.preventDefault();
          responderEscolha(pergunta.id, pergunta.opcoes[n - 1].id);
          return;
        }
      }

      if (evento.key === "ArrowLeft" && indice > 0) {
        evento.preventDefault();
        irPara(indice - 1);
      }
      if (evento.key === "ArrowRight" && respondidos.has(indice)) {
        evento.preventDefault();
        avancar();
      }
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [
    mostrarCapa,
    pergunta,
    indice,
    responderItem,
    responderEscolha,
    avancar,
    irPara,
    respondidos,
  ]);

  const tudoRespondido = respondidos.size === total;
  const naUltima = indice === total - 1;
  const quantasFaltam = total - respondidos.size;
  const temPendencia = estadoDaFila.pendentes > 0;

  /**
   * A frase do aviso conta a verdade sobre QUEM está fora do ar.
   *
   * Dizer "sem conexão" para quem tem internet manda a pessoa consertar o que
   * não está quebrado: ela troca de wi-fi, vai para o 4G, reinicia o roteador —
   * e continua lendo a mesma frase, porque o problema é do servidor.
   */
  const tituloDaFalha =
    estadoDaFila.situacao === "servidor-instavel"
      ? "Não estamos conseguindo falar com o servidor."
      : "Sem conexão.";

  /**
   * E depois de muitas tentativas, a promessa muda de tom em vez de se repetir.
   * A pessoa precisa saber que pode fechar — antes, a tela pedia para ela ficar
   * esperando indefinidamente, e quem fecha assim mesmo (ou tem a aba
   * descartada) perdia a prova. Agora não perde: a fila está no aparelho.
   */
  const textoDeEspera =
    estadoDaFila.tentativasFalhas >= FALHAS_PARA_MUDAR_O_TOM
      ? "isto está demorando mais que o normal. Você pode fechar esta página e voltar depois pelo mesmo link: nada do que você respondeu se perde."
      : "pode continuar respondendo normalmente.";

  // A última pergunta não avança sozinha — não há para onde. Num celular baixo,
  // o "Concluir" fica abaixo da dobra, e a tela parece não ter reagido à última
  // resposta: fim de prova com cara de travamento. Trazer o rodapé à vista é o
  // que fecha o ciclo.
  useEffect(() => {
    if (!naUltima || !tudoRespondido || mostrarCapa) return;
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: semMovimento ? "auto" : "smooth",
    });
  }, [naUltima, tudoRespondido, mostrarCapa, semMovimento]);

  // O que falta é da BATERIA inteira, não da etapa: a pergunta que decide se a
  // pessoa continua agora ou fecha a aba é "quanto ainda falta disso tudo".
  const restante = rotuloDoRestante(
    telas.filter((_, i) => i > indice && !respondidos.has(i)).map((t) => t.pergunta),
  );

  const respondidosNaEtapa = useMemo(() => {
    const marcados = new Set<number>();
    telas.forEach((tela, i) => {
      if (tela.etapa === indiceDaEtapa && respondidos.has(i))
        marcados.add(tela.posicao);
    });
    return marcados;
  }, [telas, respondidos, indiceDaEtapa]);

  const etapasConcluidas = useMemo(
    () =>
      etapas.map((etapa, ie) =>
        telas.every((tela, i) => tela.etapa !== ie || respondidos.has(i)) &&
        etapa.perguntas.length > 0,
      ),
    [etapas, telas, respondidos],
  );

  /**
   * Primeira pergunta ainda em branco.
   *
   * Existe por causa de um beco sem saída real: quem pulava uma pergunta lá
   * atrás chegava na última tela, via tudo respondido ALI, e encontrava o
   * "Concluir" desabilitado sem nenhuma explicação e sem caminho de volta —
   * teria que clicar "Voltar" às cegas dezenas de vezes para achar o buraco.
   */
  function irParaAPrimeiraEmBranco() {
    for (let i = 0; i < total; i += 1) {
      if (!respondidos.has(i)) {
        irPara(i);
        return;
      }
    }
  }

  const concluir = useCallback(async () => {
    cancelarAvanco();
    setConcluindo(true);
    setErro(null);

    let resultado: Awaited<ReturnType<typeof concluirAvaliacao>>;
    try {
      resultado = await concluirAvaliacao(dados.token);
    } catch {
      // Sem este `catch` a rede caindo aqui deixava o botão em "Enviando" para
      // sempre, sem erro e sem saída: a pessoa terminava a prova inteira e
      // travava na última tela.
      setConcluindo(false);
      setErro(
        "Não conseguimos enviar agora — a conexão parece ter caído. Suas respostas estão guardadas: toque em Concluir de novo quando a internet voltar.",
      );
      return;
    }

    if (resultado.ok) {
      // `refresh()` e não `push()`: a mesma rota `/t/<token>` passa a renderizar
      // a tela de conclusão assim que o servidor vê a avaliação como concluída.
      router.refresh();
      return;
    }

    setErro(resultado.erro ?? "Não foi possível concluir.");
    setConcluindo(false);

    // O servidor viu resposta faltando que o navegador achava que tinha salvo.
    // Recarregar é seguro porque o botão só fica ativo com a fila vazia: o que
    // o navegador tem, o servidor já aceitou. A retomada existente coloca a
    // pessoa exatamente na primeira em branco.
    if ("incompleta" in resultado && resultado.incompleta) {
      window.setTimeout(() => window.location.reload(), 1600);
    }
  }, [cancelarAvanco, dados.token, router]);

  // Bateria sem uma pergunta sequer. Não deveria acontecer — a vaga exige pelo
  // menos um teste —, mas uma tela em branco com um botão morto seria o pior
  // jeito de descobrir que aconteceu.
  if (total === 0 || !etapaAtual || !telaAtual) {
    return (
      <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-6 text-center">
        <h1 className="t-secao font-medium">Este questionário está vazio.</h1>
        <p className="mt-3 t-corpo text-muted-foreground">
          Nenhuma pergunta foi preparada para este convite. Avise quem te enviou
          o link — não é nada que você tenha feito.
        </p>
      </div>
    );
  }

  // `w-full min-w-0`: sem eles o contêiner cresce com o conteúdo em vez de
  // conter, e a página inteira ganha rolagem lateral quando alguém amplia o
  // texto. A margem em px, e não em rem, é de propósito — padding que cresce
  // junto com a fonte é parte do que empurrava a página para fora a 200%.
  return (
    <div className="mx-auto flex min-h-svh w-full min-w-0 max-w-2xl flex-col bg-background px-[20px] py-6 sm:px-8">
      <header className="shrink-0 space-y-3">
        <TrilhaDeEtapas
          etapas={etapas.map((e) => ({ curto: e.curto, teste: e.teste }))}
          atual={indiceDaEtapa}
          concluidas={etapasConcluidas}
        />

        <ReguaDeProgresso
          total={etapaAtual.perguntas.length}
          atual={telaAtual.posicao}
          respondidos={respondidosNaEtapa}
          etapa={
            etapas.length > 1
              ? `Teste ${indiceDaEtapa + 1} de ${etapas.length} · ${etapaAtual.nome}`
              : etapaAtual.nome
          }
          etapaCurta={
            etapas.length > 1
              ? `${indiceDaEtapa + 1}/${etapas.length} · ${etapaAtual.curto}`
              : etapaAtual.curto
          }
          restante={restante}
        />
      </header>

      <main className="flex flex-1 flex-col justify-center py-8 sm:py-10">
        {/* Quem fecha a prova no meio volta com uma dúvida só: "perdi tudo?".
            Responder isso na hora custa uma linha e salva a resposta inteira. */}
        {jaRespondidasAoAbrir > 0 && indice === indiceInicial && !mostrarCapa && (
          <p className="mb-6 flex items-start gap-2 rounded-lg border border-dentro/30 bg-dentro/5 px-3.5 py-2.5 t-legenda leading-relaxed">
            <Check className="mt-px size-4 shrink-0 text-dentro" />
            <span>
              Bem-vindo de volta. Suas{" "}
              <strong className="font-medium">
                {jaRespondidasAoAbrir}{" "}
                {jaRespondidasAoAbrir === 1
                  ? "resposta anterior está salva"
                  : "respostas anteriores estão salvas"}
              </strong>
              . Você parou aqui.
            </span>
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={mostrarCapa ? `capa-${indiceDaEtapa}` : indice}
            ref={conectarAreaDaPergunta}
            tabIndex={-1}
            aria-labelledby={ID_DA_PERGUNTA}
            className="outline-none"
            initial={semMovimento ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={semMovimento ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {mostrarCapa ? (
              <CapaDaEtapa
                etapa={etapaAtual}
                numero={indiceDaEtapa + 1}
                de={etapas.length}
                primeira={indiceDaEtapa === 0}
                aoComecar={() =>
                  setCapasVistas((vistas) =>
                    vistas.includes(indiceDaEtapa)
                      ? vistas
                      : [...vistas, indiceDaEtapa],
                  )
                }
              />
            ) : (
              <PerguntaDaVez
                pergunta={telaAtual.pergunta}
                etapa={etapaAtual}
                salvas={salvas}
                aoResponderItem={responderItem}
                aoResponderBloco={responderBloco}
                aoResponderEscolha={responderEscolha}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="shrink-0 space-y-3">
        {/* Leitor de tela: só o que é problema. Anunciar "salvo" 79 vezes
            atrapalharia justamente quem depende do anúncio. */}
        <p role="status" aria-live="polite" className="sr-only">
          {estadoDaFila.situacao === "aguardando-rede" ||
          estadoDaFila.situacao === "servidor-instavel"
            ? `${tituloDaFalha} ${estadoDaFila.pendentes} resposta(s) guardadas no aparelho.`
            : estadoDaFila.situacao === "recusado"
              ? (estadoDaFila.erro ?? "")
              : ""}
        </p>

        {(estadoDaFila.situacao === "aguardando-rede" ||
          estadoDaFila.situacao === "servidor-instavel") && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-fora/30 bg-fora/5 px-3 py-2.5">
            <p className="flex items-start gap-2 text-sm">
              <CloudOff className="mt-0.5 size-4 shrink-0 text-fora" />
              <span>
                {tituloDaFalha} Suas respostas ficam guardadas neste aparelho e
                sobem sozinhas — {textoDeEspera}
              </span>
            </p>
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5"
              onClick={() => filaRef.current?.tentarAgora()}
            >
              <RotateCw className="size-3.5" />
              Tentar agora
            </Button>
          </div>
        )}

        {(erro ?? estadoDaFila.erro) && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {erro ?? estadoDaFila.erro}
          </p>
        )}

        {/* `fora` é a cor de ATENÇÃO do produto (argila), nunca de alarme — a
            mesma regra do medidor de faixa. Aqui vale igual: falta resposta,
            não deu erro. */}
        {naUltima && !tudoRespondido && !mostrarCapa && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-fora/30 bg-fora/5 px-3 py-2.5">
            <p className="text-sm text-foreground">
              {quantasFaltam === 1
                ? "Falta 1 resposta para concluir."
                : `Faltam ${quantasFaltam} respostas para concluir.`}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={irParaAPrimeiraEmBranco}
              className="gap-1.5"
            >
              Ir para a primeira
              <ArrowLeft className="size-3.5 rotate-180" />
            </Button>
          </div>
        )}

        {!mostrarCapa && (
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => irPara(indice - 1)}
              disabled={indice === 0}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-0 sm:min-h-9"
            >
              <ArrowLeft className="size-4" />
              Voltar
            </button>

            <IndicadorDeSalvamento estado={estadoDaFila} />

            {/* O "Concluir" só existe no fim da BATERIA. Entre um teste e outro
                o botão continua sendo "Próxima": a prova só vira relatório
                inteira, e oferecer saída antes disso seria oferecer um beco. */}
            {naUltima || tudoRespondido ? (
              <Button
                onClick={concluir}
                disabled={!tudoRespondido || concluindo || temPendencia}
                variant="marca"
                className="h-11 gap-2 px-5 sm:h-9"
              >
                {concluindo ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Enviando
                  </>
                ) : (
                  <>
                    Concluir
                    <Check className="size-4" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={avancar}
                disabled={!respondidos.has(indice)}
                className="h-11 px-4 text-muted-foreground sm:h-9"
              >
                Próxima
              </Button>
            )}
          </div>
        )}

        {/* Sem conexão, esta linha calaria por cima do aviso de cima: prometer
            "salva sozinho, pode fechar" no exato momento em que fechar perde
            resposta é o único jeito de a promessa virar mentira. */}
        {estadoDaFila.situacao !== "aguardando-rede" && (
          <p className="pb-1 text-center t-legenda text-muted-foreground">
            {temPendencia
              ? "Estamos enviando suas últimas respostas."
              : "Suas respostas são salvas sozinhas. Você pode fechar e continuar depois pelo mesmo link."}
          </p>
        )}
      </footer>
    </div>
  );
}

/** Despacha para a tela do tipo certo. Um `switch` só, e ele mora aqui. */
function PerguntaDaVez({
  pergunta,
  etapa,
  salvas,
  aoResponderItem,
  aoResponderBloco,
  aoResponderEscolha,
}: {
  pergunta: Pergunta;
  etapa: EtapaDaProva;
  salvas: RespostasSalvas;
  aoResponderItem: (id: string, valor: number) => void;
  aoResponderBloco: (
    id: string,
    primeiraId: string,
    ultimaId: string,
    avancarDepois: boolean,
  ) => void;
  aoResponderEscolha: (id: string, escolhaId: string) => void;
}) {
  switch (pergunta.tipo) {
    case "likert":
      return (
        <PerguntaLikert
          texto={pergunta.texto}
          enunciado={etapa.enunciado ?? "O quanto isso combina com você?"}
          escala={etapa.escala ?? []}
          valor={salvas.itens[pergunta.id] ?? null}
          aoResponder={(v) => aoResponderItem(pergunta.id, v)}
        />
      );

    case "ordenar":
      return (
        <PerguntaDeCenario
          titulo={pergunta.titulo}
          situacao={pergunta.situacao}
          opcoes={pergunta.opcoes}
          escolha={salvas.blocos[pergunta.id] ?? null}
          aoResponder={(primeira, ultima) =>
            aoResponderBloco(pergunta.id, primeira, ultima, false)
          }
        />
      );

    case "mais-menos":
      return (
        <PerguntaDeMaisMenos
          key={pergunta.id}
          opcoes={pergunta.opcoes}
          escolha={salvas.blocos[pergunta.id] ?? null}
          aoResponder={(mais, menos) =>
            aoResponderBloco(pergunta.id, mais, menos, true)
          }
        />
      );

    case "escolha-curta":
    case "binaria":
    case "escolha":
      return (
        <PerguntaDeEscolhaUnica
          situacao={pergunta.situacao}
          opcoes={pergunta.opcoes}
          escolha={salvas.escolhas[pergunta.id] ?? null}
          aoResponder={(id) => aoResponderEscolha(pergunta.id, id)}
        />
      );
  }
}

/**
 * A capa de um teste: nome, instrução exata do manual e o tamanho da coisa.
 *
 * Ela existe porque "abas diferentes" não é layout, é contrato: cada teste
 * pergunta de um jeito e pede uma atitude diferente de quem responde. Entrar no
 * SJT achando que ainda é a escala de 1 a 5 é o caminho mais curto para uma
 * resposta que não mede nada.
 */
function CapaDaEtapa({
  etapa,
  numero,
  de,
  primeira,
  aoComecar,
}: {
  etapa: EtapaDaProva;
  numero: number;
  de: number;
  primeira: boolean;
  aoComecar: () => void;
}) {
  return (
    <div>
      {de > 1 && (
        <p className="etiqueta mb-3">
          Teste {numero} de {de}
        </p>
      )}

      <h1
        id={ID_DA_PERGUNTA}
        className="text-balance t-titulo leading-[1.2] font-semibold tracking-tight"
      >
        {etapa.nome}
      </h1>

      <p className="mt-5 text-balance t-corpo leading-relaxed text-muted-foreground">
        {etapa.instrucao}
      </p>

      <p className="mt-6 t-corpo-sm text-muted-foreground">
        {etapa.perguntas.length}{" "}
        {etapa.perguntas.length === 1 ? "pergunta" : "perguntas"}
        {primeira && " · cada resposta é salva na hora"}
      </p>

      <Button onClick={aoComecar} variant="marca" size="lg" className="mt-8 gap-2">
        {primeira ? "Começar" : "Começar este teste"}
      </Button>
    </div>
  );
}

function IndicadorDeSalvamento({ estado }: { estado: EstadoDaFila }) {
  // O que é problema já está dito em texto grande e anunciado no leitor de
  // tela; aqui é só a confirmação silenciosa de que a gravação acompanhou.
  if (estado.situacao === "ocioso" || estado.situacao === "recusado")
    return <span className="etiqueta opacity-0">—</span>;

  if (estado.situacao === "aguardando-rede")
    return (
      <span className="etiqueta flex items-center gap-1.5 text-fora" aria-hidden>
        <CloudOff className="size-3.5" />
        {estado.pendentes} na fila
      </span>
    );

  return (
    <span className="etiqueta flex items-center gap-1.5" aria-hidden>
      {estado.situacao === "salvando" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Check className="size-3.5 text-dentro" />
      )}
      {estado.situacao === "salvando" ? "Salvando" : "Salvo"}
    </span>
  );
}

function PerguntaLikert({
  texto,
  enunciado,
  escala,
  valor,
  aoResponder,
}: {
  texto: string;
  enunciado: string;
  escala: readonly OpcaoDeEscala[];
  valor: number | null;
  aoResponder: (valor: number) => void;
}) {
  const { grupo, aoTeclar, tabIndexDe } = useTecladoDeGrupo(
    escala.findIndex((o) => o.valor === valor),
  );

  return (
    <div>
      <p className="etiqueta mb-4" id="enunciado-likert">
        {enunciado}
      </p>

      <h1
        id={ID_DA_PERGUNTA}
        className="t-enunciado"
      >
        {texto}
      </h1>

      {/* O grupo é rotulado pela AFIRMAÇÃO, não por "escala de concordância":
          quem ouve "concordo totalmente" sem a frase antes não tem como
          responder. */}
      <div
        ref={grupo}
        onKeyDown={aoTeclar}
        className="mt-9 space-y-2"
        role="radiogroup"
        aria-labelledby={`${ID_DA_PERGUNTA} enunciado-likert`}
      >
        {escala.map((opcao, i) => {
          const marcado = valor === opcao.valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={marcado}
              tabIndex={tabIndexDe(i)}
              onClick={() => aoResponder(opcao.valor)}
              className={cn(
                "group flex min-h-14 w-full items-center gap-3.5 rounded-lg border bg-card px-4 py-3.5 text-left transition-colors",
                marcado
                  ? "border-marca-sinal bg-marca-suave/60"
                  : "hover:border-linha-forte hover:bg-secondary/60 active:bg-secondary",
              )}
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
                  marcado ? "border-marca-sinal" : "border-input",
                )}
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full bg-marca-sinal transition-transform",
                    marcado ? "scale-100" : "scale-0",
                  )}
                />
              </span>

              <span className="flex-1 t-corpo">{opcao.rotulo}</span>

              <kbd className="leitura hidden rounded border px-1.5 py-0.5 t-legenda text-muted-foreground sm:block">
                {opcao.valor}
              </kbd>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Bloco de cenário da Baliza — a tela que pede DUAS escolhas ordenadas.
 *
 * É onde a pessoa trava, e o motivo é sempre o mesmo: ela marca a primeira ação
 * e acha que acabou. Por isso a instrução muda de estado em vez de ficar parada
 * explicando as duas coisas de uma vez — a tela sempre diz o próximo toque, e
 * só ele.
 */
function PerguntaDeCenario({
  titulo,
  situacao,
  opcoes,
  escolha,
  aoResponder,
}: {
  titulo: string;
  situacao: string;
  opcoes: OpcaoDePergunta[];
  escolha: { primeiraId: string; ultimaId: string } | null;
  aoResponder: (primeiraId: string, ultimaId: string) => void;
}) {
  // Sem sincronizar prop → estado: a tela troca de bloco pela `key` do índice,
  // então este componente é MONTADO de novo a cada pergunta e já nasce com a
  // escolha salva. O efeito que existia aqui só reescrevia o estado com o que
  // ele já tinha, e um `setState` dentro de efeito é renderização em cascata.
  const [primeira, setPrimeira] = useState<string | null>(
    escolha?.primeiraId ?? null,
  );
  const [ultima, setUltima] = useState<string | null>(escolha?.ultimaId ?? null);

  const escolher = useCallback(
    (id: string) => {
      // Um toque marca "faria primeiro". O segundo toque em outra opção marca
      // "deixaria por último". Tocar de novo no mesmo desmarca.
      if (primeira === id) {
        setPrimeira(null);
        return;
      }
      if (ultima === id) {
        setUltima(null);
        return;
      }
      if (primeira === null) {
        setPrimeira(id);
        if (ultima) aoResponder(id, ultima);
        return;
      }
      setUltima(id);
      aoResponder(primeira, id);
    },
    [aoResponder, primeira, ultima],
  );

  // Mesmo atalho da parte 1: no computador, a mão não precisa sair do teclado
  // só porque a pergunta mudou de formato.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
      const n = Number(evento.key);
      if (!Number.isInteger(n) || n < 1 || n > opcoes.length) return;
      evento.preventDefault();
      escolher(opcoes[n - 1].id);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [opcoes, escolher]);

  const completo = Boolean(primeira && ultima);
  const passo = primeira ? 2 : 1;
  const temSalvoDivergente = Boolean(escolha) && !completo;

  return (
    <div>
      <p className="etiqueta mb-3">{titulo}</p>

      <h1
        id={ID_DA_PERGUNTA}
        className="text-balance t-secao leading-[1.5] font-medium"
      >
        {situacao}
      </h1>

      <div className="mt-5 rounded-lg bg-secondary px-3.5 py-2.5 t-corpo-sm leading-relaxed">
        <p className="etiqueta mb-1.5">
          {completo ? "As duas escolhas · ok" : `Escolha ${passo} de 2`}
        </p>
        <p className="text-muted-foreground">
          {completo ? (
            <>
              Prontas as duas. Para trocar, toque na marcada e escolha de novo.
            </>
          ) : primeira ? (
            <>
              Agora toque na ação que você deixaria por{" "}
              <strong className="font-medium text-fora">último</strong>.
            </>
          ) : (
            <>
              Esta pergunta pede <strong className="font-medium text-foreground">duas</strong>{" "}
              respostas. Comece tocando na ação que você faria{" "}
              <strong className="font-medium text-dentro">primeiro</strong>.
            </>
          )}
        </p>
      </div>

      {temSalvoDivergente && (
        <p className="mt-2 t-legenda text-muted-foreground">
          Sua escolha anterior continua salva até você marcar as duas de novo.
        </p>
      )}

      <div className="mt-5 space-y-2">
        {opcoes.map((opcao, i) => {
          const ehPrimeira = primeira === opcao.id;
          const ehUltima = ultima === opcao.id;
          const papel = ehPrimeira
            ? " — marcada como a que você faria primeiro"
            : ehUltima
              ? " — marcada como a que você deixaria por último"
              : "";

          return (
            <button
              key={opcao.id}
              type="button"
              onClick={() => escolher(opcao.id)}
              aria-pressed={ehPrimeira || ehUltima}
              aria-label={`${opcao.texto}${papel}`}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                ehPrimeira && "border-dentro bg-dentro/10",
                ehUltima && "border-fora bg-fora/10",
                !ehPrimeira &&
                  !ehUltima &&
                  "hover:border-linha-forte hover:bg-secondary/60 active:bg-secondary",
              )}
            >
              <span className="flex-1 t-corpo leading-snug">{opcao.texto}</span>

              {/* A etiqueta de papel só ocupa espaço quando existe: no celular,
                  uma coluna vazia de 4 rem espremia o texto da opção. */}
              {(ehPrimeira || ehUltima) && (
                <span
                  aria-hidden
                  className={cn(
                    "etiqueta mt-0.5 shrink-0",
                    ehPrimeira ? "text-dentro" : "text-fora",
                  )}
                >
                  {ehPrimeira ? "1º faria" : "por último"}
                </span>
              )}

              {!ehPrimeira && !ehUltima && (
                <kbd className="leitura mt-px hidden rounded border px-1.5 py-0.5 t-legenda text-muted-foreground sm:block">
                  {i + 1}
                </kbd>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Bloco de palavras do DISC: a que MAIS e a que MENOS parecem com você.
 *
 * Duas colunas, e não "toque uma vez, toque de novo" como no cenário: aqui as
 * quatro opções são adjetivos soltos, sem enredo que ordene a leitura, e a
 * pergunta é comparativa nos dois sentidos ao mesmo tempo. Ver as duas colunas
 * lado a lado é o que deixa a comparação visível.
 *
 * A regra do §3.2 — "as duas escolhas devem ser diferentes" — é recusada aqui
 * com explicação, e não silenciosamente. Marcar a mesma palavra dos dois lados
 * daria +1 e −1 na mesma dimensão: o líquido não muda, o bloco é perdido, e
 * nada no resultado denuncia. O servidor recusa de novo, por baixo.
 */
function PerguntaDeMaisMenos({
  opcoes,
  escolha,
  aoResponder,
}: {
  opcoes: OpcaoDePergunta[];
  escolha: { primeiraId: string; ultimaId: string } | null;
  aoResponder: (maisId: string, menosId: string) => void;
}) {
  const [mais, setMais] = useState<string | null>(escolha?.primeiraId ?? null);
  const [menos, setMenos] = useState<string | null>(escolha?.ultimaId ?? null);
  const [conflito, setConflito] = useState<string | null>(null);

  function escolher(coluna: "mais" | "menos", id: string) {
    const oposto = coluna === "mais" ? menos : mais;

    if (oposto === id) {
      setConflito(id);
      return;
    }

    setConflito(null);

    const novoMais = coluna === "mais" ? (mais === id ? null : id) : mais;
    const novoMenos = coluna === "menos" ? (menos === id ? null : id) : menos;

    setMais(novoMais);
    setMenos(novoMenos);

    if (novoMais && novoMenos) aoResponder(novoMais, novoMenos);
  }

  const completo = Boolean(mais && menos);
  const temSalvoDivergente = Boolean(escolha) && !completo;

  return (
    <div>
      <p className="etiqueta mb-4" id="enunciado-mais-menos">
        Neste grupo de palavras
      </p>

      <h1
        id={ID_DA_PERGUNTA}
        className="t-enunciado"
      >
        Qual <span className="text-dentro">mais</span> parece com você — e qual{" "}
        <span className="text-fora">menos</span>?
      </h1>

      <p className="mt-3 t-corpo-sm leading-relaxed text-muted-foreground">
        Pense no ambiente de trabalho. As duas escolhas precisam ser palavras
        diferentes.
      </p>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-end gap-2 pr-1">
          <span className="etiqueta w-16 text-center text-dentro">Mais</span>
          <span className="etiqueta w-16 text-center text-fora">Menos</span>
        </div>

        <div className="space-y-2">
          {opcoes.map((opcao) => {
            const ehMais = mais === opcao.id;
            const ehMenos = menos === opcao.id;
            const emConflito = conflito === opcao.id;

            return (
              <div
                key={opcao.id}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-colors",
                  ehMais && "border-dentro bg-dentro/10",
                  ehMenos && "border-fora bg-fora/10",
                  emConflito && "border-destructive/60 bg-destructive/5",
                )}
              >
                <span className="flex-1 t-corpo leading-snug">{opcao.texto}</span>

                <Marcador
                  papel="mais"
                  marcado={ehMais}
                  rotulo={`${opcao.texto} — a que MAIS parece com você`}
                  onClick={() => escolher("mais", opcao.id)}
                />
                <Marcador
                  papel="menos"
                  marcado={ehMenos}
                  rotulo={`${opcao.texto} — a que MENOS parece com você`}
                  onClick={() => escolher("menos", opcao.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* `role="alert"` porque é resposta a uma ação que a pessoa acabou de
          fazer e que NÃO pegou — silêncio aqui vira "o botão está quebrado". */}
      {conflito && (
        <p
          role="alert"
          className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 t-corpo-sm text-destructive"
        >
          Esta palavra já está marcada do outro lado. As duas escolhas precisam
          ser palavras diferentes — escolha outra, ou desmarque a primeira.
        </p>
      )}

      {!conflito && !completo && (
        <p className="mt-3 t-corpo-sm text-muted-foreground">
          {mais
            ? "Falta marcar a que MENOS parece com você."
            : menos
              ? "Falta marcar a que MAIS parece com você."
              : "Marque uma de cada lado."}
        </p>
      )}

      {temSalvoDivergente && (
        <p className="mt-2 t-legenda text-muted-foreground">
          Sua escolha anterior continua salva até você marcar as duas de novo.
        </p>
      )}
    </div>
  );
}

function Marcador({
  papel,
  marcado,
  rotulo,
  onClick,
}: {
  papel: "mais" | "menos";
  marcado: boolean;
  rotulo: string;
  onClick: () => void;
}) {
  return (
    // `aria-pressed`, e não `role="radio"`: as quatro opções de uma coluna não
    // são irmãs no DOM (cada linha junta a palavra e os seus dois marcadores), e
    // rádio fora de um `radiogroup` mente para o leitor de tela sobre o que as
    // setas fazem. O rótulo diz o papel inteiro em cada botão.
    <button
      type="button"
      aria-pressed={marcado}
      aria-label={rotulo}
      onClick={onClick}
      className={cn(
        "grid h-11 w-16 shrink-0 place-items-center rounded-lg border transition-all sm:h-9",
        marcado
          ? papel === "mais"
            ? "border-dentro bg-dentro/20"
            : "border-fora bg-fora/20"
          : "border-border hover:border-linha-forte hover:bg-secondary",
      )}
    >
      <span
        className={cn(
          "grid size-5 place-items-center rounded-full border-[1.5px] transition-colors",
          marcado
            ? papel === "mais"
              ? "border-dentro"
              : "border-fora"
            : "border-border",
        )}
      >
        <span
          className={cn(
            "size-2.5 rounded-full transition-transform",
            papel === "mais" ? "bg-dentro" : "bg-fora",
            marcado ? "scale-100" : "scale-0",
          )}
        />
      </span>
    </button>
  );
}

/**
 * Cenário do SJT: uma alternativa entre quatro.
 *
 * Sem título e sem nada que anuncie o tema — "Dilema ético" no alto da tela
 * induziria a resposta socialmente desejável, que é exatamente o que a
 * instrução do §4.2 pede para evitar. O que chega aqui já vem podado pelo
 * servidor: pontuação e competência nunca saem de lá.
 */
function PerguntaDeEscolhaUnica({
  situacao,
  opcoes,
  escolha,
  aoResponder,
}: {
  situacao: string;
  opcoes: OpcaoDePergunta[];
  escolha: string | null;
  aoResponder: (id: string) => void;
}) {
  const { grupo, aoTeclar, tabIndexDe } = useTecladoDeGrupo(
    opcoes.findIndex((o) => o.id === escolha),
  );

  return (
    <div>
      <p className="etiqueta mb-3" id="enunciado-escolha">
        O que você faria
      </p>

      <h1
        id={ID_DA_PERGUNTA}
        className="text-balance t-secao leading-[1.5] font-medium"
      >
        {situacao}
      </h1>

      <div
        ref={grupo}
        onKeyDown={aoTeclar}
        className="mt-6 space-y-2"
        role="radiogroup"
        aria-labelledby={`${ID_DA_PERGUNTA} enunciado-escolha`}
      >
        {opcoes.map((opcao, i) => {
          const marcado = escolha === opcao.id;
          return (
            <button
              key={opcao.id}
              type="button"
              role="radio"
              aria-checked={marcado}
              tabIndex={tabIndexDe(i)}
              onClick={() => aoResponder(opcao.id)}
              className={cn(
                "flex w-full items-start gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all",
                marcado
                  ? "border-marca-sinal bg-marca-suave/60"
                  : "hover:border-linha-forte hover:bg-secondary/60 active:bg-secondary",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
                  marcado ? "border-marca-sinal" : "border-input",
                )}
              >
                <span
                  className={cn(
                    "size-2.5 rounded-full bg-marca-sinal transition-transform",
                    marcado ? "scale-100" : "scale-0",
                  )}
                />
              </span>

              <span className="flex-1 t-corpo leading-snug">{opcao.texto}</span>

              <kbd className="leitura mt-px hidden rounded border px-1.5 py-0.5 t-legenda text-muted-foreground sm:block">
                {i + 1}
              </kbd>
            </button>
          );
        })}
      </div>
    </div>
  );
}
