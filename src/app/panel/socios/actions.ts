"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";

const socioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  rut: z.string().trim().min(1, "El RUT es obligatorio."),
  telefono: z.string().trim().min(1, "El teléfono es obligatorio."),
  direccion: z.string().trim().optional(),
  numeroCliente: z.string().trim().optional(),
});

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

/**
 * Deja el teléfono en formato E.164 (+56...), que es como llegan los
 * números desde WhatsApp. Sin esto, el bot no encuentra al socio.
 */
function normalizarTelefono(valor: string) {
  const digitos = valor.replace(/[^\d]/g, "");

  if (valor.trim().startsWith("+")) return `+${digitos}`;
  if (digitos.startsWith("56")) return `+${digitos}`;
  // Un número chileno sin prefijo: 9 1234 5678
  if (digitos.length === 9) return `+56${digitos}`;

  return `+${digitos}`;
}

/** Normaliza el RUT a 12345678-9, sin puntos y con dígito verificador en mayúscula. */
function normalizarRut(valor: string) {
  const limpio = valor.replace(/[.\s]/g, "").toUpperCase();
  return limpio.includes("-")
    ? limpio
    : limpio.replace(/^(\d+)([\dK])$/, "$1-$2");
}

export async function crearSocio(
  _prev: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const { apr } = await requireApr();

  const parsed = socioSchema.safeParse({
    nombre: formData.get("nombre"),
    rut: formData.get("rut"),
    telefono: formData.get("telefono"),
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
      rut: normalizarRut(datos.rut),
      telefono: normalizarTelefono(datos.telefono),
      direccion: datos.direccion,
      numeroCliente: datos.numeroCliente,
    });
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "";

    if (mensaje.includes("Socio_apr_rut_key")) {
      return { ok: false, error: "Ya existe un socio con ese RUT." };
    }
    if (mensaje.includes("Socio_apr_telefono_key")) {
      return { ok: false, error: "Ya existe un socio con ese teléfono." };
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
  const { apr } = await requireApr();

  const socioId = String(formData.get("socioId") ?? "");
  if (!socioId) {
    return { ok: false, error: "No pudimos identificar al socio." };
  }

  const parsed = socioSchema.safeParse({
    nombre: formData.get("nombre"),
    rut: formData.get("rut"),
    telefono: formData.get("telefono"),
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
        rut: normalizarRut(datos.rut),
        telefono: normalizarTelefono(datos.telefono),
        direccion: datos.direccion ?? null,
        numeroCliente: datos.numeroCliente ?? null,
        updatedAt: new Date(),
      })
      // El filtro por aprId impide editar un socio de otro comité.
      .where(and(eq(socios.id, socioId), eq(socios.aprId, apr.id)));
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : "";

    if (mensaje.includes("Socio_apr_rut_key")) {
      return { ok: false, error: "Ya existe otro socio con ese RUT." };
    }
    if (mensaje.includes("Socio_apr_telefono_key")) {
      return { ok: false, error: "Ya existe otro socio con ese teléfono." };
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
  const { apr } = await requireApr();

  await db
    .update(socios)
    .set({ activo, updatedAt: new Date() })
    .where(and(eq(socios.id, socioId), eq(socios.aprId, apr.id)));

  revalidatePath("/panel/socios");
  return { ok: true };
}

export async function eliminarSocio(socioId: string): Promise<ResultadoAccion> {
  const { apr } = await requireApr();

  // El filtro por aprId impide borrar un socio de otro comité.
  await db
    .delete(socios)
    .where(and(eq(socios.id, socioId), eq(socios.aprId, apr.id)));

  revalidatePath("/panel/socios");
  return { ok: true };
}
