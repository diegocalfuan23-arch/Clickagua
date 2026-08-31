import Pusher from "pusher";

/**
 * El chat socio-directiva se entera en tiempo real vía Pusher, no polling:
 * Vercel es serverless (sin proceso persistente para mantener WebSockets
 * propios), así que un servicio administrado es la única forma de tener
 * tiempo real real sin correr un servidor aparte.
 */
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

/** Un canal privado por socio: solo ese socio y la directiva de su comité lo escuchan. */
export function canalChatSocio(socioId: string) {
  return `private-chat-socio-${socioId}`;
}

export const EVENTO_MENSAJE_NUEVO = "mensaje-nuevo";
