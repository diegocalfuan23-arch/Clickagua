import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { mensajesSocio } from "@/lib/db/schema";
import { pusherServer, canalChatSocio, EVENTO_MENSAJE_NUEVO } from "@/lib/pusher/server";

export type MensajeChat = {
  id: string;
  remitente: "SOCIO" | "DIRECTIVA";
  contenido: string;
  createdAt: Date;
};

export async function historialChat(socioId: string): Promise<MensajeChat[]> {
  const filas = await db.query.mensajesSocio.findMany({
    where: eq(mensajesSocio.socioId, socioId),
    orderBy: [asc(mensajesSocio.createdAt)],
    limit: 200,
    columns: { id: true, remitente: true, contenido: true, createdAt: true },
  });

  return filas;
}

/**
 * Guarda el mensaje y lo publica en el canal de Pusher del socio — el envío
 * a Pusher no bloquea la respuesta al remitente si falla (fire-and-forget),
 * el mensaje ya quedó guardado y aparecerá igual la próxima vez que alguien
 * cargue el historial.
 */
export async function enviarMensajeChat({
  socioId,
  remitente,
  autorId,
  contenido,
}: {
  socioId: string;
  remitente: "SOCIO" | "DIRECTIVA";
  autorId: string | null;
  contenido: string;
}): Promise<MensajeChat> {
  const [mensaje] = await db
    .insert(mensajesSocio)
    .values({
      socioId,
      remitente,
      autorId,
      contenido,
      leidoPorSocio: remitente === "SOCIO",
      leidoPorDirectiva: remitente === "DIRECTIVA",
    })
    .returning({
      id: mensajesSocio.id,
      remitente: mensajesSocio.remitente,
      contenido: mensajesSocio.contenido,
      createdAt: mensajesSocio.createdAt,
    });

  pusherServer
    .trigger(canalChatSocio(socioId), EVENTO_MENSAJE_NUEVO, mensaje)
    .catch((error) => {
      console.error("No se pudo publicar el mensaje en Pusher:", error);
    });

  return mensaje;
}
