"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  aprs,
  avisos,
  boletas,
  conversaciones,
  lecturas,
  mensajes,
  socios,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/apr-session";

/**
 * Derechos de la Ley 21.719 que la política de privacidad promete:
 * portabilidad (exportar todo en un formato reutilizable) y supresión
 * (cerrar la cuenta y borrar los datos).
 *
 * El plazo de borrado vive en @/lib/retencion: un módulo "use server" solo
 * puede exportar funciones asíncronas.
 */

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

export type ResultadoExportar =
  | { ok: true; contenido: string; nombreArchivo: string }
  | { ok: false; error: string };

/**
 * Exporta todos los datos del comité en un solo JSON. La ley pide un formato
 * estructurado y reutilizable; JSON cumple y conserva las relaciones, cosa
 * que un CSV suelto por tabla perdería.
 */
export async function exportarDatos(): Promise<ResultadoExportar> {
  const { apr } = await requireAdmin();

  try {
    const listaSocios = await db.query.socios.findMany({
      where: eq(socios.aprId, apr.id),
    });
    const idsSocios = listaSocios.map((s) => s.id);

    // inArray con lista vacía genera SQL inválido: un comité recién creado
    // no tiene socios todavía.
    const [listaBoletas, listaLecturas, listaConversaciones, listaAvisos] =
      await Promise.all([
        idsSocios.length
          ? db.query.boletas.findMany({
              where: inArray(boletas.socioId, idsSocios),
            })
          : Promise.resolve([]),
        idsSocios.length
          ? db.query.lecturas.findMany({
              where: inArray(lecturas.socioId, idsSocios),
            })
          : Promise.resolve([]),
        idsSocios.length
          ? db.query.conversaciones.findMany({
              where: inArray(conversaciones.socioId, idsSocios),
            })
          : Promise.resolve([]),
        db.query.avisos.findMany({ where: eq(avisos.aprId, apr.id) }),
      ]);

    const idsConversaciones = listaConversaciones.map((c) => c.id);
    const listaMensajes = idsConversaciones.length
      ? await db.query.mensajes.findMany({
          where: inArray(mensajes.conversacionId, idsConversaciones),
        })
      : [];

    const contenido = JSON.stringify(
      {
        exportadoEn: new Date().toISOString(),
        comite: apr,
        socios: listaSocios,
        boletas: listaBoletas,
        lecturas: listaLecturas,
        avisos: listaAvisos,
        conversaciones: listaConversaciones,
        mensajes: listaMensajes,
      },
      null,
      2
    );

    const fecha = new Date().toISOString().slice(0, 10);
    return {
      ok: true,
      contenido,
      nombreArchivo: `facilagua-${apr.slug ?? apr.id}-${fecha}.json`,
    };
  } catch {
    return {
      ok: false,
      error: "No pudimos preparar la exportación. Inténtalo de nuevo.",
    };
  }
}

/**
 * Marca la cuenta para cierre. No borra nada todavía: deja constancia de la
 * fecha para que el borrado ocurra a los 90 días, como dice la política, y
 * para que el comité pueda arrepentirse dentro de ese plazo.
 */
export async function solicitarCierre(
  confirmacion: string
): Promise<ResultadoAccion> {
  const { apr } = await requireAdmin();

  // Escribir el nombre del comité evita el clic accidental en algo que
  // termina borrando el padrón completo.
  if (confirmacion.trim().toLowerCase() !== apr.nombre.trim().toLowerCase()) {
    return {
      ok: false,
      error: "Escribe el nombre exacto de tu comité para confirmar.",
    };
  }

  if (apr.cierreSolicitadoEn) {
    return { ok: false, error: "El cierre ya estaba solicitado." };
  }

  await db
    .update(aprs)
    .set({ cierreSolicitadoEn: new Date(), updatedAt: new Date() })
    .where(eq(aprs.id, apr.id));

  revalidatePath("/panel/configuracion");
  return { ok: true };
}

/** Deshace la solicitud de cierre dentro del plazo de gracia. */
export async function cancelarCierre(): Promise<ResultadoAccion> {
  const { apr } = await requireAdmin();

  if (!apr.cierreSolicitadoEn) {
    return { ok: false, error: "Esta cuenta no tiene un cierre pendiente." };
  }

  await db
    .update(aprs)
    .set({ cierreSolicitadoEn: null, updatedAt: new Date() })
    .where(eq(aprs.id, apr.id));

  revalidatePath("/panel/configuracion");
  return { ok: true };
}

/**
 * Borra las conversaciones de WhatsApp sin tocar el resto. La política dice
 * que el comité puede pedir esto en cualquier momento, por separado del
 * cierre de cuenta.
 */
export async function borrarConversaciones(): Promise<ResultadoAccion> {
  const { apr } = await requireAdmin();

  try {
    const idsSocios = (
      await db.query.socios.findMany({
        where: eq(socios.aprId, apr.id),
        columns: { id: true },
      })
    ).map((s) => s.id);

    if (idsSocios.length === 0) return { ok: true };

    const idsConversaciones = (
      await db.query.conversaciones.findMany({
        where: inArray(conversaciones.socioId, idsSocios),
        columns: { id: true },
      })
    ).map((c) => c.id);

    if (idsConversaciones.length > 0) {
      // Los mensajes primero: tienen llave foránea hacia la conversación.
      await db
        .delete(mensajes)
        .where(inArray(mensajes.conversacionId, idsConversaciones));
      await db
        .delete(conversaciones)
        .where(inArray(conversaciones.id, idsConversaciones));
    }

    revalidatePath("/panel/configuracion");
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "No pudimos borrar las conversaciones. Inténtalo de nuevo.",
    };
  }
}

/** Cuántos datos hay, para mostrarlos antes de una acción irreversible. */
export async function resumenDatos() {
  const { apr } = await requireAdmin();

  const idsSocios = (
    await db.query.socios.findMany({
      where: eq(socios.aprId, apr.id),
      columns: { id: true },
    })
  ).map((s) => s.id);

  const [totalBoletas, totalConversaciones] = await Promise.all([
    idsSocios.length
      ? db.$count(boletas, inArray(boletas.socioId, idsSocios))
      : Promise.resolve(0),
    idsSocios.length
      ? db.$count(conversaciones, inArray(conversaciones.socioId, idsSocios))
      : Promise.resolve(0),
  ]);

  return {
    socios: idsSocios.length,
    boletas: totalBoletas,
    conversaciones: totalConversaciones,
    cierreSolicitadoEn: apr.cierreSolicitadoEn,
  };
}
