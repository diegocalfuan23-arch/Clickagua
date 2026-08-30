import { and, eq } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { db } from "@/lib/db";
import { solicitudesAcceso, socios } from "@/lib/db/schema";
import { user as userTable, account as accountTable } from "@/lib/db/auth-schema";
import { normalizarRut } from "@/lib/formato";
import { createId } from "@paralleldrive/cuid2";

export type ResultadoSolicitud = { ok: true } | { ok: false; error: string };

/**
 * Pide acceso al panel de un socio. No crea ninguna cuenta de Better Auth
 * todavía —solo guarda el hash de la clave junto a la solicitud— porque
 * cualquiera que sepa un RUT (no es secreto) podría intentar esto: la
 * cuenta real nace recién cuando la directiva aprueba, nunca antes.
 */
export async function solicitarAccesoSocio({
  aprId,
  rut,
  clave,
}: {
  aprId: string;
  rut: string;
  clave: string;
}): Promise<ResultadoSolicitud> {
  const rutNormalizado = normalizarRut(rut);

  const socio = await db.query.socios.findFirst({
    where: and(eq(socios.aprId, aprId), eq(socios.rut, rutNormalizado)),
    columns: { id: true, userId: true },
  });

  // Mensaje genérico a propósito: no hay que confirmarle a un desconocido
  // si un RUT en particular es o no socio de este comité.
  const ERROR_GENERICO =
    "No pudimos verificar ese RUT con el padrón del comité. Si el problema persiste, contacta a tu comité.";

  if (!socio) return { ok: false, error: ERROR_GENERICO };
  if (socio.userId) {
    return {
      ok: false,
      error: "Ese RUT ya tiene una cuenta. Si olvidaste tu clave, contacta a tu comité.",
    };
  }

  const pendiente = await db.query.solicitudesAcceso.findFirst({
    where: and(
      eq(solicitudesAcceso.socioId, socio.id),
      eq(solicitudesAcceso.estado, "PENDIENTE")
    ),
    columns: { id: true },
  });
  if (pendiente) {
    return {
      ok: false,
      error: "Ya hay una solicitud pendiente para este RUT. Espera a que tu comité la revise.",
    };
  }

  const claveHash = await hashPassword(clave);

  await db.insert(solicitudesAcceso).values({
    socioId: socio.id,
    claveHash,
  });

  return { ok: true };
}

export type ResultadoAprobacion = { ok: true } | { ok: false; error: string };

/**
 * Aprueba una solicitud: crea la cuenta directamente en las tablas de
 * Better Auth (user + account), replicando lo que hace internamente su
 * propio signUp, pero con rol SOCIO fijado desde el insert.
 *
 * A propósito NO pasa por auth.api.signUp: ese flujo dispara el hook de
 * auth.ts pensado para el registro de un dirigente nuevo (crea/vincula un
 * Apr y el usuario nace ADMIN por defecto) — exactamente lo que no debe
 * pasarle a un socio, ni siquiera un instante.
 */
export async function aprobarSolicitudAcceso(
  solicitudId: string,
  aprId: string
): Promise<ResultadoAprobacion> {
  const solicitud = await db.query.solicitudesAcceso.findFirst({
    where: eq(solicitudesAcceso.id, solicitudId),
    with: { socio: { columns: { id: true, aprId: true, nombre: true, rut: true, userId: true } } },
  });

  if (!solicitud || solicitud.socio.aprId !== aprId) {
    return { ok: false, error: "Solicitud no encontrada." };
  }
  if (solicitud.estado !== "PENDIENTE") {
    return { ok: false, error: "Esta solicitud ya fue resuelta." };
  }
  if (solicitud.socio.userId) {
    return { ok: false, error: "Este socio ya tiene una cuenta." };
  }

  const userId = createId();
  const correoSintetico = correoSocioDesdeRut(
    solicitud.socio.rut,
    solicitud.socio.aprId
  );

  await db.insert(userTable).values({
    id: userId,
    name: solicitud.socio.nombre,
    email: correoSintetico,
    // El correo es interno, el socio nunca lo ve ni tiene que verificarlo.
    emailVerified: true,
    // apr/rutComite/comuna existen para el registro de un dirigente nuevo,
    // que declara esos datos para crear su comité. Un socio ya pertenece a
    // un Apr existente (aprId abajo) y no declara nada de eso: quedan vacíos
    // a propósito, no es un dato faltante.
    apr: "",
    rutComite: "",
    comuna: "",
    cargo: "socio",
    aprId: solicitud.socio.aprId,
    rol: "SOCIO",
  });

  await db.insert(accountTable).values({
    id: createId(),
    userId,
    providerId: "credential",
    accountId: userId,
    password: solicitud.claveHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db
    .update(socios)
    .set({ userId })
    .where(eq(socios.id, solicitud.socio.id));

  await db
    .update(solicitudesAcceso)
    .set({ estado: "APROBADA", updatedAt: new Date() })
    .where(eq(solicitudesAcceso.id, solicitudId));

  return { ok: true };
}

export async function rechazarSolicitudAcceso(
  solicitudId: string,
  aprId: string,
  motivo: string
): Promise<ResultadoAprobacion> {
  const solicitud = await db.query.solicitudesAcceso.findFirst({
    where: eq(solicitudesAcceso.id, solicitudId),
    with: { socio: { columns: { aprId: true } } },
  });

  if (!solicitud || solicitud.socio.aprId !== aprId) {
    return { ok: false, error: "Solicitud no encontrada." };
  }
  if (solicitud.estado !== "PENDIENTE") {
    return { ok: false, error: "Esta solicitud ya fue resuelta." };
  }

  await db
    .update(solicitudesAcceso)
    .set({ estado: "RECHAZADA", motivoRechazo: motivo, updatedAt: new Date() })
    .where(eq(solicitudesAcceso.id, solicitudId));

  return { ok: true };
}

/** RUT normalizado -> correo sintético, para el login. */
export function correoSocioDesdeRut(rut: string, aprId: string): string {
  return `${normalizarRut(rut).toLowerCase()}@${aprId}.socio.local`;
}
