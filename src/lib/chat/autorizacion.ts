import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { socios } from "@/lib/db/schema";

type UsuarioChat = { id: string; rol?: string | null; aprId?: string | null };

/**
 * Quién puede escuchar el chat de un socio: ese mismo socio, o un ADMIN del
 * comité al que pertenece. Nunca otro socio ni un ADMIN de otro comité: sin
 * esta comprobación, cualquiera con el id de un socio podría leer su
 * conversación. La usan tanto Pusher como el servicio Socket.IO.
 */
export async function puedeEscucharChatSocio(user: UsuarioChat, socioId: string) {
  if (user.rol === "SOCIO") {
    const socio = await db.query.socios.findFirst({
      where: eq(socios.id, socioId),
      columns: { userId: true },
    });
    return socio?.userId === user.id;
  }

  if (user.rol === "ADMIN") {
    const socio = await db.query.socios.findFirst({
      where: eq(socios.id, socioId),
      columns: { aprId: true },
    });
    return socio?.aprId === user.aprId;
  }

  return false;
}
