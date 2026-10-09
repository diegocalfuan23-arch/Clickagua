import { SignJWT } from "jose";
import { pusherServer, canalChatSocio, EVENTO_MENSAJE_NUEVO } from "@/lib/pusher/server";

/**
 * El chat puede ir por Pusher (servicio administrado, por defecto) o por el
 * servidor Socket.IO propio (carpeta servicio-chat/). Se elige con
 * CHAT_TRANSPORTE=pusher|socketio en el servidor y NEXT_PUBLIC_CHAT_TRANSPORTE
 * en el navegador: pasar de uno a otro es cambiar variables, no código.
 */
export const usaSocketIo = () => process.env.CHAT_TRANSPORTE === "socketio";

export const salaChatSocio = (socioId: string) => `chat-socio-${socioId}`;

/** Publica un mensaje nuevo a quienes están escuchando el chat de ese socio. */
export async function publicarMensajeEnVivo(socioId: string, mensaje: unknown) {
  if (!usaSocketIo()) {
    await pusherServer.trigger(canalChatSocio(socioId), EVENTO_MENSAJE_NUEVO, mensaje);
    return;
  }

  const url = process.env.CHAT_URL_INTERNA;
  const secreto = process.env.CHAT_EMIT_SECRET;
  if (!url || !secreto) throw new Error("Falta CHAT_URL_INTERNA o CHAT_EMIT_SECRET.");

  const r = await fetch(new URL("/emitir", url), {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-secret": secreto },
    body: JSON.stringify({
      sala: salaChatSocio(socioId),
      evento: EVENTO_MENSAJE_NUEVO,
      datos: mensaje,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!r.ok) throw new Error(`El servicio de chat respondió ${r.status}`);
}

/** Token corto que el navegador presenta al servidor Socket.IO para entrar a una sala. */
export async function firmarTokenChat(salas: string[]) {
  const secreto = process.env.CHAT_JWT_SECRET;
  if (!secreto) throw new Error("Falta CHAT_JWT_SECRET.");
  return new SignJWT({ salas })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("facilapr")
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(new TextEncoder().encode(secreto));
}
