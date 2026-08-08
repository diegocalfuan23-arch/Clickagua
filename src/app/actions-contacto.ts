"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { consultas } from "@/lib/db/schema";

export type ResultadoConsulta = { ok: true } | { ok: false; error: string };

const consultaSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre.").max(120),
  apr: z.string().trim().min(2, "Indica el nombre de tu comité.").max(160),
  contacto: z
    .string()
    .trim()
    .min(5, "Deja un correo o teléfono para responderte.")
    .max(160),
  mensaje: z.string().trim().max(2000).optional(),
  /** Campo trampa: los humanos no lo ven, los bots sí lo llenan. */
  sitioWeb: z.string().max(0).optional(),
});

/**
 * Límite por proceso: un mismo servidor no acepta una avalancha de consultas.
 * En memoria, así que se pierde al reiniciar y no es exacto con varias
 * instancias — suficiente contra el spam casual, que es lo que hay hoy.
 */
const VENTANA_MS = 60_000;
const MAX_POR_VENTANA = 5;
const envios: number[] = [];

function demasiadasSeguidas(): boolean {
  const ahora = Date.now();
  while (envios.length > 0 && ahora - envios[0] > VENTANA_MS) envios.shift();
  if (envios.length >= MAX_POR_VENTANA) return true;
  envios.push(ahora);
  return false;
}

export async function enviarConsulta(
  _prev: ResultadoConsulta | null,
  formData: FormData
): Promise<ResultadoConsulta> {
  const parsed = consultaSchema.safeParse({
    nombre: formData.get("nombre"),
    apr: formData.get("apr"),
    contacto: formData.get("contacto"),
    mensaje: formData.get("mensaje") || undefined,
    sitioWeb: formData.get("sitioWeb") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  // El bot llenó la trampa: respondemos ok para no darle pistas, sin guardar.
  if (parsed.data.sitioWeb) return { ok: true };

  if (demasiadasSeguidas()) {
    return {
      ok: false,
      error: "Demasiadas consultas seguidas. Intenta en unos minutos.",
    };
  }

  try {
    await db.insert(consultas).values({
      nombre: parsed.data.nombre,
      apr: parsed.data.apr,
      contacto: parsed.data.contacto,
      mensaje: parsed.data.mensaje ?? null,
    });
  } catch {
    return {
      ok: false,
      error:
        "No pudimos registrar tu consulta. Escríbenos directamente a hola@facilagua.com.",
    };
  }

  return { ok: true };
}
