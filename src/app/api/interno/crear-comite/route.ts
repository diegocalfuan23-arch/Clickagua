import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { aprs } from "@/lib/db/schema";
import { session as sessionTable, user as userTable } from "@/lib/db/auth-schema";
import { formatearRut, normalizarRut, rutValido } from "@/lib/formato";
import { generarClave } from "@/lib/clave";
import { exigirSecreto, respuesta } from "@/lib/interno";

export const dynamic = "force-dynamic";

/**
 * Alta de un comité y de su primer administrador, pedida por el panel de super
 * admin (otra app). Toda la escritura queda AQUÍ, dentro de Facilapr, que es
 * quien conoce las reglas de sus cuentas: el super admin nunca escribe en la
 * base. Usa el mismo camino que el registro público (signUpEmail), así la clave
 * se guarda con el mismo método y el comité se crea con su hook de alta.
 *
 * Se protege con un secreto compartido (SUPERADMIN_API_SECRET): sin él, o con
 * uno corto, el endpoint ni siquiera responde datos.
 */

const cuerpoSchema = z.object({
  nombre: z.string().trim().min(3).max(160),
  rut: z.string().trim().min(8).max(14),
  comuna: z.string().trim().min(2).max(80),
  responsable: z.string().trim().min(3).max(120),
  cargo: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(160),
  plan: z.enum(["BASICO", "ESTANDAR", "PREMIUM"]).default("BASICO"),
});

export async function POST(req: NextRequest) {
  const noAutorizado = exigirSecreto(req);
  if (noAutorizado) return noAutorizado;

  const parsed = cuerpoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const campo = parsed.error.issues[0]?.path[0];
    return respuesta(400, {
      error: campo ? `Revisa el campo «${String(campo)}».` : "Datos inválidos.",
      campo,
    });
  }
  const datos = parsed.data;

  const rutNormalizado = normalizarRut(datos.rut);
  if (!rutValido(rutNormalizado)) {
    return respuesta(400, {
      error: "El RUT del comité no es válido (revisa el dígito verificador).",
      campo: "rut",
    });
  }
  // Se guarda con puntos, como lo escribe quien se registra por el formulario.
  const rut = formatearRut(rutNormalizado);

  // Un comité por RUT. Se compara normalizado: el RUT puede estar guardado con
  // o sin puntos según cómo se registró.
  const existentes = await db.query.aprs.findMany({ columns: { id: true, rut: true } });
  if (existentes.some((a) => a.rut && normalizarRut(a.rut) === rutNormalizado)) {
    return respuesta(409, { error: "Ya existe un comité con ese RUT.", campo: "rut" });
  }

  const yaTieneCuenta = await db.query.user.findFirst({
    where: eq(userTable.email, datos.email),
    columns: { id: true },
  });
  if (yaTieneCuenta) {
    return respuesta(409, { error: "Ese correo ya está registrado.", campo: "email" });
  }

  const clave = generarClave();

  try {
    await auth.api.signUpEmail({
      body: {
        email: datos.email,
        password: clave,
        name: datos.responsable,
        apr: datos.nombre,
        rutComite: rut,
        comuna: datos.comuna,
        cargo: datos.cargo,
      },
    });
  } catch {
    return respuesta(500, {
      error: "No se pudo crear la cuenta. No se guardó nada; inténtalo otra vez.",
    });
  }

  // El alta no debe dejar una sesión abierta a nombre del nuevo usuario.
  const creado = await db.query.user.findFirst({
    where: eq(userTable.email, datos.email),
    columns: { id: true, aprId: true },
  });
  if (creado) {
    await db.delete(sessionTable).where(eq(sessionTable.userId, creado.id));
    if (creado.aprId && datos.plan !== "BASICO") {
      await db.update(aprs).set({ plan: datos.plan }).where(eq(aprs.id, creado.aprId));
    }
  }

  // La clave sale una sola vez, en esta respuesta: no se guarda en claro.
  return respuesta(201, {
    ok: true,
    comite: { nombre: datos.nombre, rut, comuna: datos.comuna, plan: datos.plan },
    usuario: { nombre: datos.responsable, email: datos.email, cargo: datos.cargo },
    clave,
  });
}
