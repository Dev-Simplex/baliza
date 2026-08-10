"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * O pó no ar.
 *
 * ─── Por que UM objeto e não N ────────────────────────────────────────────
 * São 700 pontos num único `Points` com um buffer de posições. Setecentas
 * malhas separadas seriam setecentas chamadas de desenho por quadro e o
 * celular derreteria — a mesma imagem, com 1% do custo.
 *
 * ─── Por que a deriva é vertical e lentíssima ─────────────────────────────
 * O briefing pede "estrelas quase imperceptíveis", não campo estelar de
 * protetor de tela. Movimento lateral rápido lê como espaço sideral genérico;
 * subida lenta lê como poeira num feixe de luz — que é a atmosfera de
 * laboratório que a página inteira persegue.
 */

const QUANTIDADE = 700;
const RAIO = 9;

/**
 * Sorteio determinístico.
 *
 * `Math.random()` dentro do `useMemo` é chamada impura durante a renderização —
 * o compilador do React recusa, e com razão: memo pode ser reexecutado, e aí o
 * campo de partículas se rearranjaria sozinho no meio da cena.
 *
 * Um gerador com semente resolve os dois problemas de uma vez: a função vira
 * pura e o céu fica SEMPRE IGUAL, o que também torna a página reproduzível numa
 * captura de tela de regressão.
 */
function sorteioComSemente(semente: number) {
  let s = semente >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function Particulas({ semMovimento }: { semMovimento: boolean }) {
  const pontos = useRef<THREE.Points>(null);

  const { geometria, velocidades } = useMemo(() => {
    const pos = new Float32Array(QUANTIDADE * 3);
    const vel = new Float32Array(QUANTIDADE);
    const sortear = sorteioComSemente(20260810);

    for (let i = 0; i < QUANTIDADE; i++) {
      // Distribuição em caixa, e não em esfera: a câmera olha de frente, e uma
      // esfera concentraria pontos no centro exatamente onde está o objeto.
      pos[i * 3] = (sortear() - 0.5) * RAIO * 2;
      pos[i * 3 + 1] = (sortear() - 0.5) * RAIO * 1.4;
      pos[i * 3 + 2] = (sortear() - 0.5) * RAIO - 2;
      vel[i] = 0.02 + sortear() * 0.05;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return { geometria: g, velocidades: vel };
  }, []);

  useFrame((_, delta) => {
    if (semMovimento || !pontos.current) return;
    const pos = pontos.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;
    const teto = RAIO * 0.7;

    for (let i = 0; i < QUANTIDADE; i++) {
      arr[i * 3 + 1] += velocidades[i] * delta;
      // Quem passa do teto reaparece embaixo. Reciclar em vez de recriar mantém
      // o buffer estável — realocar 700 posições por quadro é lixo garantido.
      if (arr[i * 3 + 1] > teto) arr[i * 3 + 1] = -teto;
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pontos} geometry={geometria}>
      <pointsMaterial
        size={0.018}
        color="#e8e6e3"
        transparent
        opacity={0.35}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}
