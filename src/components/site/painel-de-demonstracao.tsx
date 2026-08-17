"use client";

import { motion, useReducedMotion } from "motion/react";

import { Faixa, FaixaMinima } from "@/components/faixa";
import { cn } from "@/lib/utils";

/**
 * O herói da landing é o produto, não uma ilustração.
 *
 * Três coisas aparecem aqui, na ordem em que o recrutador as usa: o RANKING
 * (quem eu chamo primeiro), a FAIXA da dimensão que decidiu a posição (por quê)
 * e um trecho do ROTEIRO (o que eu pergunto). É a promessa inteira do produto
 * numa tela — e é literalmente a mesma composição que ele vai ver depois de
 * criar a primeira vaga.
 *
 * Os números são o caso didático do produto: Bruno encanta na entrevista e não
 * pede o fechamento. Eles são coerentes com o motor — cooperação bem acima da
 * faixa em prospecção derruba a aderência — mas são DEMONSTRAÇÃO, não resultado
 * de ninguém. Nenhum nome aqui é de pessoa real.
 */

/**
 * A faixa de referência da vaga para a aderência total. `dentro` é DERIVADO
 * dela e do escore, e não escrito à mão: uma demonstração que se contradiz — um
 * marcador pintado como "fora" caindo visivelmente dentro do trecho — desmente
 * o desenho que a seção seguinte passa a explicar.
 */
const FAIXA_DA_VAGA: [number, number] = [70, 100];

const RANKING = [
  { nome: "Bruno Tavares", escore: 85.1, selo: "alta" as const },
  { nome: "Helena Braga", escore: 78.4, selo: "alta" as const },
  { nome: "Caio Menezes", escore: 61.9, selo: "media" as const },
].map((c) => ({
  ...c,
  faixa: FAIXA_DA_VAGA,
  dentro: c.escore >= FAIXA_DA_VAGA[0] && c.escore <= FAIXA_DA_VAGA[1],
}));

const ROTULO_DO_SELO = { alta: "Confiança alta", media: "Confiança média" };

export function PainelDeDemonstracao({ className }: { className?: string }) {
  const semMovimento = useReducedMotion();

  return (
    <motion.div
      initial={semMovimento ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "overflow-hidden rounded-2xl border bg-card shadow-media",
        className,
      )}
    >
      {/* Barra de contexto — a vaga contra a qual tudo abaixo foi lido. Sem ela
          o ranking não quer dizer nada, e essa é a tese do produto. */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b bg-superficie-2/60 px-5 py-3">
        <p className="etiqueta">Executivo de Vendas — Prospecção</p>
        <p className="etiqueta">3 respostas · perfil-alvo aplicado</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_1.05fr]">
        {/* ─── Ranking ──────────────────────────────────────────────────── */}
        <div className="border-b p-5 lg:border-r lg:border-b-0">
          <p className="t-cartao">Ordem de conversa</p>
          <p className="t-legenda mt-1 text-muted-foreground">
            A Baliza ordena. Quem entrevista decide.
          </p>

          <ul className="mt-5 space-y-4">
            {RANKING.map((c, i) => (
              <motion.li
                key={c.nome}
                initial={semMovimento ? false : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.24,
                  delay: 0.12 + i * 0.06,
                  ease: [0.32, 0.72, 0, 1],
                }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="etiqueta shrink-0">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="truncate t-corpo-sm font-medium">
                      {c.nome}
                    </span>
                  </div>
                  <span className="leitura shrink-0 text-sm font-semibold tabular-nums">
                    {c.escore.toFixed(1).replace(".", ",")}
                  </span>
                </div>

                <FaixaMinima
                  className="mt-2"
                  escore={c.escore}
                  faixa={c.faixa}
                  dentro={c.dentro}
                />

                <p className="etiqueta mt-2">{ROTULO_DO_SELO[c.selo]}</p>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* ─── A conta e o que fazer com ela ────────────────────────────── */}
        <div className="p-5">
          <p className="t-cartao">Por que 85,1</p>
          <p className="t-legenda mt-1 text-muted-foreground">
            O escore nunca aparece sozinho.
          </p>

          <div className="mt-5">
            <Faixa
              atraso={0.2}
              dados={{
                fator: "A",
                nome: "Cooperação",
                escore: 93.8,
                faixa: [30, 60],
                ideal: 45,
                peso: 3,
                tipo: "faixa_otima",
                dentro: false,
              }}
            />
          </div>

          <p className="mt-5 border-t pt-4 t-corpo-sm leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">
              Cooperação bem acima da faixa
            </span>{" "}
            é o que mais derruba a aderência aqui. Em prospecção, quem evita
            atrito não pede o fechamento e dá desconto para não desagradar.
          </p>

          {/* O roteiro fecha o ciclo: o produto não termina no número, termina
              na pergunta que o número sugere. */}
          <div className="mt-5 rounded-lg border border-dashed p-4">
            <p className="etiqueta">Roteiro de entrevista</p>
            <p className="mt-2 t-corpo-sm leading-relaxed">
              &ldquo;Conte de uma negociação em que você precisou segurar o
              desconto. O que você fez quando o cliente insistiu?&rdquo;
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
