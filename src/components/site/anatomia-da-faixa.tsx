"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * A faixa-alvo explicada peça por peça.
 *
 * O medidor é o elemento mais denso do produto, e quem chega na landing nunca o
 * viu. Esta seção o desmonta uma vez, devagar, para que ele seja óbvio em todas
 * as outras telas — e a legenda existe porque um diagrama que só se explica pela
 * cor não se explica para quem não distingue as cores.
 *
 * Os quatro elementos são exatamente os do componente real (`components/faixa`),
 * com os mesmos tokens. Se um deles mudar lá, precisa mudar aqui: o dia em que
 * a landing ensinar um desenho que o produto não tem é o dia em que ela mente.
 */

const FAIXA: [number, number] = [55, 82];
const IDEAL = 70;
const ESCORE = 91;

const LEGENDA = [
  {
    rotulo: "A faixa-alvo",
    texto:
      "O intervalo que ESTA vaga pede naquela dimensão. Não é média de mercado nem ideal genérico: é a régua que você definiu ao criar a vaga.",
    amostra: (
      <span
        className="block h-4 w-8 rounded-[2px]"
        style={{
          background: "color-mix(in oklab, var(--dentro) 16%, transparent)",
          borderInline: "1.5px solid var(--dentro)",
        }}
      />
    ),
  },
  {
    rotulo: "O ideal",
    texto:
      "O ponto ótimo dentro da faixa. Orienta a leitura, mas não é meta: quem cai na faixa está no lugar certo.",
    amostra: (
      <span className="block h-4 w-8">
        <span className="mx-auto block h-4 w-px bg-dentro/50" />
      </span>
    ),
  },
  {
    rotulo: "O marcador",
    texto:
      "Onde a pessoa caiu. É a única marca laranja do desenho, porque é a leitura — não é aprovação nem reprovação.",
    amostra: (
      <span className="relative block h-4 w-8">
        <span
          className="absolute top-0 left-1/2 h-4 w-[2px] -translate-x-1/2 rounded-full"
          style={{ background: "var(--marca-sinal)" }}
        />
        <span
          className="brilho-marca absolute top-1/2 left-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "var(--marca-sinal)" }}
        />
      </span>
    ),
  },
  {
    rotulo: "O desvio",
    texto:
      "A distância entre a borda da faixa e a pessoa — o que está custando pontos. Argila, e nunca vermelho: fora da faixa é atenção, não reprovação.",
    amostra: (
      <span className="flex h-4 w-8 items-center">
        <span className="block h-2 w-full rounded-full bg-fora" />
      </span>
    ),
  },
];

export function AnatomiaDaFaixa() {
  const semMovimento = useReducedMotion();
  const [lo, hi] = FAIXA;

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      <div className="rounded-2xl border bg-card p-6 sm:p-8">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <span className="etiqueta shrink-0">A</span>
            <span className="truncate text-sm font-medium">Cooperação</span>
          </div>
          <span
            className="leitura text-base font-semibold tabular-nums"
            style={{ color: "var(--fora)" }}
          >
            91
          </span>
        </div>

        {/* O trilho, em tamanho de aula: mais alto que no produto para que cada
            peça caiba com folga e a anotação tenha onde encostar. */}
        <div className="relative mt-4 h-10">
          <div className="regua absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-muted" />

          <motion.div
            initial={semMovimento ? false : { scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.24, ease: [0.32, 0.72, 0, 1] }}
            style={{
              left: `${lo}%`,
              width: `${hi - lo}%`,
              transformOrigin: "left center",
              background: "color-mix(in oklab, var(--dentro) 16%, transparent)",
              borderInline: "1.5px solid var(--dentro)",
            }}
            className="absolute top-1/2 h-6 -translate-y-1/2 rounded-[2px]"
          />

          <motion.div
            initial={semMovimento ? false : { scaleX: 0, opacity: 0 }}
            whileInView={{ scaleX: 1, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.24,
              delay: 0.1,
              ease: [0.32, 0.72, 0, 1],
            }}
            style={{
              left: `${hi}%`,
              width: `${ESCORE - hi}%`,
              transformOrigin: "left center",
              background: "var(--fora)",
            }}
            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full"
          />

          <div
            style={{ left: `${IDEAL}%` }}
            className="absolute top-1/2 h-6 w-px -translate-x-1/2 -translate-y-1/2 bg-dentro/50"
          />

          <motion.div
            initial={semMovimento ? false : { left: "0%", opacity: 0 }}
            whileInView={{ left: `${ESCORE}%`, opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{
              duration: 0.24,
              delay: 0.05,
              ease: [0.32, 0.72, 0, 1],
            }}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <div
              className="h-9 w-[2px] rounded-full"
              style={{ background: "var(--marca-sinal)" }}
            />
            <div
              className="brilho-marca absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: "var(--marca-sinal)" }}
            />
          </motion.div>
        </div>

        {/* Escala. Sem os extremos o trilho é uma barra qualquer; com eles é uma
            medida. */}
        <div className="mt-2 flex justify-between">
          <span className="etiqueta">0</span>
          <span className="etiqueta">100</span>
        </div>

        <p className="mt-6 border-t pt-5 t-corpo-sm leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            9 acima do alvo 55–82.
          </span>{" "}
          Em prospecção, cooperação altíssima não é virtude: quem evita atrito
          não pede o fechamento. A faixa penaliza os dois lados porque o trabalho
          pede o meio — e é isso que um &ldquo;quanto mais, melhor&rdquo; não
          consegue dizer.
        </p>
      </div>

      <dl className="space-y-7 self-center">
        {LEGENDA.map((item) => (
          <div key={item.rotulo} className="flex gap-4">
            <span aria-hidden className="mt-1 shrink-0">
              {item.amostra}
            </span>
            <div className="min-w-0">
              <dt className="text-sm font-semibold">{item.rotulo}</dt>
              <dd className="mt-1.5 t-corpo-sm leading-relaxed text-muted-foreground">
                {item.texto}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
}
