"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Sobe e aparece ao entrar na tela, uma vez só.
 *
 * `once: true` porque conteúdo que reanima toda vez que reentra na viewport é o
 * que transforma uma página elegante numa página cansativa — e quem rola de
 * volta para reler não quer esperar a animação de novo.
 *
 * Com `prefers-reduced-motion`, devolve o filho cru: sem invólucro, sem
 * opacidade inicial, sem nada para dar errado. Página cujo texto só aparece com
 * animação é página em branco para quem desligou animação, e isso inclui gente
 * com labirintite e enxaqueca vestibular.
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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.85, delay: atraso, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
