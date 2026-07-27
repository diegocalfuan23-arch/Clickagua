import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";
import { SociosTabla } from "@/components/panel/socios-tabla";

export const metadata: Metadata = {
  title: "Socios",
};

export default async function SociosPage() {
  const { apr } = await requireApr();

  const listado = await db.query.socios.findMany({
    where: eq(socios.aprId, apr.id),
    orderBy: [asc(socios.nombre)],
    columns: {
      id: true,
      nombre: true,
      rut: true,
      telefono: true,
      direccion: true,
      numeroCliente: true,
      activo: true,
    },
  });

  return <SociosTabla socios={listado} />;
}
