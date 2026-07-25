import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { socios, conversaciones, mensajes } from "@/lib/db/schema";
import { sendWhatsAppText } from "@/lib/whatsapp/send-message";
import type { InboundMessageJob } from "@/lib/queue";

function normalizePhone(from: string) {
  return from.startsWith("+") ? from : `+${from}`;
}

export async function processInboundMessage(job: InboundMessageJob) {
  const yaExiste = await db.query.mensajes.findFirst({
    where: eq(mensajes.whatsappMessageId, job.whatsappMessageId),
  });
  if (yaExiste) {
    console.log(`[worker] duplicate message ${job.whatsappMessageId}, skipping`);
    return;
  }

  const telefono = normalizePhone(job.from);

  const socio = await db.query.socios.findFirst({
    where: eq(socios.telefono, telefono),
  });

  let conversacion = await db.query.conversaciones.findFirst({
    where: eq(conversaciones.telefono, telefono),
  });

  if (!conversacion) {
    const [nueva] = await db
      .insert(conversaciones)
      .values({
        telefono,
        socioId: socio?.id ?? null,
        estado: socio ? null : "AWAITING_RUT",
      })
      .returning();
    conversacion = nueva;
  } else if (socio && conversacion.socioId !== socio.id) {
    await db
      .update(conversaciones)
      .set({ socioId: socio.id, estado: null, updatedAt: new Date() })
      .where(eq(conversaciones.id, conversacion.id));
    conversacion.socioId = socio.id;
  }

  await db.insert(mensajes).values({
    conversacionId: conversacion.id,
    direccion: "ENTRANTE",
    whatsappMessageId: job.whatsappMessageId,
    contenido: job.text,
    payloadCrudo: job.rawEntry as object,
  });

  const respuesta = socio
    ? `Hola ${socio.nombre}, recibimos tu mensaje: "${job.text}". (Respuesta del agente pendiente de implementar)`
    : "No encontramos tu número registrado. ¿Puedes indicarnos tu RUT (ej: 12345678-9) para buscar tu boleta?";

  await sendWhatsAppText(job.from, respuesta);

  await db.insert(mensajes).values({
    conversacionId: conversacion.id,
    direccion: "SALIENTE",
    contenido: respuesta,
  });
}
