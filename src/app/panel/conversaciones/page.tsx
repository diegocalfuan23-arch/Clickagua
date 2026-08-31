import type { Metadata } from "next";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/apr-session";
import { ConversacionesPanel } from "@/components/panel/conversaciones-panel";

export const metadata: Metadata = {
  title: "Conversaciones",
};

export default async function ConversacionesPage() {
  const { apr } = await requireAdmin();

  const { rows: filas } = await db.execute<{
    socioId: string;
    nombre: string;
    ultimoMensaje: string;
    ultimaFecha: string;
    sinLeer: number;
  }>(sql`
    select distinct on (s.id)
      s.id as "socioId",
      s.nombre,
      m.contenido as "ultimoMensaje",
      m."createdAt" as "ultimaFecha",
      (
        select count(*)::int from "MensajeSocio" m2
        where m2."socioId" = s.id
          and m2.remitente = 'SOCIO'
          and m2."leidoPorDirectiva" = false
      ) as "sinLeer"
    from "Socio" s
    join "MensajeSocio" m on m."socioId" = s.id
    where s."aprId" = ${apr.id}
    order by s.id, m."createdAt" desc
  `);

  filas.sort((a, b) => +new Date(b.ultimaFecha) - +new Date(a.ultimaFecha));

  return (
    <ConversacionesPanel
      conversaciones={filas.map((f) => ({
        socioId: f.socioId,
        nombre: f.nombre,
        ultimoMensaje: f.ultimoMensaje,
        ultimaFecha: f.ultimaFecha ? new Date(f.ultimaFecha) : null,
        sinLeer: f.sinLeer,
      }))}
    />
  );
}
