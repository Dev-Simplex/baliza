"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, CloudOff, Loader2, RotateCw } from "lucide-react";

import {
  criarFila,
  type EstadoDaFila,
  type Fila,
} from "@/components/teste/fila-de-salvamento";
import { ReguaDeProgresso } from "@/components/teste/regua-de-progresso";
import { rotuloDoRestante } from "@/components/teste/tempo-estimado";
import { Button } from "@/components/ui/button";
import {
  concluirAvaliacao,
  salvarCenario,
  salvarResposta,
} from "@/lib/actions/avaliacao";
import { ESCALA_LIKERT } from "@/lib/instrument/types";
import { cn } from "@/lib/utils";

type ItemDaProva = { id: string; texto: string };
type OpcaoDeCenario = { id: string; texto: string };
type BlocoDaProva = {
  id: string;
  titulo: string;
  situacao: string;
  opcoes: OpcaoDeCenario[];
};

export type DadosDoTeste = {
  token: string;
  itens: ItemDaProva[];
  cenarios: BlocoDaProva[];
  respostasSalvas: Record<string, number>;
  cenariosSalvos: Record<string, { primeiraId: string; ultimaId: string }>;
};

/** O rótulo do heading da vez. Serve de nome acessível para a área da pergunta. */
const ID_DA_PERGUNTA = "pergunta-atual";

export function FluxoDoTeste({ dados }: { dados: DadosDoTeste }) {
  const router = useRouter();
  const semMovimento = useReducedMotion();

  const totalDeItens = dados.itens.length;
  const totalDeBlocos = dados.cenarios.length;
  const total = totalDeItens + totalDeBlocos;

  const [respostas, setRespostas] = useState(dados.respostasSalvas);
  const [cenarios, setCenarios] = useState(dados.cenariosSalvos);
  const [concluindo, setConcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [estadoDaFila, setEstadoDaFila] = useState<EstadoDaFila>({
    situacao: "ocioso",
    pendentes: 0,
    erro: null,
  });

  // A fila é criada uma vez por prova e sobrevive a toda re-renderização: é ela
  // que segura as respostas que ainda não foram aceitas pelo servidor.
  const filaRef = useRef<Fila | null>(null);
  if (filaRef.current === null) {
    filaRef.current = criarFila({ aoMudar: setEstadoDaFila });
  }

  // Retoma exatamente onde parou: a primeira pergunta ainda sem resposta.
  const indiceInicial = useMemo(() => {
    const primeiroItemVazio = dados.itens.findIndex(
      (i) => dados.respostasSalvas[i.id] == null,
    );
    if (primeiroItemVazio >= 0) return primeiroItemVazio;
    const primeiroBlocoVazio = dados.cenarios.findIndex(
      (c) => !dados.cenariosSalvos[c.id],
    );
    if (primeiroBlocoVazio >= 0) return totalDeItens + primeiroBlocoVazio;
    return total - 1;
  }, [dados, totalDeItens, total]);

  const [indice, setIndice] = useState(indiceInicial);

  // Quantas já estavam salvas quando esta página abriu. Se for mais que zero, a
  // pessoa está VOLTANDO — e o medo dela é ter perdido o que já respondeu.
  const jaRespondidasAoAbrir = useMemo(
    () =>
      Object.keys(dados.respostasSalvas).length +
      Object.keys(dados.cenariosSalvos).length,
    [dados],
  );

  const inicioDaPergunta = useRef(0);
  const avancoAgendado = useRef<number | null>(null);
  const areaDaPergunta = useRef<HTMLDivElement | null>(null);
  const primeiraPintura = useRef(true);

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

  const naParteDeCenarios = indice >= totalDeItens;
  const item = naParteDeCenarios ? null : dados.itens[indice];
  const bloco = naParteDeCenarios ? dados.cenarios[indice - totalDeItens] : null;

  const respondidos = useMemo(
    () =>
      new Set<number>([
        ...dados.itens
          .map((i, idx) => (respostas[i.id] != null ? idx : -1))
          .filter((n) => n >= 0),
        ...dados.cenarios
          .map((c, idx) => (cenarios[c.id] ? totalDeItens + idx : -1))
          .filter((n) => n >= 0),
      ]),
    [dados, respostas, cenarios, totalDeItens],
  );

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
      setRespostas((r) => ({ ...r, [itemId]: valor }));
      setErro(null);
      filaRef.current?.enfileirar(`item:${itemId}`, () =>
        salvarResposta(dados.token, { itemId, valor, tempoMs }),
      );
      agendarAvanco();
    },
    [agendarAvanco, dados.token, tempoNaPergunta],
  );

  const responderCenario = useCallback(
    (blocoId: string, primeiraId: string, ultimaId: string) => {
      const tempoMs = tempoNaPergunta();
      setCenarios((c) => ({ ...c, [blocoId]: { primeiraId, ultimaId } }));
      setErro(null);
      filaRef.current?.enfileirar(`cenario:${blocoId}`, () =>
        salvarCenario(dados.token, {
          blocoId,
          primeiraId,
          ultimaId,
          tempoMs,
        }),
      );
    },
    [dados.token, tempoNaPergunta],
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

  // Teclado: 1 a 5 respondem, setas navegam. Quem responde 44 itens no
  // computador não quer usar o mouse 44 vezes.
  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;

      if (item && /^[1-5]$/.test(evento.key)) {
        evento.preventDefault();
        responderItem(item.id, Number(evento.key));
        return;
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
  }, [item, indice, responderItem, avancar, irPara, respondidos]);

  const tudoRespondido = respondidos.size === total;
  const naUltima = indice === total - 1;
  const quantasFaltam = total - respondidos.size;
  const temPendencia = estadoDaFila.pendentes > 0;

  // A última pergunta não avança sozinha — não há para onde. Num celular baixo,
  // o "Concluir" fica abaixo da dobra, e a tela parece não ter reagido à última
  // resposta: fim de prova com cara de travamento. Trazer o rodapé à vista é o
  // que fecha o ciclo.
  useEffect(() => {
    if (!naUltima || !tudoRespondido) return;
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: semMovimento ? "auto" : "smooth",
    });
  }, [naUltima, tudoRespondido, semMovimento]);

  const itensQueFaltam = dados.itens.filter(
    (i, idx) => idx > indice && respostas[i.id] == null,
  ).length;
  const cenariosQueFaltam = dados.cenarios.filter(
    (c, idx) => totalDeItens + idx > indice && !cenarios[c.id],
  ).length;
  const restante = rotuloDoRestante(itensQueFaltam, cenariosQueFaltam);

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
      // Antes daqui saía um `push` para `/r/<resultToken>`, o relatório do
      // candidato — que não existe mais.
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

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col px-5 py-6 sm:px-8">
      <header className="shrink-0">
        <ReguaDeProgresso
          total={total}
          atual={indice}
          respondidos={respondidos}
          etapa={naParteDeCenarios ? "Parte 2 · Situações" : "Parte 1 · Afirmações"}
          etapaCurta={naParteDeCenarios ? "Situações" : "Afirmações"}
          restante={restante}
        />
      </header>

      <main className="flex flex-1 flex-col justify-center py-8 sm:py-10">
        {/* Quem fecha a prova no meio volta com uma dúvida só: "perdi tudo?".
            Responder isso na hora custa uma linha e salva a resposta inteira. */}
        {jaRespondidasAoAbrir > 0 && indice === indiceInicial && (
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

        {/* Orientação só na PRIMEIRA pergunta, e só enquanto ela é a primeira
            sem resposta. Repetir isso nas 52 telas viraria ruído; não dizer
            nunca deixa a pessoa descobrir o teclado e o salvamento sozinha —
            ou não descobrir. */}
        {indice === 0 && respondidos.size === 0 && (
          <p className="mb-6 rounded-lg border border-dashed px-3.5 py-2.5 t-legenda leading-relaxed text-muted-foreground">
            Responda pelo que você <strong className="font-medium text-foreground">faz</strong>,
            não pelo que seria melhor responder — o resultado só serve se for
            seu.{" "}
            <span className="hidden sm:inline">
              Dá para usar as teclas <kbd className="leitura">1</kbd> a{" "}
              <kbd className="leitura">5</kbd>, e cada resposta é salva na hora.
            </span>
            <span className="sm:hidden">Cada resposta é salva na hora.</span>
          </p>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={indice}
            ref={conectarAreaDaPergunta}
            tabIndex={-1}
            aria-labelledby={ID_DA_PERGUNTA}
            className="outline-none"
            initial={semMovimento ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={semMovimento ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {item && (
              <PerguntaLikert
                texto={item.texto}
                valor={respostas[item.id] ?? null}
                aoResponder={(v) => responderItem(item.id, v)}
              />
            )}

            {bloco && (
              <PerguntaDeCenario
                bloco={bloco}
                escolha={cenarios[bloco.id] ?? null}
                aoResponder={(primeira, ultima) =>
                  responderCenario(bloco.id, primeira, ultima)
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="shrink-0 space-y-3">
        {/* Leitor de tela: só o que é problema. Anunciar "salvo" 52 vezes
            atrapalharia justamente quem depende do anúncio. */}
        <p role="status" aria-live="polite" className="sr-only">
          {estadoDaFila.situacao === "aguardando-rede"
            ? `Sem conexão. ${estadoDaFila.pendentes} resposta(s) guardadas no aparelho, aguardando a internet voltar.`
            : estadoDaFila.situacao === "recusado"
              ? (estadoDaFila.erro ?? "")
              : ""}
        </p>

        {estadoDaFila.situacao === "aguardando-rede" && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-fora/30 bg-fora/5 px-3 py-2.5">
            <p className="flex items-start gap-2 text-sm">
              <CloudOff className="mt-0.5 size-4 shrink-0 text-fora" />
              <span>
                Sem conexão. Suas respostas estão guardadas aqui e sobem sozinhas
                quando a internet voltar —{" "}
                <strong className="font-medium">não feche esta página</strong> até
                lá.
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
        {naUltima && !tudoRespondido && (
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

          {naUltima || tudoRespondido ? (
            <Button
              onClick={concluir}
              disabled={!tudoRespondido || concluindo || temPendencia}
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
  valor,
  aoResponder,
}: {
  texto: string;
  valor: number | null;
  aoResponder: (valor: number) => void;
}) {
  return (
    <div>
      <p className="etiqueta mb-4" id="enunciado-likert">
        O quanto isso combina com você no trabalho?
      </p>

      <h1
        id={ID_DA_PERGUNTA}
        className="text-balance text-[1.625rem] leading-[1.28] font-semibold tracking-tight sm:text-[1.875rem]"
      >
        {texto}
      </h1>

      {/* O grupo é rotulado pela AFIRMAÇÃO, não por "escala de concordância":
          quem ouve "concordo totalmente" sem a frase antes não tem como
          responder. */}
      <div
        className="mt-9 space-y-2"
        role="radiogroup"
        aria-labelledby={`${ID_DA_PERGUNTA} enunciado-likert`}
      >
        {ESCALA_LIKERT.map((opcao) => {
          const marcado = valor === opcao.valor;
          return (
            <button
              key={opcao.valor}
              type="button"
              role="radio"
              aria-checked={marcado}
              onClick={() => aoResponder(opcao.valor)}
              className={cn(
                "group flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition-all",
                marcado
                  ? "border-marca bg-marca-forte/10"
                  : "hover:border-marca/40 hover:bg-secondary/60 active:bg-secondary",
              )}
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full border-[1.5px] transition-colors",
                  marcado ? "border-marca" : "border-border",
                )}
              >
                <span
                  className={cn(
                    "size-2.5 rotate-45 rounded-[1px] bg-marca-forte transition-transform",
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
 * Bloco de cenário — a única tela da prova que pede DUAS escolhas.
 *
 * É onde a pessoa trava, e o motivo é sempre o mesmo: ela marca a primeira ação
 * e acha que acabou. Por isso a instrução muda de estado em vez de ficar parada
 * explicando as duas coisas de uma vez — a tela sempre diz o próximo toque, e
 * só ele.
 */
function PerguntaDeCenario({
  bloco,
  escolha,
  aoResponder,
}: {
  bloco: BlocoDaProva;
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
      if (!Number.isInteger(n) || n < 1 || n > bloco.opcoes.length) return;
      evento.preventDefault();
      escolher(bloco.opcoes[n - 1].id);
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [bloco.opcoes, escolher]);

  const completo = Boolean(primeira && ultima);
  const passo = primeira ? 2 : 1;
  const temSalvoDivergente = Boolean(escolha) && !completo;

  return (
    <div>
      <p className="etiqueta mb-3">{bloco.titulo}</p>

      <h1
        id={ID_DA_PERGUNTA}
        className="text-balance t-secao leading-[1.5] font-medium"
      >
        {bloco.situacao}
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
        {bloco.opcoes.map((opcao, i) => {
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
                  "hover:border-marca/40 hover:bg-secondary/60 active:bg-secondary",
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
