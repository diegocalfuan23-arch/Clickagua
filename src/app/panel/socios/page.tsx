import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/apr-session";
import { SociosTabla } from "@/components/panel/socios-tabla";

export const metadata: Metadata = {
  title: "Socios",
};

export default async function SociosPage() {
  const { apr } = await requireAdmin();

  const listado = await db.query.socios.findMany({
    where: eq(socios.aprId, apr.id),
    orderBy: [asc(socios.nombre)],
    columns: {
      id: true,
      nombre: true,
      rut: true,
      tipo: true,
      telefono: true,
      direccion: true,
      numeroCliente: true,
      activo: true,
      userId: true,
    },
  });

  // Quien tiene varios arranques comparte una sola cuenta (por RUT): todos sus
  // arranques cuentan como "con cuenta", aunque solo uno guarde el userId.
  const rutsConCuenta = new Set(
    listado.filter((s) => s.userId && s.rut).map((s) => s.rut as string)
  );

  const filas = listado.map(({ userId, ...s }) => ({
    ...s,
    conCuenta: Boolean(userId) || (s.rut !== null && rutsConCuenta.has(s.rut)),
  }));

  return <SociosTabla socios={filas} />;
}
