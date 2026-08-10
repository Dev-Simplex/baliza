"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * O peso do prumo, em malha de arame.
 *
 * ─── Por que geometria PRÓPRIA, e não um icosaedro de biblioteca ──────────
 * Um `IcosahedronGeometry` com `wireframe` é o objeto 3D que todo site
 * experimental usa — reconhecível à distância, e reconhecível é o oposto do
 * que se pede aqui. Este é construído à mão a partir de um perfil: um prumo de
 * pedreiro tem uma silhueta específica (ombro arredondado, corpo cônico, ponta
 * fina), e é ela que faz o objeto ser lido como PRUMO e não como "uma forma".
 *
 * O perfil é revolucionado em torno do eixo Y — é a mesma técnica de um torno.
 * Daí sai um casco de triângulos; as arestas viram as linhas do arame.
 *
 * ─── E por que ele respira ────────────────────────────────────────────────
 * Cada vértice é deslocado por ruído contínuo no tempo, com amplitude
 * minúscula (sub-milímetro na escala da cena). Parado, o arame é engenharia;
 * respirando, vira orgânico — que é a palavra do briefing. A amplitude precisa
 * ficar no limiar do perceptível: mais que isso e o objeto vira gelatina, o que
 * destrói a leitura de "peso de metal".
 */

/** O perfil do prumo, em coordenadas (raio, altura). Desenhado, não calculado. */
const PERFIL: Array<[number, number]> = [
  [0.0, 1.0],
  [0.16, 0.94],
  [0.26, 0.82],
  [0.32, 0.66],
  [0.34, 0.48],
  [0.32, 0.26],
  [0.26, 0.0],
  [0.17, -0.3],
  [0.08, -0.62],
  [0.0, -1.0],
];

const SEGMENTOS = 28;

function construirGeometria() {
  const pontos = PERFIL.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pontos, SEGMENTOS);
  geo.computeVertexNormals();
  return geo;
}

export function PesoWireframe({
  alinhado,
  semMovimento,
}: {
  /** Verdadeiro quando o prumo achou o ponto de equilíbrio da vaga. */
  alinhado: boolean;
  semMovimento: boolean;
}) {
  const grupo = useRef<THREE.Group>(null);
  const malha = useRef<THREE.LineSegments>(null);

  const { arestas, base } = useMemo(() => {
    const g = construirGeometria();
    return { arestas: new THREE.WireframeGeometry(g), base: g };
  }, []);

  /* Cópia dos vértices originais: o ruído é aplicado SOBRE eles a cada quadro.
     Sem a cópia, o deslocamento se acumularia e o objeto derreteria em segundos
     — erro clássico de animar geometria no lugar. */
  const originais = useMemo(
    () => Float32Array.from(arestas.attributes.position.array),
    [arestas],
  );

  useFrame((estado) => {
    if (!grupo.current) return;

    // Giro lentíssimo no próprio eixo. É o que impede a silhueta de parecer uma
    // figura chapada: o arame precisa mostrar que tem volume.
    if (!semMovimento) grupo.current.rotation.y = estado.clock.elapsedTime * 0.13;

    if (semMovimento || !malha.current) return;

    const t = estado.clock.elapsedTime;
    const pos = malha.current.geometry.attributes.position;
    const arr = pos.array as Float32Array;
    // Alinhado, a respiração quase cessa: o objeto "assenta". É a diferença
    // entre procurar e ter achado, dita sem texto nenhum.
    const amp = alinhado ? 0.004 : 0.016;

    for (let i = 0; i < arr.length; i += 3) {
      const x = originais[i];
      const y = originais[i + 1];
      const z = originais[i + 2];
      const onda =
        Math.sin(y * 5.5 + t * 1.4) * 0.6 + Math.sin(x * 7.0 - t * 1.1) * 0.4;
      arr[i] = x + onda * amp;
      arr[i + 1] = y + onda * amp * 0.35;
      arr[i + 2] = z + onda * amp;
    }
    pos.needsUpdate = true;
  });

  return (
    <group ref={grupo}>
      {/* O arame. `toneMapped` desligado para a cor sair exatamente como
          escolhida — com tone mapping, o cobre vira um marrom apagado. */}
      <lineSegments ref={malha} geometry={arestas}>
        <lineBasicMaterial
          color={alinhado ? "#d0844a" : "#8a6a52"}
          transparent
          opacity={alinhado ? 0.85 : 0.55}
          toneMapped={false}
        />
      </lineSegments>

      {/* Um casco quase invisível por dentro do arame. Sem ele, as linhas do
          outro lado do objeto aparecem por transparência e a forma perde
          profundidade — vira um emaranhado em vez de um sólido. */}
      <mesh geometry={base}>
        <meshBasicMaterial color="#050505" transparent opacity={0.92} />
      </mesh>
    </group>
  );
}
