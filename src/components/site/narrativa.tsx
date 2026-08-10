"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";

/**
 * As duas peças de movimento da página inicial.
 *
 * Ambas respeitam `prefers-reduced-motion` de verdade — e "de verdade" quer
 * dizer que o conteúdo continua LEGÍVEL e completo sem o movimento, não que ele
 * fica invisível esperando uma animação que nunca vem. Página cujo texto só
 * aparece com scroll-animation é página em branco para quem desligou animação,
 * e isso inclui gente com labirintite e enxaqueca vestibular.
 */

/* ─────────────────────────────────────────────────────────────────────────
   A narrativa que o scroll revela.
   ───────────────────────────────────────────────────────────────────────── */

const FALAS = [
  "Uma pessoa.",
  "Várias possibilidades.",
  "Uma referência para cada vaga.",
  "O Prumo.",
] as const;

/**
 * Quatro frases que se substituem conforme a página rola.
 *
 * ─── Por que uma seção alta com conteúdo grudado, e não quatro telas ──────
 * A seção tem 400vh e o texto fica `sticky` no meio dela. Isso dá ao scroll a
 * função de régua do tempo: a pessoa controla o ritmo da revelação com o
 * próprio dedo, e pode voltar. Quatro seções de 100vh dariam quatro saltos
 * discretos, que é a estética de apresentação de slides — o oposto de
 * cinematográfico.
 *
 * ─── E por que cada frase existe no DOM o tempo todo ──────────────────────
 * Elas são empilhadas e trocam por opacidade, não por montagem/desmontagem.
 * Montar e desmontar faria o leitor de tela anunciar texto novo a cada rolagem,
 * e faria o navegador reflowar quatro vezes. Aqui só a opacidade muda.
 */
export function NarrativaDoScroll() {
  const alvo = useRef<HTMLDivElement>(null);
  const semMovimento = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: alvo,
    offset: ["start start", "end end"],
  });

  if (semMovimento) {
    // Sem movimento, a narrativa vira o que ela sempre foi por baixo: uma lista
    // de quatro afirmações, na ordem. Perde o cinema e mantém o argumento.
    return (
      <section className="relative z-10 px-6 py-32 sm:px-10">
        <ul className="mx-auto max-w-5xl space-y-6">
          {FALAS.map((f) => (
            <li key={f} className="palco-declaracao text-3xl sm:text-5xl">
              {f}
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section ref={alvo} className="relative z-10 h-[400vh]">
      <div className="sticky top-0 flex h-svh items-center justify-center px-6">
        <div className="relative mx-auto w-full max-w-5xl">
          {FALAS.map((fala, i) => (
            <Fala
              key={fala}
              texto={fala}
              indice={i}
              total={FALAS.length}
              progresso={scrollYProgress}
              ultima={i === FALAS.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Fala({
  texto,
  indice,
  total,
  progresso,
  ultima,
}: {
  texto: string;
  indice: number;
  total: number;
  progresso: MotionValue<number>;
  ultima: boolean;
}) {
  /* A janela de cada frase.

     ─── As janelas NÃO se sobrepõem, e isso foi aprendido na tela ───────────
     A primeira versão dissolvia uma frase na outra com folga generosa nas
     bordas — a ideia era cross-fade de cinema. Na captura de tela apareceu o
     que isso de fato produz: "Uma pessoa." e "Várias possibilidades." impressas
     UMA POR CIMA DA OUTRA, no mesmo ponto, ambas legíveis pela metade. Cinema
     dissolve planos diferentes; texto sobreposto no mesmo lugar vira borrão.

     Agora cada frase abre e fecha dentro da própria fatia, e a que sai chega a
     zero antes de a seguinte começar. O instante de preto entre as duas não é
     defeito: é a pausa que separa duas afirmações.

     ─── E a faixa é PRESA a [0,1] ───────────────────────────────────────────
     Sem prender, a primeira frase começava em -0,07 e a última terminava em
     1,07 — valores que o progresso do scroll nunca produz. A Motion converte a
     faixa em quadros-chave da Web Animations API, e a API recusa deslocamento
     fora de [0,1] com "Offsets must be monotonically non-decreasing". O erro
     subia até a fronteira de rota e a PÁGINA INICIAL INTEIRA virava a tela de
     "Esta tela não carregou": não degradava, quebrava. */
  const fatia = 1 / total;
  const inicio = indice * fatia;
  const fim = inicio + fatia;
  const respiro = fatia * 0.2;
  const preso = (n: number) => Math.min(1, Math.max(0, n));

  const faixa = [
    preso(inicio),
    preso(inicio + respiro),
    preso(fim - respiro),
    preso(fim),
  ];

  const opacidade = useTransform(progresso, faixa, [0, 1, 1, 0]);

  // Deslocamento mínimo — 12px. O suficiente para o olho ler "entrou", pouco o
  // bastante para não virar carrossel.
  const y = useTransform(progresso, faixa, [12, 0, 0, -12]);

  return (
    <motion.p
      style={{ opacity: opacidade, y }}
      className={`palco-declaracao absolute inset-x-0 text-center text-4xl sm:text-7xl ${
        ultima ? "text-[var(--palco-cobre)]" : ""
      }`}
    >
      {texto}
    </motion.p>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Revelação ao entrar na tela.
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Sobe e aparece quando entra na viewport, uma vez só.
 *
 * `once: true` porque conteúdo que reanima toda vez que reentra na tela é o que
 * transforma uma página elegante numa página cansativa — e quem rola de volta
 * para reler não quer esperar a animação de novo.
 *
 * Sem movimento configurado, devolve o filho cru: não há wrapper, não há
 * opacidade inicial, não há nada para dar errado.
 */
export function RevelaAoEntrar({
  children,
  atraso = 0,
}: {
  children: React.ReactNode;
  atraso?: number;
}) {
  const semMovimento = useReducedMotion();
  if (semMovimento) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, delay: atraso, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
