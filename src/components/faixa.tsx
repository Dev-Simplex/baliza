"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * A Faixa — o elemento-assinatura da Baliza.
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
 * É o símbolo da marca deitado: a faixa é a vaga, o marcador é a pessoa, e a
 * distância entre os dois é o FIT. Por isso ele aparece na landing, no
 * relatório e no produto — é o mesmo desenho dizendo a mesma coisa três vezes.
 *
 * Três decisões de leitura que não são estéticas:
 *
 * · O DESVIO é desenhado. Quando o escore cai fora, o trecho entre a borda da
 *   faixa e o marcador vira uma barra de argila. É o que está custando pontos,
 *   visível — a única forma honesta de mostrar um número que decide sobre gente.
 *
 * · O desvio também é ESCRITO ("11 acima do alvo"). Cor sozinha não informa
 *   quem não distingue verde de laranja, e o número exato é o que vira pergunta
 *   de entrevista.
 *
 * · Argila, nunca vermelho. Fora da faixa é atenção, não reprovação — a mesma
 *   regra que proíbe o produto de dizer "reprovado" proíbe a paleta de dizer
 *   por ele.
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

/** Curto e funcional: o marcador chega, não desfila. */
const ENTRADA = { duration: 0.24, ease: [0.32, 0.72, 0, 1] } as const;

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
  const desvio = Math.round(desvioLargura);
  const acima = escore > hi;

  const cor = irrelevante
    ? "var(--muted-foreground)"
    : dentro
      ? "var(--dentro)"
      : "var(--fora)";

  const alturaDoTrilho = compacto ? "h-1.5" : "h-2";
  const alturaDaFaixa = compacto ? "h-3.5" : "h-4.5";

  return (
    <div className={cn("group", irrelevante && "opacity-55")}>
      {/* ─── Cabeça: fator, nome e leitura ──────────────────────────────
          Em 320px o nome trunca e o número nunca sai da tela: o número é o
          que a pessoa veio ver, e ele fica ancorado à direita. */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="etiqueta shrink-0">{dados.fator}</span>
          <span
            className={cn(
              "truncate font-medium",
              compacto ? "t-corpo-sm" : "text-sm",
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
              "leitura font-semibold tabular-nums",
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
        className={cn("relative mt-2", compacto ? "h-5" : "h-6")}
        role="img"
        aria-label={
          irrelevante
            ? `${nome}: escore ${Math.round(escore)}. Esta dimensão não pesa nesta vaga.`
            : `${nome}: escore ${Math.round(escore)}, faixa alvo de ${lo} a ${hi}. ${
                dentro
                  ? "Dentro da faixa."
                  : `Fora da faixa: ${desvio} ${acima ? "acima" : "abaixo"} do alvo.`
              }`
        }
      >
        {/* base + marcas de calibração */}
        <div
          className={cn(
            "regua absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-full bg-muted",
            alturaDoTrilho,
          )}
        />

        {/* A faixa que a vaga pede. Preenchimento suave e duas bordas sólidas:
            são as bordas que dizem onde o alvo começa e termina, e é nelas que
            o olho mede a distância até o marcador. */}
        {!irrelevante && (
          <motion.div
            initial={semMovimento ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ ...ENTRADA, delay: atraso }}
            style={{
              left: `${lo}%`,
              width: `${hi - lo}%`,
              transformOrigin: "left center",
              background: "color-mix(in oklab, var(--dentro) 16%, transparent)",
              borderInline: "1.5px solid var(--dentro)",
            }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-[2px]",
              alturaDaFaixa,
            )}
          />
        )}

        {/* O desvio que está custando pontos. Barra sólida e rebaixada em vez de
            hachura: em 320px a hachura vira ruído cinza e some. */}
        {!irrelevante && !dentro && desvioLargura > 0.5 && (
          <motion.div
            initial={semMovimento ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ ...ENTRADA, delay: atraso + 0.08 }}
            style={{
              left: `${desvioEsquerda}%`,
              width: `${desvioLargura}%`,
              transformOrigin: acima ? "left center" : "right center",
              background: "var(--fora)",
            }}
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full",
              alturaDoTrilho,
            )}
          />
        )}

        {/* O ideal — presente, e discreto. Ele orienta; não é meta. */}
        {!irrelevante && (
          <div
            style={{ left: `${ideal}%` }}
            className={cn(
              "absolute top-1/2 w-px -translate-x-1/2 -translate-y-1/2 bg-dentro/50",
              compacto ? "h-3.5" : "h-4.5",
            )}
          />
        )}

        {/* O marcador da pessoa: uma agulha fina que atravessa o trilho e uma
            cabeça pequena por cima. A agulha é o que dá precisão — um losango
            solto flutua e deixa dúvida sobre qual ponto ele marca. */}
        <motion.div
          initial={semMovimento ? false : { left: "0%", opacity: 0 }}
          animate={{ left: `${escore}%`, opacity: 1 }}
          transition={{ ...ENTRADA, delay: atraso + 0.04 }}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <div
            className={cn(
              "w-[2px] rounded-full",
              compacto ? "h-5" : "h-6",
            )}
            style={{ background: "var(--marca-sinal)" }}
          />
          <div
            className={cn(
              "brilho-marca absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full",
              compacto ? "size-2" : "size-2.5",
            )}
            style={{ background: "var(--marca-sinal)" }}
          />
        </motion.div>
      </div>

      {/* ─── Pé: a regra da dimensão e onde ficou o alvo ────────────────
          O desvio vem escrito porque cor não é informação para todo mundo — e
          porque "11 acima do alvo" é o que vira pergunta na entrevista. */}
      {!compacto && (
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <span className="etiqueta">{ROTULO_DO_TIPO[tipo]}</span>
          {!irrelevante && (
            <span className="etiqueta">
              {dentro ? (
                <>
                  alvo {lo}–{hi}
                </>
              ) : (
                <span style={{ color: "var(--fora)" }}>
                  {desvio} {acima ? "acima" : "abaixo"} do alvo {lo}–{hi}
                </span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Versão mínima para linha de ranking: só trilho, faixa e marcador.
 *
 * Aqui não cabe rótulo nenhum, então a informação toda mora na posição. O
 * `aria-label` é obrigatório porque, sem texto, esta barra não existe para
 * quem usa leitor de tela.
 */
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
    <div
      className={cn("relative h-1.5 w-full", className)}
      role="img"
      aria-label={`Escore ${Math.round(escore)} numa faixa alvo de ${lo} a ${hi}. ${
        dentro ? "Dentro da faixa." : "Fora da faixa."
      }`}
    >
      <div className="absolute inset-0 rounded-full bg-muted" />
      <div
        style={{ left: `${lo}%`, width: `${hi - lo}%` }}
        className="absolute inset-y-0 rounded-full bg-dentro/25"
      />
      <div
        style={{ left: `${escore}%`, background: "var(--marca-sinal)" }}
        className="absolute top-1/2 h-3 w-[2px] -translate-x-1/2 -translate-y-1/2 rounded-full"
      />
      {!dentro && (
        <div
          style={{ left: `${escore}%` }}
          className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fora"
        />
      )}
    </div>
  );
}
