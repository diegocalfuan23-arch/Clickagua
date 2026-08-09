import { and, eq, inArray, isNotNull, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  aprs,
  avisos,
  boletas,
  conversaciones,
  invitaciones,
  lecturas,
  mensajes,
  socios,
} from "@/lib/db/schema";
import { user } from "@/lib/db/auth-schema";
import { DIAS_HASTA_BORRADO } from "@/lib/retencion";

/**
 * Elimina las cuentas cuyo cierre se solicitó hace más de 90 días, que es lo
 * que promete la política de privacidad. Sin este proceso esa promesa sería
 * falsa: los datos se quedarían para siempre.
 *
 * Pensado para ejecutarse una vez al día desde un cron. Protegido con un
 * secreto porque borra datos de forma irreversible.
 */

async function ejecutar(request: Request) {
  const secreto = process.env.CRON_SECRET;

  // Sin secreto configurado el endpoint queda apagado: es preferible que no
  // borre nada a que quede abierto a cualquiera.
  if (!secreto) {
    return Response.json(
      { error: "Mantenimiento no configurado." },
      { status: 503 }
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return Response.json({ error: "No autorizado." }, { status: 401 });
  }

  const limite = new Date(
    Date.now() - DIAS_HASTA_BORRADO * 24 * 60 * 60 * 1000
  );

  const vencidas = await db.query.aprs.findMany({
    where: and(
      isNotNull(aprs.cierreSolicitadoEn),
      lt(aprs.cierreSolicitadoEn, limite)
    ),
    columns: { id: true, nombre: true },
  });

  const borradas: string[] = [];

  for (const apr of vencidas) {
    const idsSocios = (
      await db.query.socios.findMany({
        where: eq(socios.aprId, apr.id),
        columns: { id: true },
      })
    ).map((s) => s.id);

    if (idsSocios.length > 0) {
      const idsConversaciones = (
        await db.query.conversaciones.findMany({
          where: inArray(conversaciones.socioId, idsSocios),
          columns: { id: true },
        })
      ).map((c) => c.id);

      // Orden inverso a las llaves foráneas: primero lo que apunta a otros.
      if (idsConversaciones.length > 0) {
        await db
          .delete(mensajes)
          .where(inArray(mensajes.conversacionId, idsConversaciones));
        await db
          .delete(conversaciones)
          .where(inArray(conversaciones.id, idsConversaciones));
      }

      await db.delete(lecturas).where(inArray(lecturas.socioId, idsSocios));
      await db.delete(boletas).where(inArray(boletas.socioId, idsSocios));
    }

    await db.delete(avisos).where(eq(avisos.aprId, apr.id));
    await db.delete(invitaciones).where(eq(invitaciones.aprId, apr.id));
    await db.delete(socios).where(eq(socios.aprId, apr.id));

    // Las cuentas de acceso del comité: sin ellas nadie podría entrar a un
    // APR que ya no existe, y quedarían huérfanas.
    await db.delete(user).where(eq(user.aprId, apr.id));
    await db.delete(aprs).where(eq(aprs.id, apr.id));

    borradas.push(apr.nombre);
  }

  return Response.json({
    revisadas: vencidas.length,
    borradas: borradas.length,
    nombres: borradas,
  });
}

// Vercel invoca los crons con GET; POST queda para ejecutarlo a mano.
export const GET = ejecutar;
export const POST = ejecutar;
