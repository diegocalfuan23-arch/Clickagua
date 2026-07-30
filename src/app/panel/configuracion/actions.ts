"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { aprs } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

/** Campo numérico opcional: acepta vacío y descarta lo que no sea número. */
function aEntero(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? "").replace(/[^\d]/g, "");
  return texto === "" ? null : Number(texto);
}

function aTexto(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return texto === "" ? null : texto;
}

const comiteSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre del comité es obligatorio."),
  razonSocial: z.string().trim().max(160).nullable(),
  rut: z.string().trim().min(1, "El RUT es obligatorio."),
  comuna: z.string().trim().min(1, "La comuna es obligatoria."),
  region: z.string().trim().max(80).nullable(),
  direccion: z.string().trim().max(200).nullable(),
  telefono: z.string().trim().max(30).nullable(),
  email: z.string().trim().email("El correo no es válido.").nullable(),
  sitioWeb: z.string().trim().max(200).nullable(),
});

export async function guardarComite(
  _prev: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const { apr } = await requireApr();

  const parsed = comiteSchema.safeParse({
    nombre: formData.get("nombre"),
    razonSocial: aTexto(formData.get("razonSocial")),
    rut: formData.get("rut"),
    comuna: formData.get("comuna"),
    region: aTexto(formData.get("region")),
    direccion: aTexto(formData.get("direccion")),
    telefono: aTexto(formData.get("telefono")),
    email: aTexto(formData.get("email")),
    sitioWeb: aTexto(formData.get("sitioWeb")),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  try {
    await db
      .update(aprs)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(aprs.id, apr.id));
  } catch (e) {
    // El RUT es único entre comités: dos APR no pueden compartirlo.
    if (String(e).includes("Apr_rut_key")) {
      return { ok: false, error: "Ya existe otro comité con ese RUT." };
    }
    throw e;
  }

  revalidatePath("/panel/configuracion");
  revalidatePath("/panel");
  return { ok: true };
}

/**
 * Los formatos de monto y fecha del panel siguen usando es-CL y CLP en el
 * código. Esto guarda la configuración del comité para cuando el producto
 * salga de Chile; hasta entonces solo se muestra.
 */
const PAISES = ["CL", "PE", "BO", "AR", "CO", "EC"] as const;

export async function guardarRegional(
  _prev: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const { apr } = await requireApr();

  const pais = String(formData.get("pais") ?? "");
  if (!PAISES.includes(pais as (typeof PAISES)[number])) {
    return { ok: false, error: "El país seleccionado no es válido." };
  }

  const moneda = String(formData.get("moneda") ?? "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(moneda)) {
    return {
      ok: false,
      error: "La moneda debe ser un código de 3 letras, por ejemplo CLP o PEN.",
    };
  }

  const zona = String(formData.get("zonaHoraria") ?? "").trim();
  // Que Intl la reconozca evita guardar una zona que después rompa el formato.
  try {
    new Intl.DateTimeFormat("es", { timeZone: zona });
  } catch {
    return { ok: false, error: "La zona horaria no es válida." };
  }

  await db
    .update(aprs)
    .set({ pais, moneda, zonaHoraria: zona, updatedAt: new Date() })
    .where(eq(aprs.id, apr.id));

  revalidatePath("/panel/configuracion");
  return { ok: true };
}

export async function guardarFacturacion(
  _prev: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const { apr } = await requireApr();

  const dia = aEntero(formData.get("diaGeneracionBoletas")) ?? 1;
  const dias = aEntero(formData.get("diasVencimiento")) ?? 15;
  const iva = aEntero(formData.get("porcentajeIva")) ?? 19;
  const prefijo = String(formData.get("prefijoBoleta") ?? "").trim();

  if (dia < 1 || dia > 28) {
    return {
      ok: false,
      // Hasta 28 para que exista en febrero: un día 30 se saltaría ese mes.
      error: "El día de generación debe estar entre 1 y 28.",
    };
  }

  if (dias < 1 || dias > 120) {
    return { ok: false, error: "Los días de vencimiento deben ir de 1 a 120." };
  }

  if (iva < 0 || iva > 100) {
    return { ok: false, error: "El porcentaje de IVA no es válido." };
  }

  if (prefijo.length > 10) {
    return { ok: false, error: "El prefijo no puede superar 10 caracteres." };
  }

  await db
    .update(aprs)
    .set({
      diaGeneracionBoletas: dia,
      diasVencimiento: dias,
      prefijoBoleta: prefijo || "BOL-",
      incluyeIva: formData.get("incluyeIva") === "on",
      porcentajeIva: iva,
      updatedAt: new Date(),
    })
    .where(eq(aprs.id, apr.id));

  revalidatePath("/panel/configuracion");
  return { ok: true };
}

const FRECUENCIAS = ["MENSUAL", "BIMENSUAL", "TRIMESTRAL"] as const;

export async function guardarMedidores(
  _prev: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const { apr } = await requireApr();

  const frecuencia = String(formData.get("frecuenciaLectura") ?? "");
  if (!FRECUENCIAS.includes(frecuencia as (typeof FRECUENCIAS)[number])) {
    return { ok: false, error: "La frecuencia de lectura no es válida." };
  }

  const tolerancia = aEntero(formData.get("toleranciaConsumoAnormal")) ?? 50;
  const fuga = aEntero(formData.get("alertaFugaConsumo")) ?? 100;

  if (tolerancia < 1 || tolerancia > 1000) {
    return { ok: false, error: "La tolerancia debe ir de 1% a 1000%." };
  }

  if (fuga <= tolerancia) {
    return {
      ok: false,
      error:
        "La alerta de fuga debe ser mayor que la tolerancia de consumo anormal.",
    };
  }

  await db
    .update(aprs)
    .set({
      frecuenciaLectura: frecuencia as (typeof FRECUENCIAS)[number],
      toleranciaConsumoAnormal: tolerancia,
      alertaFugaConsumo: fuga,
      requiereFotoLectura: formData.get("requiereFotoLectura") === "on",
      updatedAt: new Date(),
    })
    .where(eq(aprs.id, apr.id));

  revalidatePath("/panel/configuracion");
  return { ok: true };
}

export async function guardarCortes(
  _prev: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const { apr } = await requireApr();

  const gracia = aEntero(formData.get("diasGraciaCorte")) ?? 5;
  const aviso = aEntero(formData.get("diasAvisoCorte")) ?? 3;
  const costo = aEntero(formData.get("costoReconexion")) ?? 0;

  if (gracia < 0 || gracia > 180) {
    return { ok: false, error: "Los días de gracia deben ir de 0 a 180." };
  }

  if (aviso < 0 || aviso > 60) {
    return { ok: false, error: "Los días de aviso deben ir de 0 a 60." };
  }

  if (costo < 0) {
    return { ok: false, error: "El costo de reconexión no puede ser negativo." };
  }

  await db
    .update(aprs)
    .set({
      diasGraciaCorte: gracia,
      diasAvisoCorte: aviso,
      costoReconexion: costo,
      updatedAt: new Date(),
    })
    .where(eq(aprs.id, apr.id));

  revalidatePath("/panel/configuracion");
  return { ok: true };
}
