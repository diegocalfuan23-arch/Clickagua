"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable } from "@/lib/db/auth-schema";

export type ResultadoRecuperacion =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Freno básico por IP: como esta acción revela si un correo existe, sin límite
 * serviría para recorrer listas de correos. Es en memoria (por instancia), así
 * que frena el abuso casual, no un ataque distribuido.
 */
const VENTANA_MS = 60_000;
const MAXIMO = 8;
const intentos = new Map<string, number[]>();

function excedeLimite(ip: string) {
  const ahora = Date.now();
  const recientes = (intentos.get(ip) ?? []).filter((t) => ahora - t < VENTANA_MS);
  recientes.push(ahora);
  intentos.set(ip, recientes);
  return recientes.length > MAXIMO;
}

/**
 * Pide el enlace de recuperación y avisa si no hay ninguna cuenta con ese
 * correo. Decisión consciente: se prefiere decirle al usuario que se
 * equivocó de correo a dejarlo esperando un mensaje que nunca llega.
 */
export async function solicitarRecuperacion(
  correo: string
): Promise<ResultadoRecuperacion> {
  const email = correo.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { ok: false, error: "Escribe un correo válido." };
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocida";
  if (excedeLimite(ip)) {
    return {
      ok: false,
      error: "Demasiados intentos. Espera un minuto e inténtalo de nuevo.",
    };
  }

  const [existe] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  if (!existe) {
    return {
      ok: false,
      error:
        "No hay ninguna cuenta con ese correo. Revisa que esté bien escrito o que sea el correo con el que registraste el comité.",
    };
  }

  try {
    await auth.api.requestPasswordReset({
      body: { email, redirectTo: "/reset-password" },
      headers: h,
    });
  } catch {
    return {
      ok: false,
      error: "No pudimos enviar el correo. Inténtalo de nuevo en unos minutos.",
    };
  }

  return { ok: true };
}
