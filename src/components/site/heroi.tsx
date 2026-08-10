"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export type VagaDaVitrine = { nome: string; fit: number };

/**
 * A cena 3D entra SOB DEMANDA, e isso não é otimização opcional.
 *
 * Three.js mais React Three Fiber somam perto de 1 MB de JavaScript. Numa
 * página cujo trabalho é parecer premium, o primeiro sinal de qualidade é o
 * texto aparecer imediatamente. Com `ssr: false` e importação dinâmica, o HTML
 * e a tipografia chegam no primeiro quadro e o objeto entra depois, em fade —
 * quem tem conexão ruim lê a proposta enquanto o 3D carrega, em vez de encarar
 * preto.
 */
const PrumoScene = dynamic(
  () => import("@/components/site/prumo-scene").then((m) => m.PrumoScene),
  { ssr: false },
);

/** Quanto tempo cada vaga fica em cena antes de a referência trocar sozinha. */
const PERMANENCIA = 5200;

export function Heroi({ vagas }: { vagas: VagaDaVitrine[] }) {
  const semMovimento = useReducedMotion() ?? false;
  const [indice, setIndice] = useState(0);
  const [alinhado, setAlinhado] = useState(false);

  const vaga = vagas[indice];

  /* O ciclo: alinha, mostra a leitura, solta, troca de vaga.
     Ele roda sozinho porque a página precisa contar a história para quem só
     olha — mas o clique adianta a etapa, então quem quiser conduzir, conduz. */
  /* O ciclo dispara no efeito, e o efeito só existe no cliente. Não há mais um
     estado `montado`: `dynamic(..., { ssr: false })` já garante que a cena não
     renderiza no servidor, e um segundo guarda para a mesma coisa custava um
     render extra a cada carregamento — que é o que o compilador do React
     reclamava em "setState síncrono dentro de efeito". */
  useEffect(() => {
    const t1 = window.setTimeout(() => setAlinhado(true), 900);
    const t2 = window.setTimeout(() => setAlinhado(false), PERMANENCIA - 700);
    const t3 = window.setTimeout(
      () => setIndice((i) => (i + 1) % vagas.length),
      PERMANENCIA,
    );
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [indice, vagas.length]);

  const aoClicar = useCallback(() => setAlinhado(true), []);

  return (
    <section
      className="relative h-svh w-full cursor-crosshair select-none"
      onClick={aoClicar}
    >
      {/* A cena fica atrás de tudo e não recebe eventos: o clique é ouvido pela
          seção, não pelo canvas, senão os links do cabeçalho parariam de
          funcionar sobre a área do 3D. */}
      <div className="absolute inset-0 z-0">
        <PrumoScene
          vaga={vaga}
          indice={indice}
          alinhado={alinhado}
          semMovimento={semMovimento}
        />
      </div>

      {/* ─── Metadados do sistema ─────────────────────────────────────── */}
      <p className="palco-dado pointer-events-none absolute left-6 top-24 z-10 sm:left-10">
        Prumo_system // 001
      </p>
      <p className="palco-dado pointer-events-none absolute left-6 top-32 z-10 sm:left-10">
        Matching_engine
      </p>
      <p className="palco-dado pointer-events-none absolute right-6 top-24 z-10 text-right sm:right-10">
        Behavioral_vector
      </p>
      <p className="palco-dado pointer-events-none absolute right-6 top-32 z-10 text-right sm:right-10">
        Status: {alinhado ? "aligned" : "seeking"}
      </p>

      {/* ─── A leitura da vaga ──────────────────────────────────────────
          ABAIXO do peso, e não sobre ele. A primeira versão centralizava a
          leitura em 52% da altura — exatamente onde o objeto está — e o
          resultado, visto na captura, foi "REFERÊNCIA ENCONTRADA" impresso por
          cima do arame: os dois ilegíveis, e o objeto que é o argumento da
          página coberto pelo texto que o explica. */}
      <div className="pointer-events-none absolute inset-x-0 top-[70%] z-10 flex justify-center px-6">
        <AnimatePresence mode="wait">
          {alinhado && (
            <motion.div
              key={vaga.nome}
              initial={semMovimento ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={semMovimento ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-center"
            >
              <p className="palco-dado !text-[var(--palco-cobre)]">
                Referência encontrada
              </p>
              <p className="palco-dado mt-3 !text-[var(--palco-tinta-fraca)]">
                Vaga → {vaga.nome}
              </p>
              <p
                className="mt-1 text-2xl font-light tabular-nums text-[var(--palco-tinta)]"
                style={{ fontFamily: "var(--fonte-mono)" }}
              >
                {vaga.fit}
                <span className="text-sm align-super">%</span>{" "}
                <span className="palco-dado !text-[var(--palco-tinta-tenue)]">
                  de aderência
                </span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── A fala ───────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-6 pb-14 sm:px-10">
        <div className="mx-auto max-w-5xl">
          <p className="palco-dado">Prumo</p>

          <h1 className="palco-declaracao mt-4 max-w-2xl text-2xl sm:text-4xl">
            Não existe perfil ideal.
            {/* A segunda metade entra depois, e é ela que carrega a tese. O
                intervalo entre as duas é o tempo de a primeira soar como
                provocação. */}
            <motion.span
              className="block text-[var(--palco-tinta-fraca)]"
              initial={semMovimento ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4, duration: 1.2 }}
            >
              Existe o perfil certo para cada vaga.
            </motion.span>
          </h1>

          <div className="palco-regua mt-10" />

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="palco-dado">
              Alignment: {alinhado ? `${vaga.fit}.0%` : "—"}
            </p>
            <p className="palco-dado hidden sm:block">
              Clique para alinhar · role para descobrir
            </p>
          </div>
        </div>
      </div>

      {/* O conteúdo que o 3D representa, em texto, para leitor de tela. */}
      <div className="sr-only">
        <p>
          Demonstração: o mesmo perfil comparado a vagas diferentes.{" "}
          {vagas.map((v) => `${v.nome}: ${v.fit} por cento de aderência.`).join(" ")}
        </p>
      </div>
    </section>
  );
}
