"use client";

import { motion, useReducedMotion } from "motion/react";

import { Faixa } from "@/components/faixa";

/**
 * A comparação que carrega o site inteiro.
 *
 * O MESMO candidato, visto de dois jeitos. À esquerda, o que currículo e
 * entrevista entregam: um nome, um cargo e uma impressão simpática — e três
 * barras tapadas, que são justamente as coisas que decidem a contratação. À
 * direita, o contexto: as mesmas três dimensões lidas contra o que ESTA vaga
 * pede.
 *
 * A tarja que tapa tem o mesmo formato da faixa-alvo do medidor, de propósito.
 * É o conceito FIT em duas colunas — sozinha, nenhuma das metades decide nada.
 *
 * Bruno é o caso didático do produto: o candidato que encanta na entrevista e
 * não pede o fechamento. Os números são coerentes com o motor, mas são
 * demonstração — não são resultado de pessoa nenhuma.
 */
export function ComparacaoDeVisao() {
  const semMovimento = useReducedMotion();

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-5">
      {/* ─── Com vendas nos olhos ─────────────────────────────────────── */}
      <motion.div
        initial={semMovimento ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col rounded-2xl border border-dashed bg-superficie-2/50 p-6"
      >
        <p className="etiqueta">Currículo e entrevista</p>

        <div className="mt-5">
          <p className="t-corpo font-semibold">Bruno Tavares</p>
          <p className="t-corpo-sm text-muted-foreground">
            Executivo de Vendas — Prospecção
          </p>
        </div>

        <p className="mt-5 border-l-2 border-border pl-3 t-corpo leading-relaxed text-muted-foreground italic">
          &ldquo;Ótima entrevista. Simpático, comunicativo, se deu bem com todo
          mundo do time.&rdquo;
        </p>

        <ul className="mt-6 space-y-3.5" aria-label="Informações indisponíveis">
          {[
            "Cooperação",
            "Organização e Entrega",
            "Estabilidade sob Pressão",
          ].map((nome, i) => (
            <li key={nome}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="t-corpo-sm text-muted-foreground">{nome}</span>
                <span className="etiqueta">?</span>
              </div>
              {/* A tarja. Mesma altura e raio da faixa alvo do medidor. */}
              <motion.div
                aria-hidden
                initial={semMovimento ? false : { scaleX: 0.2, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{
                  duration: 0.45,
                  delay: 0.25 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{
                  transformOrigin: "left center",
                  backgroundImage:
                    "repeating-linear-gradient(45deg, var(--muted-foreground) 0 3px, transparent 3px 7px)",
                }}
                className="mt-2 h-4 rounded-[3px] opacity-35"
              />
            </li>
          ))}
        </ul>

        <p className="mt-auto pt-6 t-legenda leading-relaxed text-muted-foreground">
          O currículo mostra histórico. A entrevista mostra quem se apresenta
          bem. O que decide a contratação continua tapado.
        </p>
      </motion.div>

      {/* ─── Sem ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={semMovimento ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col rounded-2xl border bg-card p-6 shadow-baixa"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="etiqueta">Com a Baliza</p>
          <p className="t-numero">85,1</p>
        </div>

        <div className="mt-5">
          <p className="t-corpo font-semibold">Bruno Tavares</p>
          <p className="t-corpo-sm text-muted-foreground">
            Executivo de Vendas — Prospecção
          </p>
        </div>

        <div className="mt-6 space-y-5">
          <Faixa
            atraso={0.45}
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
          <Faixa
            atraso={0.6}
            dados={{
              fator: "C",
              nome: "Organização e Entrega",
              escore: 68.8,
              faixa: [55, 100],
              ideal: 100,
              peso: 4,
              tipo: "maior_melhor",
              dentro: true,
            }}
          />
          <Faixa
            atraso={0.75}
            dados={{
              fator: "E",
              nome: "Estabilidade sob Pressão",
              escore: 65.6,
              faixa: [65, 100],
              ideal: 100,
              peso: 5,
              tipo: "maior_melhor",
              dentro: true,
            }}
          />
        </div>

        <p className="mt-auto pt-6 t-legenda leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            Cooperação bem acima da faixa
          </span>{" "}
          é o que derruba a aderência. Em prospecção, quem evita atrito não pede
          o fechamento e dá desconto para não desagradar. É exatamente o que a
          entrevista leu como &ldquo;simpático&rdquo;.
        </p>
      </motion.div>
    </div>
  );
}
