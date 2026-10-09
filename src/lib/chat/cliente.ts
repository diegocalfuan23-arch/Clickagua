"use client";

import { io } from "socket.io-client";
import { pusherClient } from "@/lib/pusher/client";

const EVENTO = "mensaje-nuevo";

/**
 * Escucha los mensajes nuevos del chat de un socio y devuelve la función que
 * deja de escuchar. Usa Pusher o el servidor Socket.IO propio según
 * NEXT_PUBLIC_CHAT_TRANSPORTE (ver lib/chat/tiempo-real.ts).
 */
export function escucharChat<T>(socioId: string, alRecibir: (mensaje: T) => void) {
  if (process.env.NEXT_PUBLIC_CHAT_TRANSPORTE !== "socketio") {
    const pusher = pusherClient();
    const canal = `private-chat-socio-${socioId}`;
    pusher.subscribe(canal).bind(EVENTO, alRecibir);
    return () => pusher.unsubscribe(canal);
  }

  const socket = io(process.env.NEXT_PUBLIC_CHAT_URL!, {
    transports: ["websocket", "polling"],
    // Se pide un token nuevo en cada (re)conexión: dura minutos y se renueva solo.
    auth: (entregar) => {
      fetch(`/api/chat/token?socioId=${encodeURIComponent(socioId)}`, {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : { token: "" }))
        .then((d: { token: string }) => entregar({ token: d.token }))
        .catch(() => entregar({ token: "" }));
    },
  });
  socket.on(EVENTO, alRecibir);
  return () => {
    socket.off(EVENTO, alRecibir);
    socket.disconnect();
  };
}
