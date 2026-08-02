import type { Metadata } from "next";
import { asc, desc, eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { lecturas, socios } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";
import { formatearRut } from "@/lib/formato";
import { LecturaForm } from "@/components/panel/lectura-form";
import { LecturasCola } from "@/components/panel/lecturas-cola";

export const metadata: Metadata = {
  title: "Lecturas",
};

export default async function LecturasPage() {
  const { user, apr } = await requireApr();

  const listaSocios = await db.query.socios.findMany({
    where: eq(socios.aprId, apr.id),
    orderBy: [asc(socios.nombre)],
    columns: { id: true, nombre: true, rut: true },
  });

  if (user.rol === "OPERADOR") {
    const propias = await db.query.lecturas.findMany({
      where: eq(lecturas.registradaPorId, user.id),
      orderBy: [desc(lecturas.createdAt)],
      limit: 20,
      with: { socio: { columns: { nombre: true } } },
    });

    return (
      <LecturaForm
        socios={listaSocios.map((s) => ({
          id: s.id,
          nombre: s.nombre,
          rut: formatearRut(s.rut),
        }))}
        recientes={propias.map((l) => ({
          id: l.id,
          socio: l.socio.nombre,
          periodo: l.periodo,
          valor: l.valor,
          estado: l.estado,
          motivoRechazo: l.motivoRechazo,
        }))}
      />
    );
  }

  const pendientes = await db
    .select({
      id: lecturas.id,
      periodo: lecturas.periodo,
      valor: lecturas.valor,
      observacion: lecturas.observacion,
      createdAt: lecturas.createdAt,
      socioNombre: socios.nombre,
      socioRut: socios.rut,
    })
    .from(lecturas)
    .innerJoin(socios, eq(lecturas.socioId, socios.id))
    .where(and(eq(lecturas.estado, "PENDIENTE"), eq(socios.aprId, apr.id)))
    .orderBy(asc(lecturas.createdAt));

  return (
    <LecturasCola
      pendientes={pendientes.map((l) => ({
        id: l.id,
        socio: l.socioNombre,
        rut: formatearRut(l.socioRut),
        periodo: l.periodo,
        valor: l.valor,
        observacion: l.observacion,
        createdAt: l.createdAt,
      }))}
    />
  );
}
