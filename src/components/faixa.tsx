"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * A Faixa — o elemento-assinatura do produto.
 *
 * Todo concorrente mostra um radar e um número. O radar responde "como essa
 * pessoa é". Nenhuma das duas coisas responde a pergunta do recrutador, que é
 * "o quanto essa pessoa serve PRA ESTA VAGA" — e essa resposta é uma distância
 * até uma faixa, não um ponto numa teia.
 *
 * Este componente desenha exatamente a conta do §4.4:
 *
 *     ├───────────────[▓▓▓▓ faixa alvo ▓▓▓▓]──────────────┤
 *     0                    ╎          ▲ 78                100
 *                        ideal      escore
 *
 * Quando o escore cai FORA da faixa, o trecho entre a borda da faixa e o
 * marcador é desenhado em argila: é o desvio que está custando pontos, visível.
 * É a única forma honesta de mostrar um número que decide sobre gente.
 */

export type DadosDaFaixa = {
  fator: string;
  nome: string;
  escore: number;
  faixa: [number, number];
  ideal: number;
  peso: number;
  tipo: "maior_melhor" | "faixa_otima" | "menor_melhor" | "irrelevante";
  dentro: boolean;
};

const ROTULO_DO_TIPO: Record<DadosDaFaixa["tipo"], string> = {
  maior_melhor: "quanto mais, melhor",
  faixa_otima: "faixa ótima — penaliza os dois lados",
  menor_melhor: "quanto menos, melhor",
  irrelevante: "não pesa nesta vaga",
};

export function Faixa({
  dados,
  compacto = false,
  atraso = 0,
}: {
  dados: DadosDaFaixa;
  compacto?: boolean;
  atraso?: number;
}) {
  const semMovimento = useReducedMotion();
  const { escore, faixa, ideal, peso, tipo, dentro, nome } = dados;
  const [lo, hi] = faixa;
  const irrelevante = tipo === "irrelevante" || peso === 0;

  // O trecho de desvio: da borda mais próxima da faixa até o escore.
  const bordaMaisProxima = escore < lo ? lo : hi;
  const desvioEsquerda = Math.min(escore, bordaMaisProxima);
  const desvioLargura = Math.abs(escore - bordaMaisProxima);

  const cor = irrelevante
    ? "var(--n-slate)"
    : dentro
      ? "var(--n-teal)"
      : "var(--n-clay)";

  return (
    <div className={cn("group", irrelevante && "opacity-55")}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="etiqueta shrink-0">{dados.fator}</span>
          <span
            className={cn(
              "truncate font-medium",
              compacto ? "text-[13px]" : "text-sm",
            )}
          >
            {nome}
          </span>
        </div>

        <div className="flex shrink-0 items-baseline gap-2">
          {!compacto && (
            <span className="etiqueta hidden sm:inline">
              {irrelevante ? "peso 0" : `peso ${peso}`}
            </span>
          )}
          <span
            className={cn(
              "leitura tabular-nums font-semibold",
              compacto ? "text-sm" : "text-base",
            )}
            style={{ color: irrelevante ? undefined : cor }}
          >
            {Math.round(escore)}
          </span>
        </div>
      </div>

      {/* ─── O trilho ─────────────────────────────────────────────────── */}
      <div
        className={cn("relative mt-2", compacto ? "h-5" : "h-7")}
        role="img"
        aria-label={
          irrelevante
            ? `${nome}: escore ${Math.round(escore)}. Esta dimensão não pesa nesta vaga.`
            : `${nome}: escore ${Math.round(escore)}, faixa alvo de ${lo} a ${hi}. ${dentro ? "Dentro da faixa." : "Fora da faixa."}`
        }
      >
        {/* base + marcas de calibração */}
        <div
          className={cn(
            "regua absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-muted",
            compacto ? "h-1.5" : "h-2",
          )}
        />

        {/* faixa alvo */}
        {!irrelevante && (
          <motion.div
            initial={semMovimento ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: atraso, ease: [0.22, 1, 0.36, 1] }}
            style={{
              left: `${lo}%`,
              width: `${hi - lo}%`,
              transformOrigin: "left center",
              background: "color-mix(in oklab, var(--n-teal) 22%, transparent)",
              borderLeft: "1.5px solid var(--n-teal)",
              borderRight: "1.5px solid var(--n-teal)",
            }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-[3px]",
              compacto ? "h-3" : "h-4",
            )}
          />
        )}

        {/* o desvio que está custando pontos */}
        {!irrelevante && !dentro && desvioLargura > 0.5 && (
          <motion.div
            initial={semMovimento ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: atraso + 0.35 }}
            style={{
              left: `${desvioEsquerda}%`,
              width: `${desvioLargura}%`,
              background:
                "repeating-linear-gradient(45deg, var(--n-clay) 0 2px, transparent 2px 5px)",
            }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full",
              compacto ? "h-1.5" : "h-2",
            )}
          />
        )}

        {/* ideal */}
        {!irrelevante && (
          <div
            style={{ left: `${ideal}%` }}
            className={cn(
              "absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 bg-n-teal/60",
              compacto ? "h-4" : "h-5",
            )}
          />
        )}

        {/* marcador do escore */}
        <motion.div
          initial={semMovimento ? false : { left: "0%", opacity: 0 }}
          animate={{ left: `${escore}%`, opacity: 1 }}
          transition={{
            duration: 0.7,
            delay: atraso + 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div
            className={cn(
              "brilho-latao rotate-45 rounded-[2px] border",
              compacto ? "size-2.5" : "size-3",
            )}
            style={{
              background: "var(--n-brass)",
              borderColor: "var(--n-brass)",
            }}
          />
        </motion.div>
      </div>

      {!compacto && (
        <div className="mt-1 flex items-center justify-between">
          <span className="etiqueta">{ROTULO_DO_TIPO[tipo]}</span>
          {!irrelevante && (
            <span className="etiqueta">
              alvo {lo}–{hi}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/** Versão mínima para linha de ranking: só trilho, faixa e marcador. */
export function FaixaMinima({
  escore,
  faixa,
  dentro,
  className,
}: {
  escore: number;
  faixa: [number, number];
  dentro: boolean;
  className?: string;
}) {
  const [lo, hi] = faixa;
  return (
    <div className={cn("relative h-1.5 w-full", className)}>
      <div className="absolute inset-0 rounded-full bg-muted" />
      <div
        style={{ left: `${lo}%`, width: `${hi - lo}%` }}
        className="absolute inset-y-0 rounded-full bg-n-teal/30"
      />
      <div
        style={{ left: `${escore}%` }}
        className={cn(
          "absolute top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-[1px]",
          dentro ? "bg-n-brass" : "bg-n-clay",
        )}
      />
    </div>
  );
}
