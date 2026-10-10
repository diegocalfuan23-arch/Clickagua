"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { boletas, lecturas, socios } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/apr-session";
import { hashPassword } from "better-auth/crypto";
import {
  account as accountTable,
  session as sessionTable,
} from "@/lib/db/auth-schema";
import { normalizarRut, normalizarTelefono } from "@/lib/formato";

const socioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  // Opcional: un usuario (no socio) puede no tener RUT. Una persona con varios
  // arranques repite el suyo en cada uno.
  rut: z.string().trim().optional(),
  tipo: z.enum(["SOCIO", "USUARIO"]).default("SOCIO"),
  // Opcional: hay comités donde parte de los socios no ha entregado su número.
  // Sin teléfono el socio igual tiene boletas y panel; solo no recibe WhatsApp.
  telefono: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  numeroCliente: z.string().trim().optional(),
});

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

/** Vacío = sin teléfono (null); lo demás se normaliza a E.164. */
function telefonoOpcional(valor: string | undefined) {
  return valor ? normalizarTelefono(valor) : null;
}

export async function crearSocio(
  _prev: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const { apr } = await requireAdmin();

  const parsed = socioSchema.safeParse({
    nombre: formData.get("nombre"),
    rut: formData.get("rut") || undefined,
    tipo: formData.get("tipo") || undefined,
    telefono: formData.get("telefono") || undefined,
    direccion: formData.get("direccion") || undefined,
    numeroCliente: formData.get("numeroCliente") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const datos = parsed.data;

  try {
    await db.insert(socios).values({
      aprId: apr.id,
      nombre: datos.nombre,
      rut: datos.rut ? normalizarRut(datos.rut) : null,
      tipo: datos.tipo,
      telefono: telefonoOpcional(datos.telefono),
      direccion: datos.direccion,
      numeroCliente: datos.numeroCliente,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "";

    if (mensaje.includes("Socio_apr_tipo_numero_key")) {
      return { ok: false, error: "Ya hay un arranque con ese N.º. Usa otro número." };
    }

    return { ok: false, error: "No pudimos guardar el socio. Inténtalo otra vez." };
  }

  revalidatePath("/panel/socios");
  return { ok: true };
}

export async function editarSocio(
  _prev: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const { apr } = await requireAdmin();

  const socioId = String(formData.get("socioId") ?? "");
  if (!socioId) {
    return { ok: false, error: "No pudimos identificar al socio." };
  }

  const parsed = socioSchema.safeParse({
    nombre: formData.get("nombre"),
    rut: formData.get("rut") || undefined,
    tipo: formData.get("tipo") || undefined,
    telefono: formData.get("telefono") || undefined,
    direccion: formData.get("direccion") || undefined,
    numeroCliente: formData.get("numeroCliente") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const datos = parsed.data;

  try {
    await db
      .update(socios)
      .set({
        nombre: datos.nombre,
        rut: datos.rut ? normalizarRut(datos.rut) : null,
        tipo: datos.tipo,
        telefono: telefonoOpcional(datos.telefono),
        direccion: datos.direccion ?? null,
        numeroCliente: datos.numeroCliente ?? null,
        updatedAt: new Date(),
      })
      // El filtro por aprId impide editar un socio de otro comité.
      .where(and(eq(socios.id, socioId), eq(socios.aprId, apr.id)));
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "";

    if (mensaje.includes("Socio_apr_tipo_numero_key")) {
      return { ok: false, error: "Ya hay otro arranque con ese N.º. Usa otro número." };
    }

    return {
      ok: false,
      error: "No pudimos guardar los cambios. Inténtalo otra vez.",
    };
  }

  revalidatePath("/panel/socios");
  return { ok: true };
}

export async function alternarActivo(
  socioId: string,
  activo: boolean
): Promise<ResultadoAccion> {
  const { apr } = await requireAdmin();

  await db
    .update(socios)
    .set({ activo, updatedAt: new Date() })
    .where(and(eq(socios.id, socioId), eq(socios.aprId, apr.id)));

  revalidatePath("/panel/socios");
  return { ok: true };
}

export async function eliminarSocio(socioId: string): Promise<ResultadoAccion> {
  const { apr } = await requireAdmin();

  // El filtro por aprId impide borrar un socio de otro comité.
  await db
    .delete(socios)
    .where(and(eq(socios.id, socioId), eq(socios.aprId, apr.id)));

  revalidatePath("/panel/socios");
  return { ok: true };
}

export type ResultadoMasivoSocios =
  | { ok: true; hechos: number; omitidos: number }
  | { ok: false; error: string };

const MAX_MASIVO = 2000;

function idsValidos(ids: unknown): string[] | null {
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > MAX_MASIVO) return null;
  return [...new Set(ids.map((i) => String(i)))];
}

/** Desactiva varios arranques de una vez. No borra nada: conservan su historial. */
export async function desactivarSocios(
  ids: string[]
): Promise<ResultadoMasivoSocios> {
  const { apr } = await requireAdmin();
  const lista = idsValidos(ids);
  if (!lista) return { ok: false, error: "Elige entre 1 y 2.000 socios." };

  const hechos = await db
    .update(socios)
    .set({ activo: false, updatedAt: new Date() })
    .where(and(eq(socios.aprId, apr.id), inArray(socios.id, lista)))
    .returning({ id: socios.id });

  revalidatePath("/panel/socios");
  revalidatePath("/panel");
  return { ok: true, hechos: hechos.length, omitidos: lista.length - hechos.length };
}

/**
 * Elimina varios arranques, pero SOLO los que no tienen lecturas ni boletas ni
 * una cuenta de portal: los demás se saltan (para esos, usa Desactivar). Así una
 * limpieza masiva nunca se lleva el historial de cobros.
 */
export async function eliminarSociosSinMovimientos(
  ids: string[]
): Promise<ResultadoMasivoSocios> {
  const { apr } = await requireAdmin();
  const lista = idsValidos(ids);
  if (!lista) return { ok: false, error: "Elige entre 1 y 2.000 socios." };

  const propios = await db.query.socios.findMany({
    where: and(eq(socios.aprId, apr.id), inArray(socios.id, lista)),
    columns: { id: true, userId: true },
  });
  const idsPropios = propios.map((s) => s.id);
  if (idsPropios.length === 0) return { ok: true, hechos: 0, omitidos: lista.length };

  const conBoletas = await db
    .selectDistinct({ id: boletas.socioId })
    .from(boletas)
    .where(inArray(boletas.socioId, idsPropios));
  const conLecturas = await db
    .selectDistinct({ id: lecturas.socioId })
    .from(lecturas)
    .where(inArray(lecturas.socioId, idsPropios));
  const conMovimientos = new Set([
    ...conBoletas.map((b) => b.id),
    ...conLecturas.map((l) => l.id),
  ]);

  const borrables = propios
    .filter((s) => !s.userId && !conMovimientos.has(s.id))
    .map((s) => s.id);

  if (borrables.length > 0) {
    await db
      .delete(socios)
      .where(and(eq(socios.aprId, apr.id), inArray(socios.id, borrables)));
  }

  revalidatePath("/panel/socios");
  revalidatePath("/panel");
  return {
    ok: true,
    hechos: borrables.length,
    omitidos: lista.length - borrables.length,
  };
}

/**
 * La directiva le pone una clave nueva a un socio que olvidó la suya. No hay
 * recuperación por correo porque el socio entra con RUT (su correo es interno).
 * Una persona con varios arranques comparte una sola cuenta: se busca por RUT
 * dentro del comité, y solo se toca a alguien de este comité.
 */
export async function restablecerClaveSocio(
  socioId: string,
  claveNueva: string
): Promise<ResultadoAccion> {
  const { apr } = await requireAdmin();

  if (claveNueva.length < 8) {
    return { ok: false, error: "La clave debe tener al menos 8 caracteres." };
  }

  const socio = await db.query.socios.findFirst({
    where: and(eq(socios.id, socioId), eq(socios.aprId, apr.id)),
    columns: { id: true, rut: true, userId: true },
  });
  if (!socio) return { ok: false, error: "Socio no encontrado." };

  let userId = socio.userId;
  if (!userId && socio.rut) {
    const conCuenta = await db.query.socios.findFirst({
      where: and(eq(socios.aprId, apr.id), eq(socios.rut, socio.rut), isNotNull(socios.userId)),
      columns: { userId: true },
    });
    userId = conCuenta?.userId ?? null;
  }
  if (!userId) {
    return { ok: false, error: "Este socio todavía no tiene cuenta en el portal." };
  }

  const claveHash = await hashPassword(claveNueva);

  const actualizadas = await db
    .update(accountTable)
    .set({ password: claveHash, updatedAt: new Date() })
    .where(and(eq(accountTable.userId, userId), eq(accountTable.providerId, "credential")))
    .returning({ id: accountTable.id });

  if (actualizadas.length === 0) {
    return { ok: false, error: "No se encontró la cuenta de acceso de este socio." };
  }

  // Si la clave se olvidó o se filtró, cualquier sesión abierta con la vieja
  // debe dejar de servir.
  await db.delete(sessionTable).where(eq(sessionTable.userId, userId));

  return { ok: true };
}
