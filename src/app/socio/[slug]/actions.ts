"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { aprs } from "@/lib/db/schema";
import {
  solicitarAccesoSocio,
  correoSocioDesdeRut,
  type ResultadoSolicitud,
} from "@/lib/socios-acceso";

const solicitudSchema = z.object({
  rut: z.string().trim().min(3, "Ingresa tu RUT."),
  clave: z.string().min(8, "La clave debe tener al menos 8 caracteres."),
});

/** El slug viene de la URL, nunca del formulario: no hay que confiar en el cliente para saber a qué comité pertenece. */
export async function solicitarAcceso(
  slug: string,
  _prev: ResultadoSolicitud | null,
  formData: FormData
): Promise<ResultadoSolicitud> {
  const apr = await db.query.aprs.findFirst({
    where: eq(aprs.slug, slug),
    columns: { id: true },
  });
  if (!apr) return { ok: false, error: "Comité no encontrado." };

  const parsed = solicitudSchema.safeParse({
    rut: formData.get("rut"),
    clave: formData.get("clave"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  return solicitarAccesoSocio({
    aprId: apr.id,
    rut: parsed.data.rut,
    clave: parsed.data.clave,
  });
}

/**
 * Traduce RUT + slug al correo sintético que necesita signIn.email() en el
 * cliente. No hace login por sí misma —Better Auth necesita correr en el
 * cliente para dejar la cookie de sesión— solo resuelve el dato.
 */
export async function correoParaLogin(
  slug: string,
  rut: string
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const apr = await db.query.aprs.findFirst({
    where: eq(aprs.slug, slug),
    columns: { id: true },
  });
  if (!apr) return { ok: false, error: "Comité no encontrado." };

  return { ok: true, email: correoSocioDesdeRut(rut, apr.id) };
}
