import type { Metadata } from "next";
import Link from "next/link";
import { and, count, desc, eq } from "drizzle-orm";
import {
  ArrowRight,
  Info,
  MessageSquare,
  ReceiptText,
  TrendingUp,
  Users,
} from "lucide-react";
import { db } from "@/lib/db";
import { socios, boletas } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";
import { GraficoArea, Sparkline } from "@/components/panel/graficos";
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
  pendientes: 37,
  consultas: 412,
  tendenciaSocios: [180, 195, 201, 214, 222, 235, 248],
  tendenciaPendientes: [52, 48, 51, 44, 41, 39, 37],
  tendenciaConsultas: [120, 168, 195, 240, 288, 350, 412],
  consultasPorMes: [95, 130, 118, 176, 210, 265, 310, 412],
  mesesEtiquetas: ["Dic", "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul"],
  recientes: [
    { nombre: "María Huenchuñir", texto: "cuánto debo", hace: "hace 5 min" },
    { nombre: "Pedro Curihual", texto: "ya pagué la de junio?", hace: "hace 22 min" },
    { nombre: "Rosa Millán", texto: "cuándo vence mi boleta", hace: "hace 1 h" },
    { nombre: "Luis Painemal", texto: "cuánto debo", hace: "hace 3 h" },
  ],
};

export default async function PanelPage() {
  const { user, apr } = await requireApr();

  const [{ total: totalSocios }] = await db
    .select({ total: count() })
    .from(socios)
    .where(eq(socios.aprId, apr.id));

  const [{ total: boletasPendientes }] = await db
    .select({ total: count() })
    .from(boletas)
    .innerJoin(socios, eq(boletas.socioId, socios.id))
    .where(and(eq(socios.aprId, apr.id), eq(boletas.estado, "PENDIENTE")));

  const [{ total: sociosActivos }] = await db
    .select({ total: count() })
    .from(socios)
    .where(and(eq(socios.aprId, apr.id), eq(socios.activo, true)));

  const ultimos = await db.query.socios.findMany({
    where: eq(socios.aprId, apr.id),
    orderBy: [desc(socios.createdAt)],
    limit: 4,
    columns: { id: true, nombre: true, createdAt: true },
  });

  const sinDatos = totalSocios === 0;

  const metricas = [
    {
      label: "Socios registrados",
      valor: sinDatos ? MUESTRA.socios : totalSocios,
      pie: sinDatos
        ? "de muestra"
        : `${sociosActivos} ${sociosActivos === 1 ? "activo" : "activos"}`,
      icon: Users,
      tendencia: MUESTRA.tendenciaSocios,
      tono: "text-primary",
      fondo: "bg-primary/10",
      tarjeta: "from-primary/8",
    },
    {
      label: "Boletas pendientes",
      valor: sinDatos ? MUESTRA.pendientes : boletasPendientes,
      pie: sinDatos ? "de muestra" : "por cobrar",
      icon: ReceiptText,
      tendencia: MUESTRA.tendenciaPendientes,
      tono: "text-secondary",
      fondo: "bg-secondary/10",
      tarjeta: "from-secondary/8",
    },
    {
      label: "Consultas este mes",
      valor: sinDatos ? MUESTRA.consultas : 0,
      pie: sinDatos ? "de muestra" : "respondidas por el bot",
      icon: MessageSquare,
      tendencia: MUESTRA.tendenciaConsultas,
      tono: "text-tertiary-foreground",
      fondo: "bg-tertiary/25",
      tarjeta: "from-tertiary/12",
    },
  ];

  return (
    <>
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

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-primary/80 p-6 text-primary-foreground">
          <div className="pointer-events-none absolute -top-16 -right-10 size-52 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -right-4 -bottom-20 size-40 rounded-full bg-white/5" />

          <p className="relative text-[0.85rem] text-primary-foreground/80">
            {apr.nombre} · {apr.comuna}
          </p>
          <h1 className="relative mt-1 text-[1.6rem] leading-tight font-semibold">
            Hola, {user.name}
          </h1>
          <p className="relative mt-2 max-w-[42ch] text-[0.92rem] leading-relaxed text-primary-foreground/85">
            {sinDatos
              ? "Carga a tus socios y el bot podrá empezar a responderles por WhatsApp."
              : "Tu comité está al día. Revisa las boletas pendientes del período."}
          </p>

          <Link
            href="/panel/socios"
            className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-[0.88rem] font-medium backdrop-blur-sm transition-colors hover:bg-white/25"
          >
            {sinDatos ? "Cargar socios" : "Ver socios"}
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_-4px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-[1rem] font-semibold">Consultas por mes</h2>
              <p className="mt-0.5 text-[0.83rem] text-muted-foreground">
                Cuántas veces el bot respondió sin intervención
              </p>
            </div>
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[0.75rem] font-semibold text-primary">
              <TrendingUp className="size-3" />
              +32%
            </span>
          </div>

          <div className="mt-5">
            <GraficoArea
              valores={MUESTRA.consultasPorMes}
              etiquetas={MUESTRA.mesesEtiquetas}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {metricas.map(
          ({ label, valor, pie, icon: Icon, tendencia, tono, fondo, tarjeta }) => (
            <div
              key={label}
              className={`rounded-xl border border-border/50 bg-linear-to-b ${tarjeta} to-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_-4px_rgba(15,23,42,0.08)] transition-shadow hover:shadow-[0_1px_2px_rgba(15,23,42,0.05),0_8px_20px_-6px_rgba(15,23,42,0.12)]`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[0.85rem] text-muted-foreground">
                  {label}
                </span>
                <span
                  className={`flex size-8 items-center justify-center rounded-lg ${fondo}`}
                >
                  <Icon className={`size-4 ${tono}`} />
                </span>
              </div>

              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <div className="text-[1.75rem] leading-none font-semibold tabular-nums">
                    {valor}
                  </div>
                  <div className="mt-1.5 text-[0.78rem] text-muted-foreground">
                    {pie}
                  </div>
                </div>
                <Sparkline
                  valores={tendencia}
                  className={`h-8 w-24 shrink-0 ${tono} opacity-60`}
                />
              </div>
            </div>
          )
        )}
      </div>

      <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_4px_12px_-4px_rgba(15,23,42,0.08)]">
        <h2 className="text-[1rem] font-semibold">
          {sinDatos ? "Así se ven las consultas de tus socios" : "Últimos socios cargados"}
        </h2>
        <p className="mt-0.5 text-[0.83rem] text-muted-foreground">
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
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.75rem] font-semibold text-primary">
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
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[0.75rem] font-semibold text-primary">
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
      </div>
    </>
  );
}
