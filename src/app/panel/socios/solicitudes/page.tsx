import type { Metadata } from "next";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { socios, solicitudesAcceso } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/apr-session";
import { SolicitudesTabla } from "@/components/panel/solicitudes-tabla";

export const metadata: Metadata = {
  title: "Solicitudes de acceso",
};

export default async function SolicitudesPage() {
  const { apr } = await requireAdmin();

  const pendientes = await db
    .select({
      id: solicitudesAcceso.id,
      nombre: socios.nombre,
      rut: socios.rut,
      createdAt: solicitudesAcceso.createdAt,
    })
    .from(solicitudesAcceso)
    .innerJoin(socios, eq(solicitudesAcceso.socioId, socios.id))
    .where(
      and(eq(socios.aprId, apr.id), eq(solicitudesAcceso.estado, "PENDIENTE"))
    )
    .orderBy(desc(solicitudesAcceso.createdAt));

  return <SolicitudesTabla solicitudes={pendientes} />;
}
