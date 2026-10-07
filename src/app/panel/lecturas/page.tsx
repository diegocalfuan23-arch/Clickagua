import type { Metadata } from "next";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lecturas, socios } from "@/lib/db/schema";
import { user as userTable } from "@/lib/db/auth-schema";
import { requireApr } from "@/lib/apr-session";
import { formatearRut } from "@/lib/formato";
import { LecturaForm } from "@/components/panel/lectura-form";
import { LecturasTabla } from "@/components/panel/lecturas-tabla";

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

  // Todas las lecturas del comité, no solo las pendientes: la directiva
  // necesita ver también lo ya resuelto. Tope alto por si el padrón es grande.
  const todas = await db
    .select({
      id: lecturas.id,
      periodo: lecturas.periodo,
      valor: lecturas.valor,
      observacion: lecturas.observacion,
      estado: lecturas.estado,
      motivoRechazo: lecturas.motivoRechazo,
      createdAt: lecturas.createdAt,
      socioNombre: socios.nombre,
      socioRut: socios.rut,
      registradaPor: userTable.name,
    })
    .from(lecturas)
    .innerJoin(socios, eq(lecturas.socioId, socios.id))
    .leftJoin(userTable, eq(lecturas.registradaPorId, userTable.id))
    .where(eq(socios.aprId, apr.id))
    .orderBy(desc(lecturas.createdAt))
    .limit(1500);

  return (
    <LecturasTabla
      socios={listaSocios.map((s) => ({
        id: s.id,
        nombre: s.nombre,
        rut: formatearRut(s.rut),
      }))}
      lecturas={todas.map((l) => ({
        id: l.id,
        socio: l.socioNombre,
        rut: formatearRut(l.socioRut),
        periodo: l.periodo,
        valor: l.valor,
        observacion: l.observacion,
        estado: l.estado,
        motivoRechazo: l.motivoRechazo,
        registradaPor: l.registradaPor,
        createdAt: l.createdAt,
      }))}
    />
  );
}
