"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { boletas, socios } from "@/lib/db/schema";
import { requireApr } from "@/lib/apr-session";
import {
  aMonto,
  calcularDesdeLecturas,
  estadoQueCorresponde,
  normalizarPeriodo,
  type EstadoBoleta,
} from "@/lib/boletas";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

export type ResultadoImportacion =
  | {
      ok: true;
      creadas: number;
      actualizadas: number;
      omitidas: { linea: number; motivo: string }[];
    }
  | { ok: false; error: string };

const boletaSchema = z.object({
  socioId: z.string().trim().min(1, "Elige un socio."),
  periodo: z.string().trim().min(1, "El período es obligatorio."),
  fechaEmision: z.date(),
  fechaVencimiento: z.date(),
  lecturaAnterior: z.number().int().min(0).nullable(),
  lecturaActual: z.number().int().min(0).nullable(),
  montoTotal: z.number().int().min(0).nullable(),
  observacion: z.string().trim().max(300).optional(),
});

function aEntero(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? "").replace(/[^\d]/g, "");
  return texto === "" ? null : Number(texto);
}

function aFecha(valor: FormDataEntryValue | null): Date | null {
  const texto = String(valor ?? "").trim();
  if (!texto) return null;
  const f = new Date(texto);
  return Number.isNaN(f.getTime()) ? null : f;
}

/**
 * Drizzle envuelve el error de Postgres y su mensaje solo trae la consulta,
 * no la constraint: hay que mirar la causa original. Sin esto, un período
 * repetido le mostraría al comité la pantalla de error en vez de un aviso.
 */
function esDuplicadoDePeriodo(e: unknown): boolean {
  for (let actual: unknown = e, i = 0; actual && i < 5; i++) {
    const err = actual as { code?: string; constraint?: string; cause?: unknown };
    if (err.code === "23505" && err.constraint === "Boleta_socio_periodo_key") {
      return true;
    }
    actual = err.cause;
  }
  return false;
}

/**
 * Confirma que el socio pertenece al comité en sesión. Sin esto, alguien
 * podría crear una boleta a nombre de un socio de otro comité mandando su id.
 */
async function socioDelApr(socioId: string, aprId: string) {
  return db.query.socios.findFirst({
    where: and(eq(socios.id, socioId), eq(socios.aprId, aprId)),
    columns: { id: true },
  });
}

export async function guardarBoleta(
  _prev: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const { apr } = await requireApr();
  const boletaId = String(formData.get("boletaId") ?? "").trim();

  const parsed = boletaSchema.safeParse({
    socioId: formData.get("socioId"),
    periodo: formData.get("periodo"),
    fechaEmision: aFecha(formData.get("fechaEmision")) ?? new Date(),
    fechaVencimiento: aFecha(formData.get("fechaVencimiento")) ?? new Date(),
    lecturaAnterior: aEntero(formData.get("lecturaAnterior")),
    lecturaActual: aEntero(formData.get("lecturaActual")),
    montoTotal: aEntero(formData.get("montoTotal")),
    observacion: formData.get("observacion") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0].message };
  }

  const datos = parsed.data;

  const periodo = normalizarPeriodo(datos.periodo);
  if (!periodo) {
    return {
      ok: false,
      error: "El período debe ser un mes válido, por ejemplo 2026-07.",
    };
  }

  if (!(await socioDelApr(datos.socioId, apr.id))) {
    return { ok: false, error: "Ese socio no pertenece a tu comité." };
  }

  if (datos.fechaVencimiento < datos.fechaEmision) {
    return {
      ok: false,
      error: "El vencimiento no puede ser anterior a la emisión.",
    };
  }

  // Si hay lecturas, el monto se calcula; si no, se usa el que cargaron.
  const calculo = calcularDesdeLecturas(
    datos.lecturaAnterior,
    datos.lecturaActual,
    { cargoFijo: apr.tarifaCargoFijo, valorM3: apr.tarifaMetroCubico }
  );

  if (calculo && "error" in calculo) {
    return { ok: false, error: calculo.error };
  }

  const montoTotal = calculo ? calculo.montoTotal : datos.montoTotal;

  if (montoTotal === null) {
    return {
      ok: false,
      error:
        "Ingresa el monto de la boleta, o las dos lecturas del medidor para calcularlo.",
    };
  }

  const valores = {
    socioId: datos.socioId,
    periodo,
    montoTotal,
    fechaEmision: datos.fechaEmision,
    fechaVencimiento: datos.fechaVencimiento,
    lecturaAnterior: datos.lecturaAnterior,
    lecturaActual: datos.lecturaActual,
    consumoM3: calculo ? calculo.consumoM3 : null,
    cargoFijo: calculo ? calculo.cargoFijo : null,
    valorM3: calculo ? calculo.valorM3 : null,
    observacion: datos.observacion ?? null,
    updatedAt: new Date(),
  };

  try {
    if (boletaId) {
      // La boleta debe ser de un socio de este comité.
      const actual = await db
        .select({ id: boletas.id, montoPagado: boletas.montoPagado, estado: boletas.estado })
        .from(boletas)
        .innerJoin(socios, eq(boletas.socioId, socios.id))
        .where(and(eq(boletas.id, boletaId), eq(socios.aprId, apr.id)))
        .limit(1);

      if (actual.length === 0) {
        return { ok: false, error: "No encontramos esa boleta." };
      }

      await db
        .update(boletas)
        .set({
          ...valores,
          estado: estadoQueCorresponde(
            montoTotal,
            actual[0].montoPagado,
            datos.fechaVencimiento,
            actual[0].estado as EstadoBoleta
          ),
        })
        .where(eq(boletas.id, boletaId));
    } else {
      await db.insert(boletas).values({
        ...valores,
        montoPagado: 0,
        estado: estadoQueCorresponde(montoTotal, 0, datos.fechaVencimiento, "PENDIENTE"),
      });
    }
  } catch (e) {
    if (esDuplicadoDePeriodo(e)) {
      return {
        ok: false,
        error: "Ese socio ya tiene una boleta de ese período.",
      };
    }
    throw e;
  }

  revalidatePath("/panel/boletas");
  revalidatePath("/panel");
  return { ok: true };
}

export async function registrarPago(
  boletaId: string,
  monto: number
): Promise<ResultadoAccion> {
  const { apr } = await requireApr();

  if (!Number.isFinite(monto) || monto < 0) {
    return { ok: false, error: "El monto pagado no es válido." };
  }

  const fila = await db
    .select({
      id: boletas.id,
      montoTotal: boletas.montoTotal,
      fechaVencimiento: boletas.fechaVencimiento,
      estado: boletas.estado,
    })
    .from(boletas)
    .innerJoin(socios, eq(boletas.socioId, socios.id))
    .where(and(eq(boletas.id, boletaId), eq(socios.aprId, apr.id)))
    .limit(1);

  if (fila.length === 0) {
    return { ok: false, error: "No encontramos esa boleta." };
  }

  const boleta = fila[0];

  await db
    .update(boletas)
    .set({
      montoPagado: monto,
      estado: estadoQueCorresponde(
        boleta.montoTotal,
        monto,
        boleta.fechaVencimiento,
        boleta.estado as EstadoBoleta
      ),
      updatedAt: new Date(),
    })
    .where(eq(boletas.id, boletaId));

  revalidatePath("/panel/boletas");
  revalidatePath("/panel");
  return { ok: true };
}

export async function anularBoleta(boletaId: string): Promise<ResultadoAccion> {
  const { apr } = await requireApr();

  const fila = await db
    .select({ id: boletas.id })
    .from(boletas)
    .innerJoin(socios, eq(boletas.socioId, socios.id))
    .where(and(eq(boletas.id, boletaId), eq(socios.aprId, apr.id)))
    .limit(1);

  if (fila.length === 0) {
    return { ok: false, error: "No encontramos esa boleta." };
  }

  await db
    .update(boletas)
    .set({ estado: "ANULADA", updatedAt: new Date() })
    .where(eq(boletas.id, boletaId));

  revalidatePath("/panel/boletas");
  revalidatePath("/panel");
  return { ok: true };
}

export async function eliminarBoleta(
  boletaId: string
): Promise<ResultadoAccion> {
  const { apr } = await requireApr();

  const fila = await db
    .select({ id: boletas.id })
    .from(boletas)
    .innerJoin(socios, eq(boletas.socioId, socios.id))
    .where(and(eq(boletas.id, boletaId), eq(socios.aprId, apr.id)))
    .limit(1);

  if (fila.length === 0) {
    return { ok: false, error: "No encontramos esa boleta." };
  }

  await db.delete(boletas).where(eq(boletas.id, boletaId));

  revalidatePath("/panel/boletas");
  revalidatePath("/panel");
  return { ok: true };
}

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

function normalizarRut(valor: string) {
  const limpio = valor.replace(/[.\s]/g, "").toUpperCase();
  return limpio.includes("-")
    ? limpio
    : limpio.replace(/^(\d+)([\dK])$/, "$1-$2");
}

/**
 * Importa boletas desde CSV. Columnas: rut, periodo, monto, vencimiento y
 * opcionalmente lecturaAnterior y lecturaActual.
 *
 * Reimportar el mismo período actualiza en vez de duplicar: un comité que
 * corrige su planilla y vuelve a subirla espera eso, no 250 boletas repetidas.
 */
export async function importarBoletas(
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

  const iRut = col("rut", "rut socio", "rutsocio");
  const iPeriodo = col("periodo", "mes");
  const iMonto = col("monto", "montototal", "monto total", "total");
  const iVence = col("vencimiento", "fechavencimiento", "fecha vencimiento");
  const iEmision = col("emision", "fechaemision", "fecha emision");
  const iLecAnt = col("lecturaanterior", "lectura anterior");
  const iLecAct = col("lecturaactual", "lectura actual");

  if (iRut < 0 || iPeriodo < 0) {
    return {
      ok: false,
      error: "El CSV debe tener al menos las columnas: rut y periodo.",
    };
  }

  // Traemos los socios del comité de una vez: evita una consulta por línea.
  const delComite = await db.query.socios.findMany({
    where: eq(socios.aprId, apr.id),
    columns: { id: true, rut: true },
  });
  const porRut = new Map(delComite.map((s) => [normalizarRut(s.rut), s.id]));

  const omitidas: { linea: number; motivo: string }[] = [];
  const aInsertar: (typeof boletas.$inferInsert)[] = [];
  const vistos = new Set<string>();

  for (let i = 1; i < lineas.length; i++) {
    const campos = partirLinea(lineas[i]);
    const nLinea = i + 1;

    const socioId = porRut.get(normalizarRut(campos[iRut] ?? ""));
    if (!socioId) {
      omitidas.push({ linea: nLinea, motivo: `RUT no está en tu padrón: ${campos[iRut] ?? "vacío"}` });
      continue;
    }

    const periodo = normalizarPeriodo(campos[iPeriodo] ?? "");
    if (!periodo) {
      omitidas.push({ linea: nLinea, motivo: `Período inválido: ${campos[iPeriodo] ?? "vacío"}` });
      continue;
    }

    // Dos filas del mismo socio y período dentro del archivo: nos quedamos
    // con la primera y avisamos, en vez de que una pise a la otra en silencio.
    const clave = `${socioId}|${periodo}`;
    if (vistos.has(clave)) {
      omitidas.push({ linea: nLinea, motivo: "Repetida en el archivo (mismo socio y período)" });
      continue;
    }
    vistos.add(clave);

    const lecAnt = iLecAnt >= 0 ? aMonto(campos[iLecAnt] ?? "") : null;
    const lecAct = iLecAct >= 0 ? aMonto(campos[iLecAct] ?? "") : null;

    const calculo = calcularDesdeLecturas(lecAnt, lecAct, {
      cargoFijo: apr.tarifaCargoFijo,
      valorM3: apr.tarifaMetroCubico,
    });

    if (calculo && "error" in calculo) {
      omitidas.push({ linea: nLinea, motivo: calculo.error });
      continue;
    }

    const montoCargado = iMonto >= 0 ? aMonto(campos[iMonto] ?? "") : null;
    const montoTotal = calculo ? calculo.montoTotal : montoCargado;

    if (montoTotal === null) {
      omitidas.push({ linea: nLinea, motivo: "Falta el monto y no hay lecturas para calcularlo" });
      continue;
    }

    const emision = iEmision >= 0 ? aFecha(campos[iEmision] ?? "") : null;
    const vence = iVence >= 0 ? aFecha(campos[iVence] ?? "") : null;

    const fechaEmision = emision ?? new Date();
    // Sin vencimiento en el CSV, damos 30 días desde la emisión.
    const fechaVencimiento =
      vence ?? new Date(fechaEmision.getTime() + 30 * 86_400_000);

    aInsertar.push({
      socioId,
      periodo,
      montoTotal,
      montoPagado: 0,
      estado: estadoQueCorresponde(montoTotal, 0, fechaVencimiento, "PENDIENTE"),
      fechaEmision,
      fechaVencimiento,
      lecturaAnterior: lecAnt,
      lecturaActual: lecAct,
      consumoM3: calculo ? calculo.consumoM3 : null,
      cargoFijo: calculo ? calculo.cargoFijo : null,
      valorM3: calculo ? calculo.valorM3 : null,
    });
  }

  if (aInsertar.length === 0) {
    return {
      ok: false,
      error:
        omitidas.length > 0
          ? `No se pudo importar ninguna fila. Primer problema: ${omitidas[0].motivo}`
          : "No se pudo importar ninguna fila.",
    };
  }

  // Cuáles ya existían, para informar creadas vs actualizadas.
  const periodosDelArchivo = [...new Set(aInsertar.map((b) => b.periodo))];
  const yaExistian = await db
    .select({ socioId: boletas.socioId, periodo: boletas.periodo })
    .from(boletas)
    .innerJoin(socios, eq(boletas.socioId, socios.id))
    .where(
      and(eq(socios.aprId, apr.id), inArray(boletas.periodo, periodosDelArchivo))
    );

  const existentes = new Set(
    yaExistian.map((b) => `${b.socioId}|${b.periodo}`)
  );

  // No pisamos montoPagado: si el comité ya registró un pago, reimportar la
  // planilla no debe borrarlo.
  await db
    .insert(boletas)
    .values(aInsertar)
    .onConflictDoUpdate({
      target: [boletas.socioId, boletas.periodo],
      set: {
        montoTotal: sql`excluded."montoTotal"`,
        estado: sql`excluded."estado"`,
        fechaEmision: sql`excluded."fechaEmision"`,
        fechaVencimiento: sql`excluded."fechaVencimiento"`,
        lecturaAnterior: sql`excluded."lecturaAnterior"`,
        lecturaActual: sql`excluded."lecturaActual"`,
        consumoM3: sql`excluded."consumoM3"`,
        cargoFijo: sql`excluded."cargoFijo"`,
        valorM3: sql`excluded."valorM3"`,
        updatedAt: new Date(),
      },
    });

  const actualizadas = aInsertar.filter((b) =>
    existentes.has(`${b.socioId}|${b.periodo}`)
  ).length;

  revalidatePath("/panel/boletas");
  revalidatePath("/panel");

  return {
    ok: true,
    creadas: aInsertar.length - actualizadas,
    actualizadas,
    omitidas,
  };
}
