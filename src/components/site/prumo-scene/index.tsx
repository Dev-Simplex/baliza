"use client";

import { useCallback, useEffect, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type * as THREE from "three";

import { Particulas } from "./particulas";
import { PesoWireframe } from "./peso-wireframe";

export type Vaga = { nome: string; fit: number };

/**
 * A cena do prumo.
 *
 * ─── Sobre a escolha de Three.js ──────────────────────────────────────────
 * A primeira versão desta página desenhava o prumo em canvas 2D, e eu defendi
 * isso: R3F custa perto de 1 MB de JavaScript para um objeto só. O dono do
 * produto pediu 3D em wireframe duas vezes, com detalhe — malha orgânica,
 * geometria procedural. É decisão dele, e o custo é real e conhecido: a cena
 * inteira é carregada SOB DEMANDA (ver `dynamic` em `cena-preguicosa.tsx`), de
 * modo que o HTML e o texto chegam antes e ninguém espera o 3D para ler.
 *
 * ─── A física mora aqui, e não no componente do peso ──────────────────────
 * Um lugar só decide o ângulo: pêndulo amortecido integrado por passo fixo. O
 * peso apenas obedece. Separar assim é o que permite trocar a aparência do
 * objeto sem tocar no movimento — e o movimento é o argumento do produto.
 */

/* Constantes do pêndulo. Foram escolhidas ouvindo o objeto, não calculadas:
   com amortecimento acima de ~1,4 a chegada no equilíbrio fica burocrática, e
   abaixo de ~0,5 o peso ainda treme quando a próxima vaga entra. */
const GRAVIDADE = 9.81;
const COMPRIMENTO = 1.6;
const AMORTECIMENTO = 0.9;
const PASSO = 1 / 120;

/** Quanto o prumo inclina em repouso para cada vaga: quanto menor o fit, mais torto. */
function anguloDaVaga(fit: number, indice: number) {
  const desvio = ((100 - fit) / 100) * 0.42;
  return indice % 2 === 0 ? desvio : -desvio;
}

function Pendulo({
  vaga,
  indice,
  alinhado,
  ponteiro,
  semMovimento,
}: {
  vaga: Vaga;
  indice: number;
  alinhado: boolean;
  ponteiro: React.RefObject<{ x: number; ativo: boolean }>;
  semMovimento: boolean;
}) {
  const braco = useRef<THREE.Group>(null);
  const angulo = useRef(0);
  const velocidade = useRef(0);
  const acumulador = useRef(0);

  /* A rotação é escrita DIRETO no objeto da cena, dentro do quadro.

     A primeira versão guardava o ângulo em estado e forçava um re-render do
     React a cada quadro só para o JSX aplicar a rotação — sessenta renderizações
     por segundo para girar um grupo. Além do desperdício, o compilador do React
     recusa (e está certo): ler `ref.current` durante a renderização é justamente
     o que quebra quando o React reexecuta um componente.

     Em R3F o caminho é este: o React monta a árvore uma vez, e o laço de quadros
     mexe nos objetos por referência. */
  useFrame((_, delta) => {
    if (!braco.current) return;

    if (semMovimento) {
      braco.current.rotation.z = alinhado ? anguloDaVaga(vaga.fit, indice) : 0;
      return;
    }

    // Acumulador com teto: uma aba que volta do segundo plano entrega um delta
    // enorme, e integrar tudo de uma vez arremessa o pêndulo para fora da tela.
    acumulador.current = Math.min(acumulador.current + delta, 0.25);
    const repouso = alinhado ? anguloDaVaga(vaga.fit, indice) : 0;

    while (acumulador.current >= PASSO) {
      const p = ponteiro.current;
      // O ponteiro puxa; quanto mais longe do centro, mais forte, com teto.
      const puxao = p?.ativo ? Math.max(-1, Math.min(1, p.x)) * 1.6 : 0;

      const aceleracao =
        -(GRAVIDADE / COMPRIMENTO) * Math.sin(angulo.current - repouso) -
        AMORTECIMENTO * velocidade.current +
        puxao;

      velocidade.current += aceleracao * PASSO;
      angulo.current += velocidade.current * PASSO;
      acumulador.current -= PASSO;
    }

    braco.current.rotation.z = angulo.current;
  });

  return (
    <group ref={braco} position={[0, 3.2, 0]}>
      {/* O fio: um cilindro finíssimo, pendurado do ponto de suspensão. Linha
          solta não recebe espessura consistente entre navegadores; cilindro
          recebe. */}
      <mesh position={[0, -1.6, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 3.2, 6]} />
        <meshBasicMaterial color="#e8e6e3" transparent opacity={0.22} />
      </mesh>
      <group position={[0, -3.55, 0]} scale={0.42}>
        <PesoWireframe alinhado={alinhado} semMovimento={semMovimento} />
      </group>
    </group>
  );
}

export function PrumoScene({
  vaga,
  indice,
  alinhado,
  semMovimento,
}: {
  vaga: Vaga;
  indice: number;
  alinhado: boolean;
  semMovimento: boolean;
}) {
  const ponteiro = useRef({ x: 0, ativo: false });

  const aoMover = useCallback((e: PointerEvent) => {
    const meio = window.innerWidth / 2;
    ponteiro.current.x = (e.clientX - meio) / meio;
    ponteiro.current.ativo = true;
  }, []);

  useEffect(() => {
    if (semMovimento) return;
    window.addEventListener("pointermove", aoMover, { passive: true });
    const sair = () => (ponteiro.current.ativo = false);
    window.addEventListener("pointerleave", sair);
    return () => {
      window.removeEventListener("pointermove", aoMover);
      window.removeEventListener("pointerleave", sair);
    };
  }, [aoMover, semMovimento]);

  return (
    <Canvas
      // `dpr` com teto em 1,5: acima disso o ganho é invisível num objeto de
      // arame e o custo de preenchimento dobra em telas Retina.
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      // Renderiza só quando algo muda. Numa cena parada — que é o estado normal
      // desta página — o laço de quadros para, e com ele a ventoinha.
      frameloop={semMovimento ? "demand" : "always"}
      style={{ pointerEvents: "none" }}
    >
      <color attach="background" args={["#050505"]} />
      <fog attach="fog" args={["#050505", 7, 15]} />

      <Particulas semMovimento={semMovimento} />
      <Pendulo
        vaga={vaga}
        indice={indice}
        alinhado={alinhado}
        ponteiro={ponteiro}
        semMovimento={semMovimento}
      />
    </Canvas>
  );
}
