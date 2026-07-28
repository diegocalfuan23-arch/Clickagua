import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  ChevronDown,
  Info,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { db } from "@/lib/db";
import { socios, boletas } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";
import { GraficoArea } from "@/components/panel/graficos";
import { iniciales } from "@/lib/formato";

export const metadata: Metadata = {
  title: "Resumen",
};

/**
 * Con el comité recién creado todo va en cero, y un panel de ceros con
 * gráficos planos se ve roto. Mostramos una muestra —claramente rotulada
 * como tal— hasta que haya datos propios.
 */
const MUESTRA = {
  socios: 248,
  activos: 236,
  inactivos: 12,
  pendientes: 37,
  montoPendiente: 312_450,
  cobrado: 1_847_200,
  consultas: 412,
  atendidasSolo: 0.94,
  consultasPorMes: [95, 130, 118, 176, 210, 265, 310, 412],
  meses: ["Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"],
  recientes: [
    { nombre: "María Huenchuñir", texto: "cuánto debo", hace: "hace 5 min" },
    { nombre: "Pedro Curihual", texto: "ya pagué la de junio?", hace: "hace 22 min" },
    { nombre: "Rosa Millán", texto: "cuándo vence mi boleta", hace: "hace 1 h" },
    { nombre: "Luis Painemal", texto: "cuánto debo", hace: "hace 3 h" },
  ],
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

type Segmento = {
  label: string;
  valor: string;
  /** Proporción sobre el total, para el ancho de la barra. */
  peso: number;
  color: string;
  variacion?: string;
  sube?: boolean;
};

function Tarjeta({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Barra segmentada: una franja por segmento, proporcional a su peso. */
function BarraProporcion({ segmentos }: { segmentos: Segmento[] }) {
  const total = segmentos.reduce((suma, s) => suma + s.peso, 0) || 1;

  return (
    <div className="flex gap-1.5">
      {segmentos.map((s) => (
        <span
          key={s.label}
          className={`h-2 rounded-full ${s.color}`}
          style={{ width: `${(s.peso / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

/** Lista de segmentos: cuadrito de color, etiqueta, valor y variación. */
function ListaSegmentos({ segmentos }: { segmentos: Segmento[] }) {
  return (
    <div className="flex flex-col gap-3.5">
      {segmentos.map((s) => (
        <div key={s.label} className="flex items-center gap-2.5 text-[0.9rem]">
          <span className={`size-2.5 shrink-0 rounded-[3px] ${s.color}`} />
          <span className="flex-1 truncate">{s.label}</span>
          <span className="font-medium tabular-nums">{s.valor}</span>
          {s.variacion && (
            <span
              className={`flex w-16 shrink-0 items-center justify-end gap-1 text-[0.83rem] font-medium tabular-nums ${
                s.sube ? "text-forest" : "text-destructive"
              }`}
            >
              {s.sube ? (
                <TrendingUp className="size-3.5" />
              ) : (
                <TrendingDown className="size-3.5" />
              )}
              {s.variacion}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

export default async function PanelPage() {
  const { user, apr } = await requireApr();

  const [{ total: totalSocios }] = await db
    .select({ total: count() })
    .from(socios)
    .where(eq(socios.aprId, apr.id));

  const [{ total: sociosActivos }] = await db
    .select({ total: count() })
    .from(socios)
    .where(and(eq(socios.aprId, apr.id), eq(socios.activo, true)));

  const [{ total: boletasPendientes }] = await db
    .select({ total: count() })
    .from(boletas)
    .innerJoin(socios, eq(boletas.socioId, socios.id))
    .where(and(eq(socios.aprId, apr.id), eq(boletas.estado, "PENDIENTE")));

  const ultimos = await db.query.socios.findMany({
    where: eq(socios.aprId, apr.id),
    orderBy: [desc(socios.createdAt)],
    limit: 4,
    columns: { id: true, nombre: true, createdAt: true },
  });

  const sinDatos = totalSocios === 0;
  const activos = sinDatos ? MUESTRA.activos : sociosActivos;
  const inactivos = sinDatos ? MUESTRA.inactivos : totalSocios - sociosActivos;
  const total = sinDatos ? MUESTRA.socios : totalSocios;
  const pendientes = sinDatos ? MUESTRA.pendientes : boletasPendientes;
  const cobertura = total > 0 ? Math.round((activos / total) * 100) : 0;

  const resueltas = sinDatos
    ? Math.round(MUESTRA.consultas * MUESTRA.atendidasSolo)
    : 0;
  const derivadas = sinDatos ? MUESTRA.consultas - resueltas : 0;

  const padron: Segmento[] = [
    {
      label: "Activos",
      valor: String(activos),
      peso: activos,
      color: "bg-primary",
    },
    {
      label: "Inactivos",
      valor: String(inactivos),
      peso: inactivos || 1,
      color: "bg-muted-foreground/25",
    },
  ];

  const cobranza: Segmento[] = [
    {
      label: "Cobrado",
      valor: clp.format(sinDatos ? MUESTRA.cobrado : 0),
      peso: sinDatos ? MUESTRA.cobrado : 1,
      color: "bg-primary",
      variacion: sinDatos ? "12.4%" : undefined,
      sube: true,
    },
    {
      label: "Por cobrar",
      valor: clp.format(sinDatos ? MUESTRA.montoPendiente : 0),
      peso: sinDatos ? MUESTRA.montoPendiente : 1,
      color: "bg-secondary",
      variacion: sinDatos ? "8.2%" : undefined,
      sube: false,
    },
  ];

  const atencion: Segmento[] = [
    {
      label: "Resueltas por el bot",
      valor: String(resueltas),
      peso: resueltas || 1,
      color: "bg-primary",
    },
    {
      label: "Derivadas a la oficina",
      valor: String(derivadas),
      peso: derivadas || 1,
      color: "bg-tertiary",
    },
  ];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[1.35rem] font-semibold tracking-tight">
            Hola, {user.name}
          </h1>
          <p className="mt-0.5 text-[0.9rem] text-muted-foreground">
            {apr.nombre} · {apr.comuna}
          </p>
        </div>
        <Link
          href="/panel/socios"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[0.87rem] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {sinDatos ? "Cargar socios" : "Ver socios"}
          <ArrowUpRight className="size-3.5" />
        </Link>
      </div>

      {sinDatos && (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary/5 px-4 py-3">
          <Info className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-[0.88rem] leading-relaxed text-muted-foreground">
            <strong className="text-foreground">
              Estás viendo datos de ejemplo.
            </strong>{" "}
            Se reemplazan por los de tu comité en cuanto cargues a tus socios.
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Padrón: cifra dominante en color, como el "85%" de la referencia. */}
        <Tarjeta className="flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-[1.05rem] font-semibold">Padrón</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-[0.78rem] font-medium">
              <BadgeCheck className="size-3.5 text-forest" />
              {cobertura}% al día
            </span>
          </div>

          <div className="mt-3 text-[3rem] leading-none font-bold tracking-tight text-primary">
            {total}
          </div>

          <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">
            Socios registrados en {apr.nombre}. El bot solo responde a quienes
            estén en este padrón.
          </p>

          <div className="mt-auto pt-5">
            <BarraProporcion segmentos={padron} />
            <div className="mt-4">
              <ListaSegmentos segmentos={padron} />
            </div>
          </div>
        </Tarjeta>

        {/* Cobranza: barra + desglose, el patrón de "Referral Traffic". */}
        <Tarjeta className="flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-[1.05rem] font-semibold">Cobranza</h2>
            <span className="text-[0.8rem] text-muted-foreground">
              Período actual
            </span>
          </div>

          <div className="mt-5">
            <BarraProporcion segmentos={cobranza} />
          </div>

          <div className="mt-5">
            <ListaSegmentos segmentos={cobranza} />
          </div>

          <div className="mt-auto border-t border-border/60 pt-4 text-center">
            <Link
              href="/panel/socios"
              className="text-[0.9rem] font-medium text-primary hover:underline"
            >
              {pendientes} boletas pendientes
            </Link>
          </div>
        </Tarjeta>

        {/* Atención: cifra con símbolo, desglose y minigráfico, como "Total sales". */}
        <Tarjeta className="flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-[1.05rem] font-semibold">Atención</h2>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-[0.8rem] font-medium">
              <CalendarDays className="size-3.5 text-muted-foreground" />
              Este mes
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </span>
          </div>

          <div className="mt-3 text-[2.6rem] leading-none font-bold tracking-tight tabular-nums">
            {sinDatos ? MUESTRA.consultas : 0}
            <span className="ml-2 text-[0.9rem] font-normal text-muted-foreground">
              consultas
            </span>
          </div>

          <div className="mt-5">
            <ListaSegmentos segmentos={atencion} />
          </div>

          <div className="mt-auto pt-5">
            <BarraProporcion segmentos={atencion} />
          </div>
        </Tarjeta>
      </div>

      <Tarjeta className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[1.05rem] font-semibold">Consultas por mes</h2>
            <p className="mt-0.5 text-[0.85rem] text-muted-foreground">
              Cuántas veces el bot respondió sin que nadie del comité
              interviniera
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2.5 py-1.5 text-[0.8rem] font-medium">
            <CalendarDays className="size-3.5 text-muted-foreground" />
            Últimos 8 meses
            <ChevronDown className="size-3.5 text-muted-foreground" />
          </span>
        </div>

        <div className="mt-6">
          <GraficoArea
            valores={MUESTRA.consultasPorMes}
            etiquetas={MUESTRA.meses}
          />
        </div>
      </Tarjeta>

      <Tarjeta className="p-6">
        <h2 className="text-[1.05rem] font-semibold">
          {sinDatos
            ? "Así se ven las consultas de tus socios"
            : "Últimos socios cargados"}
        </h2>
        <p className="mt-0.5 text-[0.85rem] text-muted-foreground">
          {sinDatos
            ? "Cada mensaje que el bot responde queda registrado aquí."
            : "Los más recientes en tu comité."}
        </p>

        <div className="mt-5 flex flex-col divide-y divide-border/60">
          {sinDatos
            ? MUESTRA.recientes.map((item) => (
                <div
                  key={item.nombre}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[0.75rem] font-semibold text-muted-foreground">
                    {iniciales(item.nombre)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[0.9rem] font-medium">
                      {item.nombre}
                    </div>
                    <div className="truncate text-[0.83rem] text-muted-foreground">
                      «{item.texto}»
                    </div>
                  </div>
                  <span className="shrink-0 text-[0.78rem] text-muted-foreground">
                    {item.hace}
                  </span>
                </div>
              ))
            : ultimos.map((socio) => (
                <div
                  key={socio.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[0.75rem] font-semibold text-muted-foreground">
                    {iniciales(socio.nombre)}
                  </span>
                  <div className="min-w-0 flex-1 truncate text-[0.9rem] font-medium">
                    {socio.nombre}
                  </div>
                  <span className="shrink-0 text-[0.78rem] text-muted-foreground">
                    {socio.createdAt.toLocaleDateString("es-CL")}
                  </span>
                </div>
              ))}
        </div>
      </Tarjeta>
    </>
  );
}
