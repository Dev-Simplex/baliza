"use client";

import dynamic from "next/dynamic";

import { Esqueleto } from "@/components/ui/esqueleto";

/**
 * Gráficos carregados sob demanda.
 *
 * O recharts é o maior pacote do cliente — 398 KB, mais que todo o resto da
 * aplicação somada. Importado direto, ele entra no caminho crítico de três
 * telas, incluindo `/r/[token]`: o relatório que o candidato abre no celular,
 * provavelmente em rede móvel, logo depois de responder seis minutos de
 * questionário. Fazer essa pessoa esperar por uma biblioteca de gráfico antes
 * de ver o próprio nome é o pior lugar possível para gastar meio megabyte.
 *
 * Aqui ele passa a carregar depois da hidratação, com um espaço reservado do
 * mesmo tamanho — então não há salto de layout quando o gráfico chega.
 */

function Reserva({ altura }: { altura: number }) {
  return (
    <div className="grid place-items-center" style={{ height: altura }}>
      <Esqueleto className="size-32 rounded-full" />
    </div>
  );
}

export const RadarComportamental = dynamic(
  () => import("./graficos").then((m) => m.RadarComportamental),
  { ssr: false, loading: () => <Reserva altura={260} /> },
);

export const BarrasPorFator = dynamic(
  () => import("./graficos").then((m) => m.BarrasPorFator),
  { ssr: false, loading: () => <Reserva altura={200} /> },
);

export const VolumeNoTempo = dynamic(
  () => import("./graficos").then((m) => m.VolumeNoTempo),
  { ssr: false, loading: () => <Reserva altura={200} /> },
);

export const DistribuicaoDeArquetipos = dynamic(
  () => import("./graficos").then((m) => m.DistribuicaoDeArquetipos),
  { ssr: false, loading: () => <Reserva altura={200} /> },
);
