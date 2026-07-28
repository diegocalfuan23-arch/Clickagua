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

export type ResultadoImportacion =
  | {
      ok: true;
      creados: number;
      actualizados: number;
      omitidos: { linea: number; motivo: string }[];
    }
  | { ok: false; error: string };

/** Divide una línea de CSV respetando comillas. */
function partirLinea(linea: string): string[] {
  const campos: string[] = [];
  let actual = "";
  let entreComillas = false;

  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (c === '"') {
      if (entreComillas && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else {
        entreComillas = !entreComillas;
      }
    } else if ((c === "," || c === ";") && !entreComillas) {
      campos.push(actual.trim());
      actual = "";
    } else {
      actual += c;
    }
  }
  campos.push(actual.trim());
  return campos;
}

/**
 * Importa socios desde CSV. Columnas: nombre, rut, telefono y opcionalmente
 * direccion y numeroCliente.
 *
 * Reimportar actualiza al socio en vez de duplicarlo: el padrón de un comité
 * se corrige y se vuelve a subir, y esperar que eso cree copias sería un
 * desastre. La clave es el RUT dentro del comité.
 */
export async function importarSocios(
  _prev: ResultadoImportacion | null,
  formData: FormData
): Promise<ResultadoImportacion> {
  const { apr } = await requireApr();

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, error: "Elige un archivo CSV." };
  }

  if (archivo.size > 2_000_000) {
    return { ok: false, error: "El archivo es demasiado grande (máximo 2 MB)." };
  }

  const texto = await archivo.text();
  const lineas = texto.split(/\r?\n/).filter((l) => l.trim() !== "");

  if (lineas.length < 2) {
    return { ok: false, error: "El archivo no tiene filas de datos." };
  }

  const encabezado = partirLinea(lineas[0]).map((h) =>
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

  if (iNombre < 0 || iRut < 0 || iTelefono < 0) {
    return {
      ok: false,
      error:
        "El CSV debe tener las columnas: nombre, rut y telefono.",
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
    existentes.map((s) => [normalizarTelefono(s.telefono), s])
  );

  const omitidos: { linea: number; motivo: string }[] = [];
  const aCrear: (typeof socios.$inferInsert)[] = [];
  const aActualizar: { id: string; datos: Partial<typeof socios.$inferInsert> }[] =
    [];
  const rutsVistos = new Set<string>();
  const telefonosVistos = new Set<string>();

  for (let i = 1; i < lineas.length; i++) {
    const campos = partirLinea(lineas[i]);
    const nLinea = i + 1;

    const nombre = (campos[iNombre] ?? "").trim();
    const rutCrudo = (campos[iRut] ?? "").trim();
    const telCrudo = (campos[iTelefono] ?? "").trim();

    if (!nombre || !rutCrudo || !telCrudo) {
      omitidos.push({ linea: nLinea, motivo: "Falta nombre, RUT o teléfono" });
      continue;
    }

    const rut = normalizarRut(rutCrudo);
    const telefono = normalizarTelefono(telCrudo);

    if (!/^\+\d{8,15}$/.test(telefono)) {
      omitidos.push({ linea: nLinea, motivo: `Teléfono inválido: ${telCrudo}` });
      continue;
    }

    if (rutsVistos.has(rut)) {
      omitidos.push({ linea: nLinea, motivo: `RUT repetido en el archivo: ${rutCrudo}` });
      continue;
    }
    if (telefonosVistos.has(telefono)) {
      omitidos.push({ linea: nLinea, motivo: `Teléfono repetido en el archivo: ${telCrudo}` });
      continue;
    }

    const yaExiste = porRut.get(rut);
    const choqueTelefono = porTelefono.get(telefono);

    // El teléfono ya es de OTRO socio del padrón: no lo pisamos en silencio.
    if (choqueTelefono && choqueTelefono.id !== yaExiste?.id) {
      omitidos.push({
        linea: nLinea,
        motivo: `El teléfono ${telCrudo} ya pertenece a otro socio`,
      });
      continue;
    }

    rutsVistos.add(rut);
    telefonosVistos.add(telefono);

    const datos = {
      nombre,
      rut,
      telefono,
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
