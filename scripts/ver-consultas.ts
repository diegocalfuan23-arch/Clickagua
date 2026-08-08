/**
 * Lista las consultas recibidas desde el formulario público.
 *
 * Provisional: existe solo hasta que el panel super admin
 * (personal/superadminapps) lea esta misma tabla. Uso:
 *   bun run scripts/ver-consultas.ts
 */
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultas } from "@/lib/db/schema";

const fecha = new Intl.DateTimeFormat("es-CL", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const filas = await db
  .select()
  .from(consultas)
  .orderBy(desc(consultas.createdAt))
  .limit(50);

if (filas.length === 0) {
  console.log("Sin consultas todavía.");
} else {
  console.log(`${filas.length} consulta(s), de la más reciente a la más antigua:\n`);
  for (const c of filas) {
    console.log(`[${c.estado}] ${fecha.format(c.createdAt)}`);
    console.log(`  ${c.nombre} — ${c.apr}`);
    console.log(`  Contacto: ${c.contacto}`);
    if (c.mensaje) console.log(`  Mensaje: ${c.mensaje}`);
    console.log("");
  }
}

process.exit(0);
