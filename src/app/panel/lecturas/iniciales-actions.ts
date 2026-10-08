"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { lecturas, socios } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/apr-session";
import { normalizarPeriodo } from "@/lib/boletas";
import { leerTabla } from "@/lib/tabla";
import {
  detectarLecturas,
  resolverLecturas,
  type CuentaRef,
  type LecturaResuelta,
} from "@/lib/importar-lecturas";

/**
 * Cargar la lectura de partida de cada medidor, para que la primera boleta cobre
 * solo el consumo del mes. Dos pasos, como el padrón: primero se lee y se
 * muestra qué se entendió (sin guardar), y recién al confirmar se cargan.
 * Quedan aprobadas pero SIN boleta: son el punto de partida de la próxima.
 */

const MAX_BYTES = 4_000_000;
const MAX_FILAS = 2000;

export type PrevisualizacionIniciales =
  | { ok: true; periodo: string; notas: string[]; filas: LecturaResuelta[] }
  | { ok: false; error: string };

export type ResultadoIniciales =
  | { ok: true; cargadas: number }
  | { ok: false; error: string };

async function cuentasDelComite(aprId: string): Promise<CuentaRef[]> {
  const todas = await db.query.socios.findMany({
    where: eq(socios.aprId, aprId),
    columns: { id: true, nombre: true, rut: true, tipo: true, numeroCliente: true },
  });

  const conLecturas = new Set(
    (
      await db
        .selectDistinct({ socioId: lecturas.socioId })
        .from(lecturas)
        .innerJoin(socios, eq(lecturas.socioId, socios.id))
        .where(and(eq(socios.aprId, aprId), eq(lecturas.estado, "APROBADA")))
    ).map((l) => l.socioId)
  );

  return todas.map((s) => ({ ...s, tieneLecturas: conLecturas.has(s.id) }));
}

/** Paso 1: lee la planilla y resuelve a qué arranque corresponde cada lectura. No guarda nada. */
export async function previsualizarIniciales(
  formData: FormData
): Promise<PrevisualizacionIniciales> {
  const { apr } = await requireAdmin();

  const archivo = formData.get("archivo");
  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, error: "Elige un archivo CSV o Excel (.xlsx)." };
  }
  if (archivo.size > MAX_BYTES) {
    return { ok: false, error: "El archivo es demasiado grande (máximo 4 MB)." };
  }

  const periodo = normalizarPeriodo(String(formData.get("periodo") ?? ""));
  if (!periodo) {
    return { ok: false, error: "El período debe ser un mes válido, por ejemplo 2026-09." };
  }

  const tabla = await leerTabla(archivo, { conservarVacias: true });
  if (!tabla.ok) return { ok: false, error: tabla.error };

  const deteccion = detectarLecturas(tabla.filas);
  if (!deteccion.ok) return { ok: false, error: deteccion.error };
  if (deteccion.filas.length > MAX_FILAS) {
    return { ok: false, error: `El archivo trae ${deteccion.filas.length} filas; el máximo es ${MAX_FILAS}.` };
  }

  const filas = resolverLecturas(deteccion.filas, await cuentasDelComite(apr.id));
  return { ok: true, periodo, notas: deteccion.notas, filas };
}

/** Paso 2: guarda las que la directiva confirmó. Se vuelve a validar en el servidor. */
export async function confirmarIniciales(
  items: { socioId: string; valor: number }[],
  periodoCrudo: string
): Promise<ResultadoIniciales> {
  const { user, apr } = await requireAdmin();

  const periodo = normalizarPeriodo(String(periodoCrudo ?? ""));
  if (!periodo) return { ok: false, error: "El período no es válido." };
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "No hay lecturas para cargar." };
  }
  if (items.length > MAX_FILAS) {
    return { ok: false, error: `Máximo ${MAX_FILAS} lecturas por carga.` };
  }

  const limpios = items.map((i) => ({
    socioId: String(i.socioId ?? ""),
    valor: Number(i.valor),
  }));
  if (limpios.some((i) => !i.socioId || !Number.isInteger(i.valor) || i.valor < 0)) {
    return { ok: false, error: "Hay una lectura con un valor inválido." };
  }
  if (new Set(limpios.map((i) => i.socioId)).size !== limpios.length) {
    return { ok: false, error: "Hay un arranque repetido en la carga." };
  }

  // Cada arranque debe ser del comité y no tener lecturas aprobadas todavía.
  const cuentas = await cuentasDelComite(apr.id);
  const porId = new Map(cuentas.map((c) => [c.id, c]));
  for (const i of limpios) {
    const c = porId.get(i.socioId);
    if (!c) return { ok: false, error: "Un arranque no pertenece a tu comité." };
    if (c.tieneLecturas) {
      return { ok: false, error: `${c.nombre} ya tiene lecturas aprobadas: no es una lectura inicial.` };
    }
  }

  try {
    await db.transaction(async (tx) => {
      for (let i = 0; i < limpios.length; i += 500) {
        await tx.insert(lecturas).values(
          limpios.slice(i, i + 500).map((l) => ({
            socioId: l.socioId,
            periodo,
            valor: l.valor,
            observacion: "Lectura inicial",
            estado: "APROBADA" as const,
            registradaPorId: user.id,
            revisadaPorId: user.id,
          }))
        );
      }
    });
  } catch {
    return { ok: false, error: "No pudimos guardar las lecturas. No se cargó nada; inténtalo otra vez." };
  }

  revalidatePath("/panel/lecturas");
  return { ok: true, cargadas: limpios.length };
}
