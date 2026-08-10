"use client";

import { useEffect, useRef } from "react";

/**
 * O fundo do herói: fluxo neural vertical em constelação.
 *
 * ─── ISTO É UM SUBSTITUTO, e está marcado como tal ────────────────────────
 * O briefing manda usar `image_0.png` como fundo desta seção. A imagem foi
 * citada em três pedidos e não chegou anexada em nenhum — procurei no disco,
 * não existe. Em vez de travar a página inteira num arquivo ausente, o fundo é
 * desenhado por código, seguindo a descrição: fluxo vertical do alto (mente,
 * ciano) para baixo (magenta e vermelho), constelações esparsas, muito preto.
 *
 * TROCA EM UMA LINHA: quando a imagem existir, ponha-a em `public/`, e
 * substitua este componente pela `<Image fill priority />` dela dentro do mesmo
 * contêiner do herói. Nada mais na página depende daqui.
 *
 * ─── Por que SVG e não canvas ─────────────────────────────────────────────
 * A composição é estática — o que se move é o pulso dos nodos (CSS, na GPU) e o
 * paralaxe (um `translate3d` só). Canvas exigiria laço de quadros para
 * redesenhar algo que não muda. SVG entrega isto sem um único quadro de
 * JavaScript, e escala em qualquer tela sem borrar.
 *
 * ─── E por que as posições são fixas, não sorteadas ───────────────────────
 * Constelação sorteada muda a cada carregamento: a página perde identidade e
 * qualquer captura de regressão vira falso positivo. Estas coordenadas foram
 * escolhidas para o fluxo descer em S suave e guiar o olho até o texto.
 */

/** Os nodos do fluxo: [x%, y%, raio, cor, atraso do pulso]. */
const NODOS: Array<[number, number, number, string, number]> = [
  // Alto — a mente. Ciano, os maiores.
  [50, 6, 3.4, "var(--nodo-ciano)", 0],
  [44, 12, 1.6, "var(--nodo-ciano)", 0.4],
  [57, 14, 2.0, "var(--nodo-ciano)", 0.9],
  [50, 19, 2.6, "var(--nodo-ciano)", 0.2],
  // Meio — traços e requisitos. Laranja, amarelo, rosa.
  [42, 27, 1.8, "var(--nodo-laranja)", 1.1],
  [59, 31, 2.2, "var(--nodo-amarelo)", 0.6],
  [50, 36, 3.0, "var(--nodo-laranja)", 1.5],
  [38, 43, 1.5, "var(--nodo-rosa)", 0.3],
  [63, 47, 2.4, "var(--nodo-rosa)", 1.8],
  [50, 52, 2.0, "var(--nodo-amarelo)", 0.8],
  // Baixo — o encontro. Magenta e vermelho, o maior de todos no fim.
  [45, 62, 2.6, "var(--nodo-magenta)", 1.3],
  [56, 70, 2.0, "var(--nodo-magenta)", 0.5],
  [50, 80, 4.2, "var(--nodo-vermelho)", 0],
];

/** As ligações do fluxo, por índice de nodo. */
const LIGACOES: Array<[number, number]> = [
  [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5],
  [4, 6], [5, 6], [6, 7], [6, 8], [7, 9], [8, 9],
  [9, 10], [10, 11], [11, 12],
];

/** Estrelas de fundo, esparsas. */
const ESTRELAS: Array<[number, number, number]> = [
  [8, 12, 0.6], [17, 34, 0.5], [12, 61, 0.7], [24, 78, 0.5], [31, 19, 0.6],
  [69, 9, 0.5], [78, 27, 0.7], [86, 52, 0.6], [73, 71, 0.5], [91, 84, 0.6],
  [35, 88, 0.5], [64, 92, 0.6], [22, 47, 0.4], [82, 39, 0.5], [6, 88, 0.5],
];

export function FundoNeural() {
  const camada = useRef<HTMLDivElement>(null);

  /* Paralaxe leve.
     Um listener de scroll com `passive` e um `translate3d` — sem biblioteca e
     sem `useState`, porque mudar estado a cada pixel rolado renderizaria o
     React dezenas de vezes por segundo para mover um fundo. O fator é 0,25:
     acima disso o fundo "descola" do conteúdo e o olho percebe o truque. */
  useEffect(() => {
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz) return;

    let pedido = 0;
    const aoRolar = () => {
      if (pedido) return;
      pedido = window.requestAnimationFrame(() => {
        pedido = 0;
        if (camada.current)
          camada.current.style.transform = `translate3d(0, ${window.scrollY * 0.25}px, 0)`;
      });
    };

    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      window.removeEventListener("scroll", aoRolar);
      if (pedido) window.cancelAnimationFrame(pedido);
    };
  }, []);

  return (
    <div
      ref={camada}
      aria-hidden
      className="pointer-events-none absolute inset-0 will-change-transform"
    >
      {/* Halo do topo (a mente acesa) e do rodapé (o nodo vermelho), que é de
          onde a última seção puxa a cor. */}
      <div
        className="absolute inset-x-0 top-0 h-[55vh]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 10%, rgba(53,224,224,0.13), transparent 70%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[45vh]"
        style={{
          background:
            "radial-gradient(55% 55% at 50% 85%, rgba(255,45,85,0.12), transparent 70%)",
        }}
      />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        {ESTRELAS.map(([x, y, r], i) => (
          <circle key={`e${i}`} cx={x} cy={y} r={r * 0.12} fill="#e9f4f7" opacity={0.5} />
        ))}

        {LIGACOES.map(([a, b], i) => (
          <line
            key={`l${i}`}
            x1={NODOS[a][0]}
            y1={NODOS[a][1]}
            x2={NODOS[b][0]}
            y2={NODOS[b][1]}
            stroke="#e9f4f7"
            strokeWidth={0.09}
            opacity={0.16}
          />
        ))}

        {NODOS.map(([x, y, r, cor, atraso], i) => (
          <g key={`n${i}`}>
            <circle cx={x} cy={y} r={r * 0.42} fill={cor} opacity={0.18}>
              <animate
                attributeName="r"
                values={`${r * 0.42};${r * 0.75};${r * 0.42}`}
                dur="3.6s"
                begin={`${atraso}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={x} cy={y} r={r * 0.16} fill={cor} />
          </g>
        ))}
      </svg>
    </div>
  );
}
