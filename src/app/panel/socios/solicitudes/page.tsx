import type { Metadata } from "next";
import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { socios, solicitudesAcceso } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/apr-session";
import { SolicitudesTabla } from "@/components/panel/solicitudes-tabla";

export const metadata: Metadata = {
  title: "Solicitudes de acceso",
};

export default async function SolicitudesPage() {
  const { apr } = await requireAdmin();

  // Todas, no solo las pendientes: las pendientes primero, y el resto queda
  // como historial de lo que se aprobó o rechazó (y se puede limpiar).
  const solicitudes = await db
    .select({
      id: solicitudesAcceso.id,
      nombre: socios.nombre,
      rut: socios.rut,
      estado: solicitudesAcceso.estado,
      motivoRechazo: solicitudesAcceso.motivoRechazo,
      createdAt: solicitudesAcceso.createdAt,
    })
    .from(solicitudesAcceso)
    .innerJoin(socios, eq(solicitudesAcceso.socioId, socios.id))
    .where(eq(socios.aprId, apr.id))
    .orderBy(
      asc(sql`case when ${solicitudesAcceso.estado} = 'PENDIENTE' then 0 else 1 end`),
      desc(solicitudesAcceso.createdAt)
    );

  return <SolicitudesTabla solicitudes={solicitudes} />;
}
