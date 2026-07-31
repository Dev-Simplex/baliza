"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeft, Check, CloudOff, Loader2 } from "lucide-react";

import { ReguaDeProgresso } from "@/components/teste/regua-de-progresso";
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

type Salvamento = "ocioso" | "salvando" | "salvo" | "erro";

export function FluxoDoTeste({ dados }: { dados: DadosDoTeste }) {
  const router = useRouter();
  const semMovimento = useReducedMotion();
  const [, iniciarTransicao] = useTransition();

  const totalDeItens = dados.itens.length;
  const totalDeBlocos = dados.cenarios.length;
  const total = totalDeItens + totalDeBlocos;

  const [respostas, setRespostas] = useState(dados.respostasSalvas);
  const [cenarios, setCenarios] = useState(dados.cenariosSalvos);
  const [salvamento, setSalvamento] = useState<Salvamento>("ocioso");
  const [concluindo, setConcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Retoma exatamente onde parou: a primeira pergunta ainda sem resposta.
  const [indice, setIndice] = useState(() => {
    const primeiroItemVazio = dados.itens.findIndex(
      (i) => dados.respostasSalvas[i.id] == null,
    );
    if (primeiroItemVazio >= 0) return primeiroItemVazio;
    const primeiroBlocoVazio = dados.cenarios.findIndex(
      (c) => !dados.cenariosSalvos[c.id],
    );
    if (primeiroBlocoVazio >= 0) return totalDeItens + primeiroBlocoVazio;
    return total - 1;
  });

  const inicioDaPergunta = useRef(Date.now());
  useEffect(() => {
    inicioDaPergunta.current = Date.now();
  }, [indice]);

  const naParteDeCenarios = indice >= totalDeItens;
  const item = naParteDeCenarios ? null : dados.itens[indice];
  const bloco = naParteDeCenarios ? dados.cenarios[indice - totalDeItens] : null;

  const respondidos = new Set<number>([
    ...dados.itens
      .map((i, idx) => (respostas[i.id] != null ? idx : -1))
      .filter((n) => n >= 0),
    ...dados.cenarios
      .map((c, idx) => (cenarios[c.id] ? totalDeItens + idx : -1))
      .filter((n) => n >= 0),
  ]);

  const avancar = useCallback(() => {
    setIndice((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const responderItem = useCallback(
    (itemId: string, valor: number) => {
      const tempoMs = Date.now() - inicioDaPergunta.current;
      setRespostas((r) => ({ ...r, [itemId]: valor }));
      setSalvamento("salvando");
      setErro(null);

      iniciarTransicao(async () => {
        const r = await salvarResposta(dados.token, { itemId, valor, tempoMs });
        setSalvamento(r.ok ? "salvo" : "erro");
        if (!r.ok) setErro(r.erro ?? "Não foi possível salvar.");
      });

      // Avança sozinho, com uma pausa curta pra a marcação ser vista.
      window.setTimeout(avancar, semMovimento ? 60 : 240);
    },
    [avancar, dados.token, semMovimento],
  );

  const responderCenario = useCallback(
    (blocoId: string, primeiraId: string, ultimaId: string) => {
      const tempoMs = Date.now() - inicioDaPergunta.current;
      setCenarios((c) => ({ ...c, [blocoId]: { primeiraId, ultimaId } }));
      setSalvamento("salvando");
      setErro(null);

      iniciarTransicao(async () => {
        const r = await salvarCenario(dados.token, {
          blocoId,
          primeiraId,
          ultimaId,
          tempoMs,
        });
        setSalvamento(r.ok ? "salvo" : "erro");
        if (!r.ok) setErro(r.erro ?? "Não foi possível salvar.");
      });
    },
    [dados.token],
  );

  const concluir = useCallback(async () => {
    setConcluindo(true);
    setErro(null);
    const r = await concluirAvaliacao(dados.token);
    if (r.ok) {
      router.push(`/r/${r.resultToken}`);
      return;
    }
    setErro(r.erro ?? "Não foi possível concluir.");
    setConcluindo(false);
  }, [dados.token, router]);

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
        setIndice((i) => i - 1);
      }
      if (evento.key === "ArrowRight" && respondidos.has(indice)) {
        evento.preventDefault();
        avancar();
      }
    }

    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [item, indice, responderItem, avancar, respondidos]);

  const tudoRespondido = respondidos.size === total;
  const naUltima = indice === total - 1;

  return (
    <div className="mx-auto flex min-h-svh max-w-2xl flex-col px-5 py-6 sm:px-8">
      <header className="shrink-0">
        <ReguaDeProgresso
          total={total}
          atual={indice}
          respondidos={respondidos}
          etapa={naParteDeCenarios ? "Parte 2 · Situações" : "Parte 1 · Afirmações"}
        />
      </header>

      <main className="flex flex-1 flex-col justify-center py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={indice}
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
        {erro && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {erro}
          </p>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setIndice((i) => Math.max(0, i - 1))}
            disabled={indice === 0}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </button>

          <IndicadorDeSalvamento estado={salvamento} />

          {naUltima || tudoRespondido ? (
            <Button
              onClick={concluir}
              disabled={!tudoRespondido || concluindo}
              className="gap-2"
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
              className="text-muted-foreground"
            >
              Próxima
            </Button>
          )}
        </div>

        <p className="pb-1 text-center t-legenda text-muted-foreground">
          Suas respostas são salvas sozinhas. Você pode fechar e continuar depois
          pelo mesmo link.
        </p>
      </footer>
    </div>
  );
}

function IndicadorDeSalvamento({ estado }: { estado: Salvamento }) {
  if (estado === "ocioso") return <span className="etiqueta opacity-0">—</span>;

  if (estado === "erro")
    return (
      <span className="etiqueta flex items-center gap-1.5 text-destructive">
        <CloudOff className="size-3.5" />
        Não salvo
      </span>
    );

  return (
    <span className="etiqueta flex items-center gap-1.5">
      {estado === "salvando" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Check className="size-3.5 text-dentro" />
      )}
      {estado === "salvando" ? "Salvando" : "Salvo"}
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
      <p className="etiqueta mb-4">O quanto isso combina com você no trabalho?</p>

      <h1 className="text-balance text-[1.625rem] leading-[1.28] font-semibold tracking-tight sm:text-[1.875rem]">
        {texto}
      </h1>

      <div
        className="mt-9 space-y-2"
        role="radiogroup"
        aria-label="Escala de concordância"
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
                "",
                marcado
                  ? "border-marca bg-marca-forte/10"
                  : "hover:border-marca/40 hover:bg-secondary/60",
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

function PerguntaDeCenario({
  bloco,
  escolha,
  aoResponder,
}: {
  bloco: BlocoDaProva;
  escolha: { primeiraId: string; ultimaId: string } | null;
  aoResponder: (primeiraId: string, ultimaId: string) => void;
}) {
  const [primeira, setPrimeira] = useState<string | null>(
    escolha?.primeiraId ?? null,
  );
  const [ultima, setUltima] = useState<string | null>(escolha?.ultimaId ?? null);

  useEffect(() => {
    setPrimeira(escolha?.primeiraId ?? null);
    setUltima(escolha?.ultimaId ?? null);
  }, [escolha, bloco.id]);

  function escolher(id: string) {
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
  }

  return (
    <div>
      <p className="etiqueta mb-3">{bloco.titulo}</p>

      <h1 className="text-balance t-secao leading-[1.5] font-medium sm:t-secao">
        {bloco.situacao}
      </h1>

      <p className="mt-5 rounded-lg bg-secondary px-3.5 py-2.5 t-corpo-sm leading-relaxed text-muted-foreground">
        Toque em <strong className="font-medium text-foreground">uma</strong> ação
        que você faria <strong className="font-medium text-dentro">primeiro</strong>
        , e depois em <strong className="font-medium text-foreground">outra</strong>{" "}
        que deixaria por <strong className="font-medium text-fora">último</strong>
        .
      </p>

      <div className="mt-5 space-y-2">
        {bloco.opcoes.map((opcao) => {
          const ehPrimeira = primeira === opcao.id;
          const ehUltima = ultima === opcao.id;
          return (
            <button
              key={opcao.id}
              type="button"
              onClick={() => escolher(opcao.id)}
              aria-pressed={ehPrimeira || ehUltima}
              className={cn(
                "flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                "",
                ehPrimeira && "border-dentro bg-dentro/10",
                ehUltima && "border-fora bg-fora/10",
                !ehPrimeira && !ehUltima && "hover:border-marca/40 hover:bg-secondary/60",
              )}
            >
              <span
                className={cn(
                  "etiqueta mt-0.5 w-16 shrink-0",
                  ehPrimeira && "text-dentro",
                  ehUltima && "text-fora",
                )}
              >
                {ehPrimeira ? "1º faria" : ehUltima ? "por último" : ""}
              </span>
              <span className="flex-1 t-corpo leading-snug">{opcao.texto}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
