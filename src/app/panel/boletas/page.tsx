import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { boletas, socios } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";
import { BoletasTabla } from "@/components/panel/boletas-tabla";

export const metadata: Metadata = {
  title: "Boletas",
};

export default async function BoletasPage() {
  const { apr } = await requireApr();

  const listado = await db
    .select({
      id: boletas.id,
      socioId: boletas.socioId,
      socioNombre: socios.nombre,
      socioRut: socios.rut,
      periodo: boletas.periodo,
      montoTotal: boletas.montoTotal,
      montoPagado: boletas.montoPagado,
      estado: boletas.estado,
      fechaEmision: boletas.fechaEmision,
      fechaVencimiento: boletas.fechaVencimiento,
      lecturaAnterior: boletas.lecturaAnterior,
      lecturaActual: boletas.lecturaActual,
      consumoM3: boletas.consumoM3,
      observacion: boletas.observacion,
    })
    .from(boletas)
    .innerJoin(socios, eq(boletas.socioId, socios.id))
    .where(eq(socios.aprId, apr.id))
    .orderBy(desc(boletas.periodo), asc(socios.nombre));

  const padron = await db.query.socios.findMany({
    where: eq(socios.aprId, apr.id),
    orderBy: [asc(socios.nombre)],
    columns: { id: true, nombre: true, rut: true },
  });

  return (
    <BoletasTabla
      boletas={listado}
      socios={padron}
      tieneTarifas={
        apr.tarifaCargoFijo !== null && apr.tarifaMetroCubico !== null
      }
    />
  );
}
