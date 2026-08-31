import PusherClient from "pusher-js";

let instancia: PusherClient | null = null;

/** Una sola conexión de Pusher por pestaña, reutilizada entre componentes. */
export function pusherClient() {
  if (!instancia) {
    instancia = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
      authEndpoint: "/api/pusher/auth",
    });
  }
  return instancia;
}
