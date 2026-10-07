"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/apr-session";
import { normalizarRut } from "@/lib/formato";
import { leerTabla } from "@/lib/tabla";

const socioSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  rut: z.string().trim().min(1, "El RUT es obligatorio."),
  // Opcional: hay comités donde parte de los socios no ha entregado su número.
  // Sin teléfono el socio igual tiene boletas y panel; solo no recibe WhatsApp.
  telefono: z.string().trim().optional(),
  direccion: z.string().trim().optional(),
  numeroCliente: z.string().trim().optional(),
});

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

/** Deja el teléfono en formato E.164 (+56...) para guardarlo consistente. */
function normalizarTelefono(valor: string) {
  const digitos = valor.replace(/[^\d]/g, "");

  if (valor.trim().startsWith("+")) return `+${digitos}`;
  if (digitos.startsWith("56")) return `+${digitos}`;
  // Un número chileno sin prefijo: 9 1234 5678
  if (digitos.length === 9) return `+56${digitos}`;

  return `+${digitos}`;
}

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
    rut: formData.get("rut"),
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
      rut: normalizarRut(datos.rut),
      telefono: telefonoOpcional(datos.telefono),
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
  const { apr } = await requireAdmin();

  const socioId = String(formData.get("socioId") ?? "");
  if (!socioId) {
    return { ok: false, error: "No pudimos identificar al socio." };
  }

  const parsed = socioSchema.safeParse({
    nombre: formData.get("nombre"),
    rut: formData.get("rut"),
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
        rut: normalizarRut(datos.rut),
        telefono: telefonoOpcional(datos.telefono),
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

export type ResultadoImportacion =
  | {
      ok: true;
      creados: number;
      actualizados: number;
      omitidos: { linea: number; motivo: string }[];
    }
  | { ok: false; error: string };

/**
 * Importa socios desde CSV. Columnas: nombre y rut; opcionalmente telefono
 * (puede venir vacío en algunas filas), direccion y numeroCliente.
 *
 * Reimportar actualiza al socio en vez de duplicarlo: el padrón de un comité
 * se corrige y se vuelve a subir, y esperar que eso cree copias sería un
 * desastre. La clave es el RUT dentro del comité.
 */
export async function importarSocios(
  _prev: ResultadoImportacion | null,
  formData: FormData
): Promise<ResultadoImportacion> {
  const { apr } = await requireAdmin();

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, error: "Elige un archivo CSV o Excel (.xlsx)." };
  }

  if (archivo.size > 2_000_000) {
    return { ok: false, error: "El archivo es demasiado grande (máximo 2 MB)." };
  }

  // CSV o Excel (.xlsx): desde aquí todo trabaja sobre filas de texto.
  const tabla = await leerTabla(archivo);
  if (!tabla.ok) return { ok: false, error: tabla.error };
  const filas = tabla.filas;

  const encabezado = filas[0].map((h) =>
    h
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  );

  const col = (...nombres: string[]) =>
    nombres.map((n) => encabezado.indexOf(n)).find((i) => i >= 0) ?? -1;

  const iNombre = col("nombre", "nombres", "socio", "nombre socio");
  const iRut = col("rut", "rut socio", "rutsocio");
  const iTelefono = col("telefono", "fono", "celular", "whatsapp");
  const iDireccion = col("direccion", "domicilio");
  const iNumero = col("numerocliente", "numero cliente", "n cliente", "numero");

  if (iNombre < 0 || iRut < 0) {
    return {
      ok: false,
      error: "El archivo debe tener al menos las columnas: nombre y rut.",
    };
  }

  const existentes = await db.query.socios.findMany({
    where: eq(socios.aprId, apr.id),
    columns: { id: true, rut: true, telefono: true },
  });
  const porRut = new Map(existentes.map((s) => [normalizarRut(s.rut), s]));
  // El teléfono también es único por comité: hay que detectar el choque antes
  // de insertar, o la fila muere con un error de base de datos sin explicación.
  const porTelefono = new Map(
    existentes.flatMap((s) =>
      s.telefono ? [[normalizarTelefono(s.telefono), s] as const] : []
    )
  );

  const omitidos: { linea: number; motivo: string }[] = [];
  const aCrear: (typeof socios.$inferInsert)[] = [];
  const aActualizar: { id: string; datos: Partial<typeof socios.$inferInsert> }[] =
    [];
  const rutsVistos = new Set<string>();
  const telefonosVistos = new Set<string>();

  for (let i = 1; i < filas.length; i++) {
    const campos = filas[i];
    const nLinea = i + 1;

    const nombre = (campos[iNombre] ?? "").trim();
    const rutCrudo = (campos[iRut] ?? "").trim();
    const telCrudo = iTelefono >= 0 ? (campos[iTelefono] ?? "").trim() : "";

    if (!nombre || !rutCrudo) {
      omitidos.push({ linea: nLinea, motivo: "Falta nombre o RUT" });
      continue;
    }

    const rut = normalizarRut(rutCrudo);
    // Teléfono vacío es válido: el socio entra al padrón sin WhatsApp.
    const telefono = telCrudo ? normalizarTelefono(telCrudo) : null;

    if (telefono && !/^\+\d{8,15}$/.test(telefono)) {
      omitidos.push({ linea: nLinea, motivo: `Teléfono inválido: ${telCrudo}` });
      continue;
    }

    if (rutsVistos.has(rut)) {
      omitidos.push({ linea: nLinea, motivo: `RUT repetido en el archivo: ${rutCrudo}` });
      continue;
    }
    if (telefono && telefonosVistos.has(telefono)) {
      omitidos.push({ linea: nLinea, motivo: `Teléfono repetido en el archivo: ${telCrudo}` });
      continue;
    }

    const yaExiste = porRut.get(rut);
    const choqueTelefono = telefono ? porTelefono.get(telefono) : undefined;

    // El teléfono ya es de OTRO socio del padrón: no lo pisamos en silencio.
    if (choqueTelefono && choqueTelefono.id !== yaExiste?.id) {
      omitidos.push({
        linea: nLinea,
        motivo: `El teléfono ${telCrudo} ya pertenece a otro socio`,
      });
      continue;
    }

    rutsVistos.add(rut);
    if (telefono) telefonosVistos.add(telefono);

    const datos = {
      nombre,
      rut,
      // Al reimportar, una celda vacía no borra el teléfono que ya tenía.
      ...(telefono ? { telefono } : {}),
      direccion: iDireccion >= 0 ? campos[iDireccion] || null : null,
      numeroCliente: iNumero >= 0 ? campos[iNumero] || null : null,
    };

    if (yaExiste) {
      aActualizar.push({ id: yaExiste.id, datos });
    } else {
      aCrear.push({ ...datos, aprId: apr.id });
    }
  }

  if (aCrear.length === 0 && aActualizar.length === 0) {
    return {
      ok: false,
      error:
        omitidos.length > 0
          ? `No se pudo importar ninguna fila. Primer problema: ${omitidos[0].motivo}`
          : "No se pudo importar ninguna fila.",
    };
  }

  if (aCrear.length > 0) {
    await db.insert(socios).values(aCrear);
  }

  for (const { id, datos } of aActualizar) {
    await db
      .update(socios)
      .set({ ...datos, updatedAt: new Date() })
      .where(and(eq(socios.id, id), eq(socios.aprId, apr.id)));
  }

  revalidatePath("/panel/socios");
  revalidatePath("/panel");

  return {
    ok: true,
    creados: aCrear.length,
    actualizados: aActualizar.length,
    omitidos,
  };
}
