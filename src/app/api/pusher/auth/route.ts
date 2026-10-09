import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { puedeEscucharChatSocio } from "@/lib/chat/autorizacion";
import { pusherServer } from "@/lib/pusher/server";

/**
 * Autoriza la suscripción a un canal privado de chat. El nombre del canal
 * trae el socioId (private-chat-socio-<id>): solo se aprueba si quien pide
 * la suscripción es ese mismo socio, o un ADMIN del comité al que pertenece
 * — nunca otro socio ni un ADMIN de otro comité. Sin esto cualquiera con el
 * ID de un socio podría escuchar su conversación.
 */
export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return new Response("No autorizado.", { status: 401 });
  }

  // pusher-js manda el auth request como x-www-form-urlencoded, no multipart.
  const body = new URLSearchParams(await req.text());
  const socketId = body.get("socket_id") ?? "";
  const channel = body.get("channel_name") ?? "";

  const match = channel.match(/^private-chat-socio-(.+)$/);
  if (!socketId || !match) {
    return new Response("Solicitud inválida.", { status: 400 });
  }

  if (!(await puedeEscucharChatSocio(session.user, match[1]))) {
    return new Response("No autorizado.", { status: 403 });
  }

  const respuesta = pusherServer.authorizeChannel(socketId, channel);
  return Response.json(respuesta);
}
