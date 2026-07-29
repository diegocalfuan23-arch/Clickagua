"use client";

/**
 * Gráficos del panel, sobre Recharts a través del wrapper de shadcn.
 * Se hicieron a mano en SVG primero, pero quedaban sin tooltips ni ejes con
 * escala automática: llegar a eso a mano era reescribir la librería.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

/** Montos abreviados para los ejes: $1.2M, $45k. */
const clpCorto = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(1)}M`
    : v >= 1000
      ? `$${Math.round(v / 1000)}k`
      : `$${v}`;

export type PuntoSerie = { periodo: string; valor: number };

/**
 * Sparkline de área para las tarjetas de tendencia. Sin ejes ni grilla:
 * importa la forma de la curva, no los valores exactos.
 */
export function SparklineArea({
  datos,
  nombre,
  color,
  id,
}: {
  datos: PuntoSerie[];
  nombre: string;
  /** Color del tema, por ejemplo "var(--forest)". */
  color: string;
  /** Identifica el degradado: dos sparklines en la misma página chocarían. */
  id: string;
}) {
  const config = { valor: { label: nombre, color } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-12 w-full">
      <AreaChart data={datos} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Area
          dataKey="valor"
          type="monotone"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${id})`}
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

/** Barras apiladas: una columna por período, una capa por estado. */
export function GraficoBarrasApiladas({
  datos,
  series,
}: {
  datos: Record<string, string | number>[];
  series: { clave: string; nombre: string; color: string }[];
}) {
  const config = Object.fromEntries(
    series.map((s) => [s.clave, { label: s.nombre, color: s.color }])
  ) satisfies ChartConfig;

  const hayDatos = datos.some((d) =>
    series.some((s) => Number(d[s.clave] ?? 0) > 0)
  );

  return (
    <div>
      <ChartContainer config={config} className="h-50 w-full">
        <BarChart data={datos} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="periodo"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            allowDecimals={false}
            width={40}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {series.map((s, i) => (
            <Bar
              key={s.clave}
              dataKey={s.clave}
              stackId="estado"
              fill={s.color}
              // Solo la capa superior lleva esquinas redondeadas.
              radius={i === series.length - 1 ? [4, 4, 0, 0] : 0}
            />
          ))}
        </BarChart>
      </ChartContainer>

      {!hayDatos && (
        <p className="mt-2 text-center text-[0.83rem] text-muted-foreground">
          Sin boletas emitidas todavía
        </p>
      )}
    </div>
  );
}

/** Barras simples, para el consumo por período. */
export function GraficoBarras({
  datos,
  nombre,
  color,
  formato = "numero",
}: {
  datos: PuntoSerie[];
  nombre: string;
  color: string;
  formato?: "numero" | "clp";
}) {
  const config = { valor: { label: nombre, color } } satisfies ChartConfig;
  const hayDatos = datos.some((d) => d.valor > 0);

  return (
    <div>
      <ChartContainer config={config} className="h-32 w-full">
        <BarChart data={datos} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="periodo"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            fontSize={12}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            fontSize={12}
            allowDecimals={false}
            width={40}
            tickFormatter={formato === "clp" ? clpCorto : undefined}
          />
          <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
          <Bar dataKey="valor" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartContainer>

      {!hayDatos && (
        <p className="mt-2 text-center text-[0.83rem] text-muted-foreground">
          Sin datos todavía
        </p>
      )}
    </div>
  );
}

/** Área a ancho completo, para series largas. */
export function GraficoArea({
  datos,
  nombre,
  color,
  formato = "numero",
}: {
  datos: PuntoSerie[];
  nombre: string;
  color: string;
  formato?: "numero" | "clp";
}) {
  const config = { valor: { label: nombre, color } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="h-56 w-full">
      <AreaChart data={datos} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id="areaGrande" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="periodo"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          width={52}
          tickFormatter={formato === "clp" ? clpCorto : undefined}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="valor"
          type="monotone"
          stroke={color}
          strokeWidth={2}
          fill="url(#areaGrande)"
          dot={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}
