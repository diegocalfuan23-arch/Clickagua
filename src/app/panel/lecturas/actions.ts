"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { lecturas, socios, boletas } from "@/lib/db/schema";
import { requireApr, requireAdmin } from "@/lib/apr-session";
import { crearInvitacion } from "@/lib/invitaciones";
import {
  calcularDesdeLecturas,
  estadoQueCorresponde,
  normalizarPeriodo,
  type EstadoBoleta,
} from "@/lib/boletas";

export type ResultadoAccion = { ok: true } | { ok: false; error: string };

const lecturaSchema = z.object({
  socioId: z.string().trim().min(1, "Elige un socio."),
  periodo: z.string().trim().min(1, "El período es obligatorio."),
  valor: z.number().int().min(0, "La lectura no puede ser negativa."),
  observacion: z.string().trim().max(300).optional(),
});

function aEntero(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? "").replace(/[^\d]/g, "");
  return texto === "" ? null : Number(texto);
}

/**
 * Cualquiera de los dos roles puede registrar una lectura: el operador la
 * toma en terreno, pero nada impide que el propio administrador la cargue
 * si él mismo hizo la ronda. Las dos vías quedan igual en PENDIENTE.
 */
export async function registrarLectura(
  _prev: ResultadoAccion | null,
  formData: FormData
): Promise<ResultadoAccion> {
  const { user, apr } = await requireApr();

  const parsed = lecturaSchema.safeParse({
    socioId: formData.get("socioId"),
    periodo: formData.get("periodo"),
    valor: aEntero(formData.get("valor")),
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

  const socio = await db.query.socios.findFirst({
    where: and(eq(socios.id, datos.socioId), eq(socios.aprId, apr.id)),
    columns: { id: true },
  });
  if (!socio) {
    return { ok: false, error: "Ese socio no pertenece a tu comité." };
  }

  const pendienteExistente = await db.query.lecturas.findFirst({
    where: and(
      eq(lecturas.socioId, datos.socioId),
      eq(lecturas.periodo, periodo),
      eq(lecturas.estado, "PENDIENTE")
    ),
    columns: { id: true },
  });
  if (pendienteExistente) {
    return {
      ok: false,
      error:
        "Ya hay una lectura pendiente de este socio para ese período. Espera a que se revise antes de cargar otra.",
    };
  }

  await db.insert(lecturas).values({
    socioId: datos.socioId,
    periodo,
    valor: datos.valor,
    observacion: datos.observacion ?? null,
    registradaPorId: user.id,
  });

  revalidatePath("/panel/lecturas");
  return { ok: true };
}

/**
 * Aprobar vuelca la lectura a la Boleta del período: si no existe, la crea;
 * si existe, la recalcula con la lectura actual como nueva lectura actual y
 * la anterior aprobada de este socio (o 0 si es la primera).
 */
export async function aprobarLectura(lecturaId: string): Promise<ResultadoAccion> {
  const { user, apr } = await requireAdmin();

  const lectura = await db
    .select({
      id: lecturas.id,
      socioId: lecturas.socioId,
      periodo: lecturas.periodo,
      valor: lecturas.valor,
      estado: lecturas.estado,
    })
    .from(lecturas)
    .innerJoin(socios, eq(lecturas.socioId, socios.id))
    .where(and(eq(lecturas.id, lecturaId), eq(socios.aprId, apr.id)))
    .limit(1);

  if (lectura.length === 0) {
    return { ok: false, error: "No encontramos esa lectura." };
  }
  if (lectura[0].estado !== "PENDIENTE") {
    return { ok: false, error: "Esa lectura ya fue revisada." };
  }

  const actual = lectura[0];

  // La lectura anterior aprobada más reciente de este socio, para calcular
  // el consumo. Si no hay ninguna, se asume que parte de 0.
  const anterior = await db
    .select({ valor: lecturas.valor })
    .from(lecturas)
    .where(
      and(
        eq(lecturas.socioId, actual.socioId),
        eq(lecturas.estado, "APROBADA")
      )
    )
    .orderBy(desc(lecturas.createdAt))
    .limit(1);

  const lecturaAnterior = anterior[0]?.valor ?? 0;

  const calculo = calcularDesdeLecturas(lecturaAnterior, actual.valor, {
    cargoFijo: apr.tarifaCargoFijo,
    valorM3: apr.tarifaMetroCubico,
  });

  if (calculo && "error" in calculo) {
    return { ok: false, error: calculo.error };
  }
  if (!calculo) {
    return {
      ok: false,
      error: "No se pudo calcular el consumo con esa lectura.",
    };
  }

  const fechaEmision = new Date();
  const fechaVencimiento = new Date(
    fechaEmision.getTime() + apr.diasVencimiento * 86_400_000
  );

  const boletaExistente = await db.query.boletas.findFirst({
    where: and(eq(boletas.socioId, actual.socioId), eq(boletas.periodo, actual.periodo)),
    columns: { id: true, montoPagado: true, estado: true },
  });

  if (boletaExistente) {
    await db
      .update(boletas)
      .set({
        lecturaAnterior,
        lecturaActual: actual.valor,
        consumoM3: calculo.consumoM3,
        cargoFijo: calculo.cargoFijo,
        valorM3: calculo.valorM3,
        montoTotal: calculo.montoTotal,
        estado: estadoQueCorresponde(
          calculo.montoTotal,
          boletaExistente.montoPagado,
          fechaVencimiento,
          boletaExistente.estado as EstadoBoleta
        ),
        updatedAt: new Date(),
      })
      .where(eq(boletas.id, boletaExistente.id));
  } else {
    await db.insert(boletas).values({
      socioId: actual.socioId,
      periodo: actual.periodo,
      montoTotal: calculo.montoTotal,
      montoPagado: 0,
      estado: estadoQueCorresponde(calculo.montoTotal, 0, fechaVencimiento, "PENDIENTE"),
      fechaEmision,
      fechaVencimiento,
      lecturaAnterior,
      lecturaActual: actual.valor,
      consumoM3: calculo.consumoM3,
      cargoFijo: calculo.cargoFijo,
      valorM3: calculo.valorM3,
    });
  }

  await db
    .update(lecturas)
    .set({ estado: "APROBADA", revisadaPorId: user.id, updatedAt: new Date() })
    .where(eq(lecturas.id, lecturaId));

  revalidatePath("/panel/lecturas");
  revalidatePath("/panel/boletas");
  revalidatePath("/panel");
  return { ok: true };
}

export async function rechazarLectura(
  lecturaId: string,
  motivo: string
): Promise<ResultadoAccion> {
  const { user, apr } = await requireAdmin();

  const motivoLimpio = motivo.trim();
  if (!motivoLimpio) {
    return { ok: false, error: "Indica por qué se rechaza, para que el operador sepa qué corregir." };
  }

  const lectura = await db
    .select({ id: lecturas.id, estado: lecturas.estado })
    .from(lecturas)
    .innerJoin(socios, eq(lecturas.socioId, socios.id))
    .where(and(eq(lecturas.id, lecturaId), eq(socios.aprId, apr.id)))
    .limit(1);

  if (lectura.length === 0) {
    return { ok: false, error: "No encontramos esa lectura." };
  }
  if (lectura[0].estado !== "PENDIENTE") {
    return { ok: false, error: "Esa lectura ya fue revisada." };
  }

  await db
    .update(lecturas)
    .set({
      estado: "RECHAZADA",
      revisadaPorId: user.id,
      motivoRechazo: motivoLimpio,
      updatedAt: new Date(),
    })
    .where(eq(lecturas.id, lecturaId));

  revalidatePath("/panel/lecturas");
  return { ok: true };
}

export type ResultadoInvitacion =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function generarInvitacionOperador(): Promise<ResultadoInvitacion> {
  const { apr } = await requireAdmin();
  const invitacion = await crearInvitacion(apr.id);

  const dominio = process.env.NEXT_PUBLIC_DOMINIO_RAIZ ?? "facilapr.cl";
  return { ok: true, url: `https://${dominio}/invitacion/${invitacion.codigo}` };
}
