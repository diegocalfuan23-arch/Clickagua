import { NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { consultas } from "@/lib/db/schema";
import { exigirSecreto, respuesta } from "@/lib/interno";
import { enviarRespuestaConsulta } from "@/lib/correo/consulta";

export const dynamic = "force-dynamic";

/**
 * Gestión de las consultas del formulario de contacto, pedida por el panel de
 * super admin: responder por correo, marcar como respondida (cuando se contestó
 * por otro medio), descartar o reabrir. La escritura queda aquí, en Facilapr; el
 * panel no escribe en la base.
 */

const cuerpoSchema = z.discriminatedUnion("accion", [
  z.object({
    accion: z.literal("responder"),
    consultaId: z.string().min(1).max(60),
    asunto: z.string().trim().min(3).max(150),
    mensaje: z.string().trim().min(10).max(5000),
  }),
  z.object({
    accion: z.enum(["marcar", "descartar", "reabrir"]),
    consultaId: z.string().min(1).max(60),
    nota: z.string().trim().max(500).optional(),
  }),
]);

const ES_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function fechaCorta() {
  return new Date().toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
}

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

  const consulta = await db.query.consultas.findFirst({
    where: eq(consultas.id, datos.consultaId),
  });
  if (!consulta) return respuesta(404, { error: "No encontré esa consulta." });

  const anotar = (linea: string) =>
    [consulta.notas, `[${fechaCorta()}] ${linea}`].filter(Boolean).join("\n");

  if (datos.accion === "responder") {
    // Solo se puede responder por correo si el contacto ES un correo: quien deja
    // un teléfono se contesta por WhatsApp (y se marca aparte, sin enviar).
    if (!ES_CORREO.test(consulta.contacto.trim())) {
      return respuesta(422, {
        error:
          "El contacto no es un correo. Respóndele por el medio que dejó y márcala como respondida.",
      });
    }

    const envio = await enviarRespuestaConsulta({
      destinatario: consulta.contacto.trim(),
      asunto: datos.asunto,
      mensaje: datos.mensaje,
      consultaOriginal: consulta.mensaje,
    });
    // Si el envío falla NO se marca como respondida: seguiría pendiente de verdad.
    if (!envio.ok) {
      return respuesta(envio.sinConfigurar ? 503 : 502, { error: envio.error });
    }

    await db
      .update(consultas)
      .set({
        estado: "RESPONDIDA",
        notas: anotar(`Respondida por correo: «${datos.mensaje.slice(0, 300)}${datos.mensaje.length > 300 ? "…" : ""}»`),
        updatedAt: new Date(),
      })
      .where(eq(consultas.id, consulta.id));

    return respuesta(200, { ok: true, estado: "RESPONDIDA" });
  }

  const nuevoEstado =
    datos.accion === "reabrir" ? "NUEVA" : datos.accion === "descartar" ? "DESCARTADA" : "RESPONDIDA";
  const etiqueta =
    datos.accion === "reabrir"
      ? "Reabierta."
      : datos.accion === "descartar"
        ? "Descartada."
        : "Marcada como respondida (por otro medio).";

  await db
    .update(consultas)
    .set({
      estado: nuevoEstado,
      notas: anotar(datos.nota ? `${etiqueta} ${datos.nota}` : etiqueta),
      updatedAt: new Date(),
    })
    .where(eq(consultas.id, consulta.id));

  return respuesta(200, { ok: true, estado: nuevoEstado });
}
