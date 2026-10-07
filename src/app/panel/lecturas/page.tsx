import type { Metadata } from "next";
import { and, asc, desc, eq } from "drizzle-orm";
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

    // Última lectura aprobada de cada socio: la misma que usa el servidor
    // al aprobar para calcular el consumo (la más reciente por fecha de carga).
    const anteriores = await db
      .selectDistinctOn([lecturas.socioId], {
        socioId: lecturas.socioId,
        valor: lecturas.valor,
        periodo: lecturas.periodo,
      })
      .from(lecturas)
      .innerJoin(socios, eq(lecturas.socioId, socios.id))
      .where(and(eq(socios.aprId, apr.id), eq(lecturas.estado, "APROBADA")))
      .orderBy(lecturas.socioId, desc(lecturas.createdAt));
    const anteriorPorSocio = new Map(anteriores.map((a) => [a.socioId, a]));

    return (
      <LecturaForm
        socios={listaSocios.map((s) => {
          const a = anteriorPorSocio.get(s.id);
          return {
            id: s.id,
            nombre: s.nombre,
            rut: formatearRut(s.rut),
            anterior: a ? { valor: a.valor, periodo: a.periodo } : null,
          };
        })}
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
