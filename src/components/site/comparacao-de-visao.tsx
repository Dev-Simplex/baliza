"use client";

import { motion, useReducedMotion } from "motion/react";

import { Faixa } from "@/components/faixa";

/**
 * A comparação que carrega o site inteiro.
 *
 * O MESMO candidato, visto de dois jeitos. À esquerda, o que currículo e
 * entrevista entregam: um nome, um cargo e uma impressão simpática — e três
 * barras tapadas, que são as coisas que decidem a contratação e que ninguém
 * consegue ver. À direita, a leitura.
 *
 * A tarja que tapa é do mesmo formato da faixa alvo do medidor, de propósito:
 * venda e faixa são o mesmo objeto. Um esconde, o outro mede.
 *
 * Bruno é o caso didático de verdade do produto — o candidato que encanta na
 * entrevista e não pede o fechamento. Os números vêm do motor, não de um mock.
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
        className="flex flex-col rounded-2xl border border-dashed bg-n-surface-2/50 p-6"
      >
        <p className="etiqueta">Com vendas nos olhos</p>

        <div className="mt-5">
          <p className="text-[15px] font-semibold">Bruno Tavares</p>
          <p className="text-[13px] text-muted-foreground">
            Executivo de Vendas — Prospecção
          </p>
        </div>

        <p className="mt-5 border-l-2 border-border pl-3 text-[14px] leading-relaxed text-muted-foreground italic">
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
                <span className="text-[13px] text-muted-foreground">{nome}</span>
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
                    "repeating-linear-gradient(45deg, var(--n-slate) 0 3px, transparent 3px 7px)",
                }}
                className="mt-2 h-4 rounded-[3px] opacity-35"
              />
            </li>
          ))}
        </ul>

        <p className="mt-auto pt-6 text-[12.5px] leading-relaxed text-muted-foreground">
          Currículo diz o que a pessoa fez. Entrevista diz quem se apresenta bem.
          O que decide a contratação fica tapado.
        </p>
      </motion.div>

      {/* ─── Sem ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={semMovimento ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="etiqueta">Com o Prumo</p>
          <p className="leitura text-[26px] leading-none font-semibold text-n-brass">
            85,1
          </p>
        </div>

        <div className="mt-5">
          <p className="text-[15px] font-semibold">Bruno Tavares</p>
          <p className="text-[13px] text-muted-foreground">
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

        <p className="mt-auto pt-6 text-[12.5px] leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">
            Cooperação bem acima da faixa
          </span>{" "}
          é o que derruba a aderência. Em prospecção, quem evita atrito não pede
          o fechamento e dá desconto pra não desagradar. É exatamente o que a
          entrevista leu como &ldquo;simpático&rdquo;.
        </p>
      </motion.div>
    </div>
  );
}
