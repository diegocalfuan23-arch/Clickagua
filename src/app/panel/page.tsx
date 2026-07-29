import type { Metadata } from "next";
import Link from "next/link";
import { and, countDistinct, eq, sql } from "drizzle-orm";
import { AlertTriangle, ReceiptText, Users, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { boletas, socios } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";

export const metadata: Metadata = {
  title: "Resumen",
};

const clp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

function Kpi({
  icono,
  fondo,
  texto,
  etiqueta,
  valor,
  detalle,
  href,
}: {
  icono: React.ReactNode;
  /** Tinte del recuadro del ícono. */
  fondo: string;
  /** Color de la cifra: es lo que identifica al indicador de un vistazo. */
  texto: string;
  etiqueta: string;
  valor: string;
  detalle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-primary/40"
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex size-9 items-center justify-center rounded-lg [&_svg]:size-4.5 ${fondo} ${texto}`}
        >
          {icono}
        </span>
        <span className="text-[0.9rem] text-muted-foreground">{etiqueta}</span>
      </div>

      <div
        className={`mt-4 text-[1.9rem] leading-none font-semibold tabular-nums ${texto}`}
      >
        {valor}
      </div>
      <p className="mt-1.5 text-[0.83rem] text-muted-foreground">{detalle}</p>
    </Link>
  );
}

export default async function PanelPage() {
  const { apr } = await requireApr();

  const [padron] = await db
    .select({
      total: sql<number>`count(*)::int`,
      activos: sql<number>`count(*) filter (where ${socios.activo})::int`,
    })
    .from(socios)
    .where(eq(socios.aprId, apr.id));

  // Un moroso es un socio con al menos una boleta impaga cuyo vencimiento ya
  // pasó. Se cuenta el socio, no la boleta: quien debe tres meses es un
  // moroso, no tres.
  //
  // No basta con estado = 'VENCIDA': ese valor se fija al guardar la boleta y
  // nadie lo recalcula después, así que una PENDIENTE que venció ayer seguiría
  // marcada como pendiente. La fecha es la fuente de verdad.
  const [morosidad] = await db
    .select({
      socios: countDistinct(boletas.socioId),
      monto: sql<number>`coalesce(sum(${boletas.montoTotal} - ${boletas.montoPagado}), 0)::int`,
    })
    .from(boletas)
    .innerJoin(socios, eq(boletas.socioId, socios.id))
    .where(
      and(
        eq(socios.aprId, apr.id),
        sql`${boletas.estado} <> 'ANULADA'`,
        sql`${boletas.montoPagado} < ${boletas.montoTotal}`,
        sql`${boletas.fechaVencimiento} < now()`
      )
    );

  // Lo recaudado y lo emitido excluyen las anuladas: una boleta sin efecto
  // no debe inflar ninguna de las dos cifras.
  const [facturacion] = await db
    .select({
      emitidas: sql<number>`count(*)::int`,
      recaudado: sql<number>`coalesce(sum(${boletas.montoPagado}), 0)::int`,
      facturado: sql<number>`coalesce(sum(${boletas.montoTotal}), 0)::int`,
    })
    .from(boletas)
    .innerJoin(socios, eq(boletas.socioId, socios.id))
    .where(
      and(eq(socios.aprId, apr.id), sql`${boletas.estado} <> 'ANULADA'`)
    );

  const cobertura =
    facturacion.facturado > 0
      ? Math.round((facturacion.recaudado / facturacion.facturado) * 100)
      : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        icono={<Users />}
        fondo="bg-primary/10"
        texto="text-primary"
        etiqueta="Socios"
        valor={String(padron.total)}
        detalle={
          padron.total === 0
            ? "Aún no cargas el padrón"
            : `${padron.activos} ${padron.activos === 1 ? "activo" : "activos"}`
        }
        href="/panel/socios"
      />

      <Kpi
        icono={<AlertTriangle />}
        fondo="bg-destructive/10"
        texto="text-destructive"
        etiqueta="Morosos"
        valor={String(morosidad.socios)}
        detalle={
          morosidad.socios === 0
            ? "Sin boletas vencidas"
            : `${clp.format(morosidad.monto)} por cobrar`
        }
        href="/panel/boletas"
      />

      <Kpi
        icono={<Wallet />}
        fondo="bg-forest/10"
        texto="text-forest"
        etiqueta="Recaudado"
        valor={clp.format(facturacion.recaudado)}
        detalle={
          facturacion.facturado === 0
            ? "Aún no emites boletas"
            : `${cobertura}% de lo facturado`
        }
        href="/panel/boletas"
      />

      <Kpi
        icono={<ReceiptText />}
        fondo="bg-tertiary/15"
        texto="text-tertiary-texto"
        etiqueta="Facturas emitidas"
        valor={String(facturacion.emitidas)}
        detalle={
          facturacion.emitidas === 0
            ? "Sin boletas emitidas"
            : `${clp.format(facturacion.facturado)} facturados`
        }
        href="/panel/boletas"
      />
    </div>
  );
}
