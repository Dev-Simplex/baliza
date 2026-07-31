"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { FATORES, NOMES_DE_FATOR, type Fator } from "@/lib/instrument/types";

/**
 * Gráficos.
 *
 * Regra de cor: cada fator tem UMA cor em todo o produto. Organização e Entrega
 * é latão em qualquer tela, sempre. Trocar de gráfico não pode trocar o
 * significado da cor.
 */
export const COR_DO_FATOR: Record<Fator, string> = {
  C: "var(--chart-1)",
  E: "var(--chart-2)",
  X: "var(--chart-3)",
  A: "var(--chart-4)",
  O: "var(--chart-5)",
};

const eixo = {
  fontSize: 11,
  fontFamily: "var(--fonte-mono)",
  fill: "var(--muted-foreground)",
};

function CaixaDeDica({
  active,
  payload,
  label,
  sufixo = "",
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
  label?: string | number;
  sufixo?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 shadow-lg">
      {label != null && (
        <p className="etiqueta mb-1">{String(label)}</p>
      )}
      {payload.map((p, i) => (
        <p key={i} className="flex items-center gap-2 t-corpo-sm">
          {p.color && (
            <span
              className="size-2 rounded-full"
              style={{ background: p.color }}
            />
          )}
          <span className="text-muted-foreground">{p.name}</span>
          <span className="leitura font-medium text-foreground">
            {typeof p.value === "number" ? Math.round(p.value * 10) / 10 : p.value}
            {sufixo}
          </span>
        </p>
      ))}
    </div>
  );
}

/** Radar dos cinco fatores. Aceita um segundo perfil para comparação. */
export function RadarComportamental({
  escores,
  comparar,
  rotuloA = "Candidato",
  rotuloB = "Comparação",
  altura = 280,
}: {
  escores: Record<Fator, number>;
  comparar?: Record<Fator, number> | null;
  rotuloA?: string;
  rotuloB?: string;
  altura?: number;
}) {
  const dados = FATORES.map((f) => ({
    fator: NOMES_DE_FATOR[f].curto,
    curto: f,
    a: escores[f] ?? 0,
    b: comparar?.[f] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <RadarChart data={dados} outerRadius="68%" margin={{ top: 10, right: 26, bottom: 10, left: 26 }}>
        <PolarGrid stroke="var(--linha)" />
        <PolarAngleAxis
          dataKey="fator"
          tick={{ ...eixo, fontSize: 10.5, fontFamily: "var(--fonte-ui)" }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        {comparar && (
          <Radar
            name={rotuloB}
            dataKey="b"
            stroke="var(--muted-foreground)"
            fill="var(--muted-foreground)"
            fillOpacity={0.12}
            strokeWidth={1.5}
            strokeDasharray="4 3"
          />
        )}
        <Radar
          name={rotuloA}
          dataKey="a"
          stroke="var(--marca-forte)"
          fill="var(--marca-forte)"
          fillOpacity={0.22}
          strokeWidth={2}
        />
        <Tooltip content={<CaixaDeDica />} />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** Barras dos cinco fatores — cada uma na sua cor fixa. */
export function BarrasPorFator({
  escores,
  altura = 200,
}: {
  escores: Record<Fator, number>;
  altura?: number;
}) {
  const dados = FATORES.map((f) => ({
    fator: f,
    nome: NOMES_DE_FATOR[f].ui,
    valor: escores[f] ?? 0,
  }));

  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -22 }}>
        <CartesianGrid stroke="var(--linha)" vertical={false} />
        <XAxis dataKey="fator" tick={eixo} axisLine={false} tickLine={false} />
        <YAxis domain={[0, 100]} tick={eixo} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ fill: "var(--superficie-2)" }}
          content={<CaixaDeDica />}
        />
        <Bar dataKey="valor" name="Escore" radius={[4, 4, 0, 0]}>
          {dados.map((d) => (
            <Cell key={d.fator} fill={COR_DO_FATOR[d.fator as Fator]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Linha temporal de respostas concluídas. */
export function VolumeNoTempo({
  dados,
  altura = 200,
}: {
  dados: Array<{ semana: string; total: number }>;
  altura?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <AreaChart data={dados} margin={{ top: 8, right: 8, bottom: 0, left: -26 }}>
        <defs>
          <linearGradient id="gradienteLatao" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--marca-forte)" stopOpacity={0.32} />
            <stop offset="100%" stopColor="var(--marca-forte)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--linha)" vertical={false} />
        <XAxis dataKey="semana" tick={eixo} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={eixo} axisLine={false} tickLine={false} />
        <Tooltip content={<CaixaDeDica />} />
        <Area
          type="monotone"
          dataKey="total"
          name="Respostas"
          stroke="var(--marca-forte)"
          strokeWidth={2}
          fill="url(#gradienteLatao)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Distribuição de arquétipos.
 *
 * Barras horizontais, não pizza: comparar comprimento é mais preciso que
 * comparar ângulo, e aqui a pergunta é "qual predomina", que é comparação.
 */
export function DistribuicaoDeArquetipos({
  dados,
  altura = 200,
}: {
  dados: Array<{ nome: string; total: number }>;
  altura?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart
        data={dados}
        layout="vertical"
        margin={{ top: 4, right: 16, bottom: 4, left: 4 }}
      >
        <CartesianGrid stroke="var(--linha)" horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={eixo} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="nome"
          width={104}
          tick={{ ...eixo, fontFamily: "var(--fonte-ui)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--superficie-2)" }}
          content={<CaixaDeDica />}
        />
        <Bar
          dataKey="total"
          name="Candidatos"
          fill="var(--dentro)"
          radius={[0, 4, 4, 0]}
          barSize={16}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
